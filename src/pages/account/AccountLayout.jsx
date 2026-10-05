import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/layout/Breadcrumbs';
import { classNames } from '../../utils/format';
import { MapPinIcon, PackageIcon, UserIcon } from '../../components/ui/Icons';

const LINKS = [
  { to: '/account', label: 'Overview', end: true, icon: UserIcon },
  { to: '/account/orders', label: 'Orders', icon: PackageIcon },
  { to: '/account/support', label: 'Support', icon: PackageIcon },
  { to: '/account/addresses', label: 'Addresses', icon: MapPinIcon },
  { to: '/account/profile', label: 'Profile', icon: UserIcon },
];

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    notify('You have been signed out.');
    navigate('/');
  }

  const firstName = user.name?.split(' ')[0] || user.email.split('@')[0];

  return (
    <div className="dnd-container py-10">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Account' }]} />

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-8">
        <div>
          <p className="dnd-eyebrow">Your account</p>
          <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Hi, {firstName}</h1>
          <p className="mt-2 text-sm text-ink-500">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm font-medium text-ink-500 underline underline-offset-4 hover:text-ink-900"
        >
          Sign out
        </button>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[14rem_1fr] xl:gap-16">
        <nav aria-label="Account navigation">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {LINKS.map(({ to, label, end, icon: Icon }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm transition-colors',
                      isActive ? 'bg-ink-900 text-sand-100' : 'text-ink-700 hover:bg-sand-200',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
