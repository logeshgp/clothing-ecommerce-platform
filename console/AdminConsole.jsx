import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, assetUrl } from '@store/api/client';
import { useConsoleAuth } from './context/ConsoleAuthContext';
import ConsoleLogin from './pages/ConsoleLogin';

const TABS = [
  ['overview', 'Overview'],
  ['products', 'Products & stock'],
  ['store', 'Storefront & WhatsApp'],
  ['promotions', 'Promotions'],
  ['announcements', 'Announcements'],
];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}`;

function newProduct(category = 'pants') {
  return {
    name: '', category, gender: 'unisex', price: '', compareAt: '', fit: 'regular', fabric: '',
    blurb: '', sizes: ['M', 'L'], colors: [{ name: 'Ink', image: '' }], stock: {}, tags: [],
  };
}

export function ConsoleApp() {
  const { user, status, logout } = useConsoleAuth();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await api.adminOverview());
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user, load]);

  async function save(action, message) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await action();
      await load();
      setNotice(message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  if (status === 'loading') return <CenterMessage>Checking administrator access…</CenterMessage>;
  if (!user) return <ConsoleLogin />;
  if (user.role !== 'admin') return <CenterMessage>Administrator access is required.</CenterMessage>;

  return (
    <div className="console-shell min-h-screen">
      <header className="border-b border-sand-300 bg-sand-50">
        <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div><p className="dnd-eyebrow">Store management</p><h1 className="text-2xl font-bold">{data?.settings?.storeName || 'Admin console'}</h1></div>
          <div className="flex items-center gap-4"><span className="hidden text-sm text-ink-500 sm:inline">{user.email}</span><a href={import.meta.env.BASE_URL.replace(/console\/$/, '')} className="text-sm underline underline-offset-4">View storefront</a><button type="button" onClick={() => logout()} className="rounded-full border border-sand-300 px-4 py-2 text-sm">Sign out</button></div>
        </div>
      </header>
      <div className="mx-auto grid max-w-screen-2xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[14rem_1fr]">
        <nav aria-label="Admin sections" className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {TABS.map(([id, label]) => <button type="button" key={id} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined} className={`shrink-0 rounded-xl px-4 py-3 text-left text-sm font-medium ${tab === id ? 'bg-ink-900 text-sand-50' : 'hover:bg-sand-200'}`}>{label}</button>)}
        </nav>
        <main className="min-w-0 space-y-6">
          {notice && <p role="status" className="rounded-xl bg-moss-500/10 p-4 text-sm">{notice}</p>}
          {error && <div role="alert" className="rounded-xl border border-berry-500/30 bg-white p-4 text-sm">{error} <button type="button" onClick={load} className="ml-2 underline">Try again</button></div>}
          {!data ? <CenterMessage>Loading store data…</CenterMessage> : <>
            {tab === 'overview' && <Overview data={data} onNavigate={setTab} />}
            {tab === 'products' && <Products products={data.products ?? []} categories={data.categories ?? []} onSave={(product) => save(() => api.saveProduct(product), 'Product saved.')} onDelete={(id) => save(() => api.deleteProduct(id), 'Product removed.')} />}
            {tab === 'store' && <StoreSettings settings={data.settings} onSave={(patch) => save(() => api.updateSettings(patch), 'Store settings saved.')} busy={busy} />}
            {tab === 'promotions' && <Promotions promos={data.promos ?? []} settings={data.settings} onSavePromos={(promos) => save(() => api.savePromos(promos), 'Promotions saved.')} onSaveSettings={(patch) => save(() => api.updateSettings(patch), 'Offer settings saved.')} busy={busy} />}
            {tab === 'announcements' && <Announcements items={data.announcements ?? []} onSave={(items) => save(() => api.saveAnnouncements(items), 'Announcements saved.')} busy={busy} />}
          </>}
        </main>
      </div>
    </div>
  );
}

function Overview({ data, onNavigate }) {
  const products = data.products ?? [];
  const lowStock = products.reduce((count, product) => count + Object.values(product.stock ?? {}).filter((qty) => Number(qty) > 0 && Number(qty) < 5).length, 0);
  return <section className="space-y-6">
    <div><p className="dnd-eyebrow">Overview</p><h2 className="mt-1 text-3xl font-bold">Your store at a glance</h2></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Products" value={data.stats?.productCount ?? products.length} /><Stat label="Categories" value={data.categories?.length ?? 0} /><Stat label="Low stock variants" value={lowStock} /><Stat label="WhatsApp ordering" value={data.settings.whatsapp?.enabled ? 'Enabled' : 'Disabled'} /></div>
    <section className="console-card"><h3 className="text-lg font-semibold">Before publishing</h3><ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-700"><li>Complete legal seller and grievance details.</li><li>Verify prices, quantities, tax treatment and wholesale terms.</li><li>Enable and verify the WhatsApp contacts customers should use.</li><li>Upload product photos you own or are authorised to use.</li></ul></section>
    <div className="grid gap-3 sm:grid-cols-2"><QuickLink onClick={() => onNavigate('products')}>Manage products and stock</QuickLink><QuickLink onClick={() => onNavigate('store')}>Edit brand and WhatsApp details</QuickLink><QuickLink onClick={() => onNavigate('promotions')}>Set offers and wholesale pricing</QuickLink><QuickLink onClick={() => onNavigate('announcements')}>Edit announcements</QuickLink></div>
  </section>;
}

function Products({ products, categories, onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');
  const visible = useMemo(() => products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase())), [products, query]);
  return <section className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="dnd-eyebrow">Catalogue</p><h2 className="mt-1 text-3xl font-bold">Products & stock</h2></div><button type="button" onClick={() => setEditing(newProduct(categories[0]?.slug))} className="rounded-full bg-ink-900 px-5 py-3 text-sm font-semibold text-sand-50">Add product</button></div>
    <label className="sr-only" htmlFor="admin-product-search">Search products</label><input id="admin-product-search" className="dnd-field max-w-md" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
    <div className="overflow-x-auto rounded-2xl border border-sand-300 bg-white"><table className="console-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Quantity</th><th>Actions</th></tr></thead><tbody>{visible.map((product) => <tr key={product.id}><td><div className="flex min-w-52 items-center gap-3"><img src={assetUrl(product.colors?.[0]?.image)} alt="" className="h-14 w-12 rounded-lg bg-sand-200 object-cover" /><span>{product.name}</span></div></td><td>{categories.find((category) => category.slug === product.category)?.name ?? product.category}</td><td>₹{Number(product.price).toLocaleString('en-IN')}</td><td>{Object.values(product.stock ?? {}).reduce((sum, value) => sum + Number(value || 0), 0)}</td><td><div className="flex gap-3"><button type="button" className="underline" onClick={() => setEditing(JSON.parse(JSON.stringify(product)))}>Edit</button><button type="button" className="text-berry-500 underline" onClick={() => { if (window.confirm(`Remove ${product.name}?`)) onDelete(product.id); }}>Delete</button></div></td></tr>)}</tbody></table></div>
    {editing && <ProductEditor product={editing} categories={categories} onCancel={() => setEditing(null)} onSave={async (product) => { await onSave(product); setEditing(null); }} />}
  </section>;
}

function ProductEditor({ product: initial, categories, onCancel, onSave }) {
  const [product, setProduct] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const update = (key, value) => setProduct((current) => ({ ...current, [key]: value }));
  async function uploadPhoto(index, file) {
    if (!file) return;
    setError('');
    try {
      const { upload } = await api.uploadImage(file);
      setProduct((current) => ({ ...current, colors: current.colors.map((color, colorIndex) => colorIndex === index ? { ...color, image: upload.url } : color) }));
    } catch (uploadError) { setError(uploadError.message); }
  }
  async function submit(event) {
    event.preventDefault();
    if (!product.sizes.length || product.colors.some((color) => !color.name.trim() || !color.image)) { setError('Choose at least one size and upload a photo for every colour.'); return; }
    setBusy(true); setError('');
    try { await onSave({ ...product, id: product.id || `p-${makeId()}`, price: Number(product.price), compareAt: product.compareAt ? Number(product.compareAt) : null }); }
    catch (saveError) { setError(saveError.message); }
    finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-ink-900/60 p-3 sm:p-8"><form onSubmit={submit} className="mx-auto my-4 max-w-4xl space-y-6 rounded-3xl bg-sand-50 p-5 shadow-2xl sm:p-8">
    <div className="flex items-start justify-between"><div><p className="dnd-eyebrow">Catalogue</p><h3 className="text-2xl font-bold">{product.id ? 'Edit product' : 'New product'}</h3></div><button type="button" onClick={onCancel} aria-label="Close product editor" className="rounded-full border border-sand-300 px-3 py-1">×</button></div>
    <div className="grid gap-4 sm:grid-cols-2"><Field label="Product name" required value={product.name} onChange={(value) => update('name', value)} /><label><span className="dnd-label">Category</span><select className="dnd-field" value={product.category} onChange={(event) => update('category', event.target.value)}>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label><Field label="Price (INR)" type="number" min="1" required value={product.price} onChange={(value) => update('price', value)} /><Field label="Compare-at price (optional)" type="number" min="0" value={product.compareAt ?? ''} onChange={(value) => update('compareAt', value)} /><Field label="Fabric" value={product.fabric ?? ''} onChange={(value) => update('fabric', value)} /><Field label="Fit" value={product.fit ?? ''} onChange={(value) => update('fit', value)} /><label className="sm:col-span-2"><span className="dnd-label">Description</span><textarea className="dnd-field min-h-24" value={product.blurb ?? ''} onChange={(event) => update('blurb', event.target.value)} /></label><Field label="Sizes, comma separated" value={(product.sizes ?? []).join(', ')} onChange={(value) => update('sizes', value.split(',').map((size) => size.trim()).filter(Boolean))} /><Field label="Tags, comma separated" value={(product.tags ?? []).join(', ')} onChange={(value) => update('tags', value.split(',').map((tag) => tag.trim()).filter(Boolean))} /></div>
    <section className="space-y-3"><div className="flex items-center justify-between"><div><h4 className="font-semibold">Colour options & photos</h4><p className="text-xs text-ink-500">Upload JPEG, PNG, WebP or AVIF images (up to 4 MB).</p></div><button type="button" className="underline" onClick={() => update('colors', [...product.colors, { name: '', image: '' }])}>Add colour</button></div>{product.colors.map((color, index) => <div key={`${index}-${color.name}`} className="grid items-end gap-3 rounded-xl border border-sand-300 p-3 sm:grid-cols-[1fr_1.5fr_auto]"><Field label="Colour name" value={color.name} onChange={(value) => setProduct((current) => ({ ...current, colors: current.colors.map((item, itemIndex) => itemIndex === index ? { ...item, name: value } : item) }))} /><label><span className="dnd-label">Upload product photo</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => uploadPhoto(index, event.target.files?.[0])} /></label><div className="flex items-center gap-3">{color.image && <img src={assetUrl(color.image)} alt={`${color.name} preview`} className="h-14 w-12 rounded-lg object-cover" />}{product.colors.length > 1 && <button type="button" className="text-sm text-berry-500 underline" onClick={() => update('colors', product.colors.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>}</div></div>)}</section>
    <section className="space-y-3"><div><h4 className="font-semibold">Inventory by colour and size</h4><p className="text-xs text-ink-500">Enter the available quantity for each variant.</p></div><div className="overflow-x-auto rounded-xl border border-sand-300 bg-white"><table className="console-table"><thead><tr><th>Colour</th>{product.sizes.map((size) => <th key={size}>{size}</th>)}</tr></thead><tbody>{product.colors.map((color, index) => <tr key={`${color.name}-${index}`}><th>{color.name || 'New colour'}</th>{product.sizes.map((size) => { const key = `${color.name}::${size}`; return <td key={key}><input aria-label={`${color.name} size ${size} stock`} type="number" min="0" className="w-20 rounded-lg border border-sand-300 px-2 py-1" value={product.stock?.[key] ?? 0} onChange={(event) => setProduct((current) => ({ ...current, stock: { ...current.stock, [key]: Number(event.target.value) } }))} /></td>; })}</tr>)}</tbody></table></div></section>
    {error && <p role="alert" className="text-sm text-berry-500">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={onCancel} className="rounded-full border border-sand-300 px-5 py-3 text-sm">Cancel</button><button disabled={busy} className="rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-sand-50 disabled:opacity-60">{busy ? 'Saving…' : 'Save product'}</button></div>
  </form></div>;
}

function StoreSettings({ settings, onSave, busy }) {
  const [form, setForm] = useState(() => normalizeSettings(settings));
  const [error, setError] = useState('');
  useEffect(() => setForm(normalizeSettings(settings)), [settings]);
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const nested = (section, key, value) => setForm((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));
  async function upload(section, file) {
    if (!file) return;
    try { const { upload: saved } = await api.uploadImage(file); nested(section, 'image', saved.url); }
    catch (uploadError) { setError(uploadError.message); }
  }
  async function submit(event) { event.preventDefault(); setError(''); try { await onSave(form); } catch (saveError) { setError(saveError.message); } }
  function updateContact(index, field, value) {
    setForm((current) => ({ ...current, whatsapp: { ...current.whatsapp, contacts: current.whatsapp.contacts.map((contact, contactIndex) => contactIndex === index ? { ...contact, [field]: value } : contact) } }));
  }
  return <form onSubmit={submit} className="space-y-6"><div><p className="dnd-eyebrow">Store identity</p><h2 className="mt-1 text-3xl font-bold">Brand, storefront & contact details</h2></div>
    <section className="console-card grid gap-4 sm:grid-cols-2"><Field label="Store name" required value={form.storeName} onChange={(value) => set('storeName', value)} /><Field label="Tagline" value={form.tagline} onChange={(value) => set('tagline', value)} /><Field label="Support email" type="email" value={form.supportEmail} onChange={(value) => set('supportEmail', value)} /></section>
    <section className="console-card space-y-4"><h3 className="text-lg font-semibold">Home page hero</h3><div className="grid gap-4 sm:grid-cols-2"><Field label="Headline line 1" value={form.hero.titleLine1} onChange={(value) => nested('hero', 'titleLine1', value)} /><Field label="Headline line 2" value={form.hero.titleLine2} onChange={(value) => nested('hero', 'titleLine2', value)} /><Field label="Description line 1" value={form.hero.bodyLine1} onChange={(value) => nested('hero', 'bodyLine1', value)} /><Field label="Description line 2" value={form.hero.bodyLine2} onChange={(value) => nested('hero', 'bodyLine2', value)} /><label><span className="dnd-label">Upload hero photo</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => upload('hero', event.target.files?.[0])} /></label>{form.hero.image && <img src={assetUrl(form.hero.image)} alt="Hero image preview" className="h-28 w-44 rounded-xl object-cover" />}</div></section>
    <section className="console-card space-y-4"><h3 className="text-lg font-semibold">Promotional banner</h3><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.banner.enabled)} onChange={(event) => nested('banner', 'enabled', event.target.checked)} />Show banner</label><div className="grid gap-4 sm:grid-cols-2"><Field label="Banner title" value={form.banner.title} onChange={(value) => nested('banner', 'title', value)} /><Field label="Button label" value={form.banner.ctaLabel} onChange={(value) => nested('banner', 'ctaLabel', value)} /><label className="sm:col-span-2"><span className="dnd-label">Banner text</span><textarea className="dnd-field min-h-20" value={form.banner.body} onChange={(event) => nested('banner', 'body', event.target.value)} /></label><label><span className="dnd-label">Upload banner photo</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => upload('banner', event.target.files?.[0])} /></label>{form.banner.image && <img src={assetUrl(form.banner.image)} alt="Banner preview" className="h-28 w-44 rounded-xl object-cover" />}</div></section>
    <section className="console-card space-y-4"><h3 className="text-lg font-semibold">WhatsApp order contacts</h3><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.whatsapp.enabled)} onChange={(event) => nested('whatsapp', 'enabled', event.target.checked)} />Enable WhatsApp enquiries</label><p className="text-xs text-ink-500">Use an international number with country code and digits. Customers choose a contact and press Send in WhatsApp.</p>{form.whatsapp.contacts.map((contact, index) => <div key={contact.id || index} className="grid items-end gap-3 rounded-xl border border-sand-300 p-4 sm:grid-cols-[1fr_1.4fr_auto_auto]"><Field label="Label shown to customers" value={contact.label} onChange={(value) => updateContact(index, 'label', value)} /><Field label="WhatsApp number" type="tel" value={contact.number} onChange={(value) => updateContact(index, 'number', value)} /><label className="flex items-center gap-2 pb-3 text-sm"><input type="checkbox" checked={contact.enabled !== false} onChange={(event) => updateContact(index, 'enabled', event.target.checked)} />Enabled</label><button type="button" className="pb-3 text-sm text-berry-500 underline" onClick={() => nested('whatsapp', 'contacts', form.whatsapp.contacts.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}<button type="button" className="text-sm underline" disabled={form.whatsapp.contacts.length >= 5} onClick={() => nested('whatsapp', 'contacts', [...form.whatsapp.contacts, { id: makeId(), label: '', number: '', enabled: true }])}>Add WhatsApp number</button></section>
    <section className="console-card space-y-4"><h3 className="text-lg font-semibold">Seller and grievance information</h3><p className="text-xs text-ink-500">Complete with verified business details before publishing.</p><div className="grid gap-4 sm:grid-cols-2"><Field label="Legal seller name" value={form.sellerLegalName} onChange={(value) => set('sellerLegalName', value)} /><Field label="GSTIN, if applicable" value={form.gstin} onChange={(value) => set('gstin', value.toUpperCase())} /><Field label="Grievance officer" value={form.grievanceOfficer} onChange={(value) => set('grievanceOfficer', value)} /><Field label="Grievance email" type="email" value={form.grievanceEmail} onChange={(value) => set('grievanceEmail', value)} /><Field label="Grievance phone" type="tel" value={form.grievancePhone} onChange={(value) => set('grievancePhone', value)} /><label className="sm:col-span-2"><span className="dnd-label">Business address</span><textarea className="dnd-field min-h-20" value={form.businessAddress} onChange={(event) => set('businessAddress', event.target.value)} /></label></div></section>
    {error && <p role="alert" className="text-sm text-berry-500">{error}</p>}<button disabled={busy} className="rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-sand-50 disabled:opacity-60">{busy ? 'Saving…' : 'Save store settings'}</button>
  </form>;
}

function Promotions({ promos, settings, onSavePromos, onSaveSettings, busy }) {
  const [items, setItems] = useState(promos);
  const [bulk, setBulk] = useState(settings.bulkDiscount ?? { active: false, minQuantity: 10, percent: 0, label: 'Wholesale pricing' });
  const [offer, setOffer] = useState(settings.festiveOffer ?? { active: false, label: '', percent: 0 });
  return <form onSubmit={async (event) => { event.preventDefault(); await onSaveSettings({ bulkDiscount: bulk, festiveOffer: offer }); await onSavePromos(items); }} className="space-y-6"><div><p className="dnd-eyebrow">Pricing</p><h2 className="mt-1 text-3xl font-bold">Promotions & wholesale</h2></div>
    <section className="console-card space-y-4"><h3 className="text-lg font-semibold">Wholesale quantity offer</h3><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(bulk.active)} onChange={(event) => setBulk({ ...bulk, active: event.target.checked })} />Show wholesale offer</label><div className="grid gap-4 sm:grid-cols-3"><Field label="Minimum pieces" type="number" min="1" value={bulk.minQuantity} onChange={(value) => setBulk({ ...bulk, minQuantity: Number(value) })} /><Field label="Discount (%)" type="number" min="0" max="90" value={bulk.percent} onChange={(value) => setBulk({ ...bulk, percent: Number(value) })} /><Field label="Offer label" value={bulk.label} onChange={(value) => setBulk({ ...bulk, label: value })} /></div></section>
    <section className="console-card space-y-4"><h3 className="text-lg font-semibold">Store-wide promotion</h3><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(offer.active)} onChange={(event) => setOffer({ ...offer, active: event.target.checked })} />Enable promotion</label><div className="grid gap-4 sm:grid-cols-2"><Field label="Offer name" value={offer.label} onChange={(value) => setOffer({ ...offer, label: value })} /><Field label="Discount (%)" type="number" min="0" max="90" value={offer.percent} onChange={(value) => setOffer({ ...offer, percent: Number(value) })} /></div></section>
    <section className="console-card space-y-4"><div className="flex items-center justify-between"><h3 className="text-lg font-semibold">Promo codes</h3><button type="button" className="text-sm underline" onClick={() => setItems([...items, { id: makeId(), code: '', type: 'percent', value: 10, description: '', minSubtotal: 0, active: true }])}>Add code</button></div>{items.map((promo, index) => <div key={promo.id || index} className="grid gap-3 rounded-xl border border-sand-300 p-4 sm:grid-cols-2"><Field label="Code" value={promo.code} onChange={(value) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, code: value.toUpperCase() } : item))} /><label><span className="dnd-label">Type</span><select className="dnd-field" value={promo.type} onChange={(event) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, type: event.target.value } : item))}><option value="percent">Percent</option><option value="fixed">Fixed amount</option><option value="shipping">Shipping</option></select></label><Field label="Value" type="number" min="0" value={promo.value} onChange={(value) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, value: Number(value) } : item))} /><Field label="Minimum subtotal (INR)" type="number" min="0" value={promo.minSubtotal ?? 0} onChange={(value) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, minSubtotal: Number(value) } : item))} /><Field label="Description" value={promo.description} onChange={(value) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, description: value } : item))} /><div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={promo.active !== false} onChange={(event) => setItems(items.map((item, itemIndex) => itemIndex === index ? { ...item, active: event.target.checked } : item))} />Active</label><button type="button" className="text-sm text-berry-500 underline" onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div></div>)}</section>
    <button disabled={busy} className="rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-sand-50 disabled:opacity-60">{busy ? 'Saving…' : 'Save promotions'}</button>
  </form>;
}

function Announcements({ items: initialItems, onSave, busy }) {
  const [items, setItems] = useState(initialItems);
  useEffect(() => setItems(initialItems), [initialItems]);
  return <form onSubmit={(event) => { event.preventDefault(); onSave(items); }} className="space-y-6"><div><p className="dnd-eyebrow">Storefront messaging</p><h2 className="mt-1 text-3xl font-bold">Announcements</h2><p className="mt-2 text-sm text-ink-500">Active announcements rotate above the storefront navigation.</p></div><section className="console-card space-y-3">{items.map((item, index) => <div key={item.id || index} className="flex flex-wrap items-center gap-3 rounded-xl border border-sand-300 p-3"><label className="flex min-w-0 flex-1 items-center gap-3"><input type="checkbox" checked={item.active !== false} onChange={(event) => setItems(items.map((entry, entryIndex) => entryIndex === index ? { ...entry, active: event.target.checked } : entry))} /><span className="sr-only">Show announcement</span><input className="dnd-field" maxLength={200} value={item.text} onChange={(event) => setItems(items.map((entry, entryIndex) => entryIndex === index ? { ...entry, text: event.target.value } : entry))} aria-label="Announcement text" /></label><button type="button" className="text-sm text-berry-500 underline" onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}<button type="button" className="text-sm underline" onClick={() => setItems([...items, { id: makeId(), text: '', active: true }])}>Add announcement</button></section><button disabled={busy} className="rounded-full bg-ink-900 px-6 py-3 text-sm font-semibold text-sand-50 disabled:opacity-60">{busy ? 'Saving…' : 'Save announcements'}</button></form>;
}

function normalizeSettings(settings) {
  return { ...settings, hero: { ...(settings.hero ?? {}) }, banner: { ...(settings.banner ?? {}) }, festiveOffer: { ...(settings.festiveOffer ?? {}) }, bulkDiscount: { ...(settings.bulkDiscount ?? {}) }, whatsapp: { ...(settings.whatsapp ?? {}), contacts: Array.isArray(settings.whatsapp?.contacts) ? settings.whatsapp.contacts : [] } };
}

function Field({ label, value, onChange, type = 'text', required = false, min, max }) {
  return <label className="block"><span className="dnd-label">{label}</span><input type={type} required={required} min={min} max={max} className="dnd-field" value={value ?? ''} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Stat({ label, value }) { return <div className="console-card"><p className="dnd-eyebrow">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>; }
function QuickLink({ onClick, children }) { return <button type="button" onClick={onClick} className="rounded-2xl border border-sand-300 bg-sand-50 p-5 text-left text-sm font-semibold hover:border-ink-900">{children} →</button>; }
function CenterMessage({ children }) { return <div className="flex min-h-64 items-center justify-center p-8 text-center text-sm text-ink-500">{children}</div>; }