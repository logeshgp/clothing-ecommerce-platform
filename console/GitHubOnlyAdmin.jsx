import { useEffect, useId, useMemo, useState } from 'react';
import { hydrateProduct, SEED_PRODUCTS } from '../src/data/products';
import { DEFAULT_STATIC_STORE, DEFAULT_VISIBILITY } from '../src/data/storeConfig';

const REPOSITORY = 'https://github.com/logeshgp/clothing-ecommerce-platform';
const PUBLISHED_FILE = 'store-data.json';
const DRAFT_KEY = 'dnd.github-admin.draft.v1';
const STORE_BASE_URL = import.meta.env.BASE_URL.replace(/console\/?$/, '');

const INITIAL_STORE = DEFAULT_STATIC_STORE;

const TABS = ['Overview', 'Products', 'Storefront', 'Offers & messages', 'Publish'];

function withDefaults(data) {
  return {
    products: Array.isArray(data.products) ? data.products : INITIAL_STORE.products,
    categories: Array.isArray(data.categories) ? data.categories : INITIAL_STORE.categories,
    collections: Array.isArray(data.collections) ? data.collections : INITIAL_STORE.collections,
    brandValues: Array.isArray(data.brandValues) ? data.brandValues : INITIAL_STORE.brandValues,
    storyBlocks: Array.isArray(data.storyBlocks) ? data.storyBlocks : INITIAL_STORE.storyBlocks,
    promos: Array.isArray(data.promos) ? data.promos : INITIAL_STORE.promos,
    announcements: Array.isArray(data.announcements)
      ? data.announcements
      : INITIAL_STORE.announcements,
    settings: {
      ...INITIAL_STORE.settings,
      ...(data.settings ?? {}),
      visibility: {
        ...DEFAULT_VISIBILITY,
        ...(data.settings?.visibility ?? {}),
      },
      whatsapp: {
        ...INITIAL_STORE.settings.whatsapp,
        ...(data.settings?.whatsapp ?? {}),
      },
    },
  };
}

function readLocalDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? withDefaults(JSON.parse(saved)) : null;
  } catch (error) {
    console.error('Could not load the saved store draft.', error);
    return null;
  }
}

function downloadJson(data) {
  const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = PUBLISHED_FILE;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function slugify(value) {
  return String(value || 'store-photo')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'store-photo';
}

export function GitHubOnlyAdmin() {
  const [store, setStore] = useState(INITIAL_STORE);
  const [publishedStore, setPublishedStore] = useState(INITIAL_STORE);
  const [tab, setTab] = useState('Overview');
  const [selectedProductId, setSelectedProductId] = useState(SEED_PRODUCTS[0]?.id ?? '');
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('');
  const [storageError, setStorageError] = useState('');
  const selectedProduct = store.products.find((product) => product.id === selectedProductId);
  const visibleProductCount = useMemo(
    () => store.products.filter((product) => product.active !== false).length,
    [store.products],
  );
  const imagePaths = useMemo(() => {
    const paths = [
      store.settings.hero?.image,
      store.settings.banner?.image,
      store.settings.homeEditorial?.image,
      ...store.products.flatMap((product) => product.colors?.map((color) => color.image) ?? []),
      ...store.collections.map((collection) => collection.image),
    ];
    return [...new Set(paths.filter((path) => typeof path === 'string' && path.startsWith('/images/')))];
  }, [store]);

  useEffect(() => {
    let cancelled = false;
    const localDraft = readLocalDraft();

    async function loadStore() {
      try {
        const response = await fetch(`${STORE_BASE_URL}store-data.json`, {
          cache: 'no-store',
        });
        if (response.ok) {
          const publishedData = withDefaults(await response.json());
          if (!cancelled) {
            setPublishedStore(publishedData);
            setStore(localDraft ?? publishedData);
          }
        } else if (response.status === 404) {
          if (!cancelled) {
            setPublishedStore(INITIAL_STORE);
            setStore(localDraft ?? INITIAL_STORE);
          }
        } else {
          throw new Error(`Could not load published store data (${response.status}).`);
        }
      } catch (error) {
        if (!cancelled) {
          setPublishedStore(INITIAL_STORE);
          setStore(localDraft ?? INITIAL_STORE);
          if (!localDraft) setStatus(error.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStore();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(store));
      setStorageError('');
    } catch (error) {
      console.error('Could not save the local store draft.', error);
      setStorageError('This browser could not save a local draft. Export the JSON before leaving.');
    }
  }, [store, dirty]);

  function updateStore(change) {
    setStore((current) => (typeof change === 'function' ? change(current) : change));
    setDirty(true);
    setStatus('Draft saved in this browser. Publish it through GitHub when ready.');
  }

  function updateSettings(patch) {
    updateStore((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
    }));
  }

  function updateVisibility(key, value) {
    updateSettings({
      visibility: { ...store.settings.visibility, [key]: value },
    });
  }

  function addProduct() {
    const id = `p-${Date.now()}`;
    const product = hydrateProduct({
      id,
      name: 'New product',
      category: store.categories[0]?.slug ?? 'pants',
      gender: 'unisex',
      price: 0,
      fit: 'regular',
      fabric: 'Combed cotton',
      blurb: '',
      released: new Date().toISOString().slice(0, 10),
      colors: [{ name: 'Black', image: '' }],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: {},
      active: true,
    });
    updateStore((current) => ({ ...current, products: [product, ...current.products] }));
    setSelectedProductId(id);
    setTab('Products');
  }

  function updateProduct(id, patch) {
    updateStore((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === id ? { ...product, ...patch } : product,
      ),
    }));
  }

  function updateProductColor(id, colorIndex, patch) {
    const product = store.products.find((item) => item.id === id);
    if (!product) return;
    const previousName = product.colors[colorIndex]?.name;
    const colors = product.colors.map((color, index) =>
      index === colorIndex ? { ...color, ...patch } : color,
    );
    const stock = patch.name && patch.name !== previousName
      ? Object.fromEntries(Object.entries(product.stock ?? {}).map(([key, quantity]) => [
          key.startsWith(`${previousName}::`)
            ? `${patch.name}::${key.slice(previousName.length + 2)}`
            : key,
          quantity,
        ]))
      : product.stock;
    updateProduct(id, { colors, stock });
  }

  function updateProductStock(id, color, size, quantity) {
    const product = store.products.find((item) => item.id === id);
    if (!product) return;
    updateProduct(id, {
      stock: { ...product.stock, [`${color}::${size}`]: numberValue(quantity) },
    });
  }

  function updateProductSizes(id, sizes) {
    const product = store.products.find((item) => item.id === id);
    if (!product) return;
    const allowed = new Set(sizes);
    const stock = Object.fromEntries(
      Object.entries(product.stock ?? {}).filter(([key]) => allowed.has(key.split('::').at(-1))),
    );
    updateProduct(id, { sizes, stock });
  }

  function removeProductColor(id, colorIndex) {
    const product = store.products.find((item) => item.id === id);
    if (!product) return;
    const color = product.colors[colorIndex];
    const colors = product.colors.filter((_, index) => index !== colorIndex);
    const stock = Object.fromEntries(
      Object.entries(product.stock ?? {}).filter(([key]) => !key.startsWith(`${color.name}::`)),
    );
    updateProduct(id, { colors, stock });
  }

  function addAnnouncement() {
    const announcement = { id: `announcement-${Date.now()}`, text: '', active: true };
    updateStore((current) => ({
      ...current,
      announcements: [...current.announcements, announcement],
    }));
  }

  function addPromo() {
    const promo = {
      code: `NEW${Math.floor(Math.random() * 900 + 100)}`,
      description: 'New offer',
      type: 'percent',
      value: 10,
      minSubtotal: 0,
      active: true,
    };
    updateStore((current) => ({ ...current, promos: [...current.promos, promo] }));
  }

  function addCollection() {
    const collection = {
      slug: `collection-${Date.now()}`,
      title: 'New collection',
      issue: '',
      tagline: '',
      description: '',
      image: '',
      productIds: [],
    };
    updateStore((current) => ({ ...current, collections: [...current.collections, collection] }));
  }

  function addWhatsAppContact() {
    updateSettings({
      whatsapp: {
        ...store.settings.whatsapp,
        enabled: true,
        contacts: [
          ...(store.settings.whatsapp.contacts ?? []),
          { id: `contact-${Date.now()}`, label: 'Store contact', number: '', enabled: true },
        ],
      },
    });
  }

  function resetDraft() {
    if (!window.confirm('Discard this browser draft and reload the currently published store?')) return;
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.error('Could not remove the local store draft.', error);
      setStorageError('Could not clear the local draft from this browser.');
      return;
    }
    setStore(publishedStore);
    setDirty(false);
    setStatus('Local draft cleared. The currently published store data is now loaded.');
  }

  function publishDraft() {
    downloadJson(store);
    setStatus(`Downloaded ${PUBLISHED_FILE}. Upload it to the repository and commit the change.`);
    setTab('Publish');
  }

  return (
    <main className="min-h-screen bg-sand-100 text-ink-900">
      <header className="bg-ink-900 px-5 py-8 text-sand-50 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sand-300">
              GitHub-managed store
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Store administration</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-sand-200">
              Edit your store here without signing in. Changes are saved as a draft in this browser.
              To publish, upload the generated store file and photos to GitHub and commit them.
            </p>
          </div>
          <a
            href="https://logeshgp.github.io/clothing-ecommerce-platform/"
            className="rounded-full border border-sand-100/40 px-4 py-2 text-sm font-medium hover:bg-sand-50/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            View storefront
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950">
          <strong>Important:</strong> this page does not sign in to GitHub or write to the repository.
          Your saved draft stays in this browser until you download it and commit it on GitHub.
          {status && <p role="status" className="mt-2">{status}</p>}
          {storageError && <p role="alert" className="mt-2 font-semibold">{storageError}</p>}
        </div>

        <nav aria-label="Store editor sections" className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              aria-current={tab === name ? 'page' : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                tab === name ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-sand-200'
              }`}
            >
              {name}
            </button>
          ))}
        </nav>

        {loading ? (
          <section className="rounded-2xl border border-sand-300 bg-white p-6" role="status">
            Loading store data…
          </section>
        ) : (
          <>
            {tab === 'Overview' && (
              <Section title="Store overview" description="Quick status and the main settings for your shop.">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Stat label="Products shown" value={`${visibleProductCount} / ${store.products.length}`} />
                  <Stat label="Categories" value={store.categories.filter((item) => item.enabled !== false).length} />
                  <Stat label="Active announcements" value={store.announcements.filter((item) => item.active !== false).length} />
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field label="Store name" value={store.settings.storeName} onChange={(value) => updateSettings({ storeName: value })} />
                  <Field label="Tagline" value={store.settings.tagline} onChange={(value) => updateSettings({ tagline: value })} />
                  <Field label="Support email" type="email" value={store.settings.supportEmail} onChange={(value) => updateSettings({ supportEmail: value })} />
                  <Field label="Currency" value={store.settings.currency} onChange={(value) => updateSettings({ currency: value })} />
                </div>
              </Section>
            )}

            {tab === 'Products' && (
              <div className="grid gap-6 lg:grid-cols-[minmax(14rem,0.7fr)_minmax(0,1.6fr)]">
                <Section title="Products" description="Edit product details, price, stock, visibility and photos.">
                  <button type="button" onClick={addProduct} className={primaryButton}>
                    Add product
                  </button>
                  <ul className="mt-4 max-h-[65vh] space-y-2 overflow-auto">
                    {store.products.map((product) => (
                      <li key={product.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedProductId(product.id)}
                          aria-pressed={selectedProductId === product.id}
                          className={`w-full rounded-xl border p-3 text-left ${
                            selectedProductId === product.id ? 'border-ink-900 bg-sand-100' : 'border-sand-300'
                          }`}
                        >
                          <span className="block font-medium">{product.name || 'Untitled product'}</span>
                          <span className="mt-1 block text-xs text-ink-500">
                            ₹{Number(product.price || 0).toLocaleString('en-IN')} · {product.active === false ? 'Hidden' : 'Visible'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section title={selectedProduct?.name ?? 'Select a product'}>
                  {selectedProduct ? (
                    <div className="space-y-5">
                      <Toggle
                        label="Show this product in the storefront"
                        checked={selectedProduct.active !== false}
                        onChange={(active) => updateProduct(selectedProduct.id, { active })}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Product name" value={selectedProduct.name} onChange={(name) => updateProduct(selectedProduct.id, { name, slug: `${selectedProduct.id}-${slugify(name)}` })} />
                        <Field label="Product slug" value={selectedProduct.slug} onChange={(slug) => updateProduct(selectedProduct.id, { slug })} />
                        <Field label="Price (₹)" type="number" min="0" value={selectedProduct.price} onChange={(price) => updateProduct(selectedProduct.id, { price: numberValue(price) })} />
                        <Field label="Compare-at price (₹)" type="number" min="0" value={selectedProduct.compareAt ?? ''} onChange={(compareAt) => updateProduct(selectedProduct.id, { compareAt: numberValue(compareAt) || null })} />
                        <SelectField label="Category" value={selectedProduct.category} onChange={(category) => updateProduct(selectedProduct.id, { category })}>
                          {store.categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
                        </SelectField>
                        <Field label="Fabric" value={selectedProduct.fabric} onChange={(fabric) => updateProduct(selectedProduct.id, { fabric })} />
                        <Field label="Fit" value={selectedProduct.fit} onChange={(fit) => updateProduct(selectedProduct.id, { fit })} />
                        <Field label="Gender" value={selectedProduct.gender} onChange={(gender) => updateProduct(selectedProduct.id, { gender })} />
                        <Field label="Available sizes (comma separated)" value={(selectedProduct.sizes ?? []).join(', ')} onChange={(value) => updateProductSizes(selectedProduct.id, value.split(',').map((size) => size.trim()).filter(Boolean))} />
                        <Field label="Tags (comma separated)" value={(selectedProduct.tags ?? []).join(', ')} onChange={(value) => updateProduct(selectedProduct.id, { tags: value.split(',').map((tag) => tag.trim()).filter(Boolean) })} />
                        <Field label="Release date" type="date" value={selectedProduct.released ?? ''} onChange={(released) => updateProduct(selectedProduct.id, { released })} />
                      </div>
                      <TextField label="Short description" value={selectedProduct.blurb} onChange={(blurb) => updateProduct(selectedProduct.id, { blurb })} />
                      <div>
                        <h3 className="font-semibold">Stock by colour and size</h3>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          {selectedProduct.colors.flatMap((color) =>
                            (selectedProduct.sizes ?? []).map((size) => {
                              const key = `${color.name}::${size}`;
                              return (
                                <Field
                                  key={key}
                                  label={`${color.name} / ${size} quantity`}
                                  type="number"
                                  min="0"
                                  value={selectedProduct.stock?.[key] ?? 0}
                                  onChange={(quantity) => updateProductStock(selectedProduct.id, color.name, size, quantity)}
                                />
                              );
                            }),
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-semibold">Product colours and photos</h3>
                          <button
                            type="button"
                            onClick={() => updateProduct(selectedProduct.id, {
                              colors: [...selectedProduct.colors, { name: `Colour ${selectedProduct.colors.length + 1}`, image: '' }],
                            })}
                            className={secondaryButton}
                          >
                            Add colour
                          </button>
                        </div>
                        {selectedProduct.colors.map((color, index) => (
                          <div key={`${selectedProduct.id}-${index}`} className="rounded-xl border border-sand-300 p-4">
                            <Field label="Colour name" value={color.name} onChange={(name) => updateProductColor(selectedProduct.id, index, { name })} />
                            <PhotoPicker
                              label={`${color.name} product photo`}
                              image={color.image}
                              onImage={(image) => updateProductColor(selectedProduct.id, index, { image })}
                            />
                            <button
                              type="button"
                              onClick={() => removeProductColor(selectedProduct.id, index)}
                              className="mt-3 text-sm font-medium text-red-700 underline underline-offset-2"
                            >
                              Remove colour
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!window.confirm(`Remove ${selectedProduct.name} from this draft?`)) return;
                          const remaining = store.products.filter((product) => product.id !== selectedProduct.id);
                          updateStore((current) => ({ ...current, products: remaining }));
                          setSelectedProductId(remaining[0]?.id ?? '');
                        }}
                        className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete product
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-ink-500">Choose a product to edit, or add a new one.</p>
                  )}
                </Section>
              </div>
            )}

            {tab === 'Storefront' && (
              <div className="space-y-6">
                <Section title="Show or hide storefront sections" description="These switches control customer-facing sections and routes.">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {Object.entries({
                      announcements: 'Announcement bar',
                      hero: 'Home hero',
                      brandValues: 'Brand values strip',
                      categories: 'Home categories',
                      featured: 'Featured products',
                      editorial: 'Editorial section',
                      newArrivals: 'New arrivals',
                      promotionalBanner: 'Promotional pop-up banner',
                      bulkOrder: 'Wholesale section and page',
                      collections: 'Collections',
                      footer: 'Store footer',
                    }).map(([key, label]) => (
                      <Toggle key={key} label={label} checked={store.settings.visibility[key] !== false} onChange={(value) => updateVisibility(key, value)} />
                    ))}
                  </div>
                </Section>

                <Section title="Home page hero" description="Main headline, supporting text, call to action and image.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {['eyebrow', 'titleLine1', 'titleLine2', 'bodyLine1', 'bodyLine2', 'caption', 'ctaLabel', 'ctaTo'].map((key) => (
                      <Field key={key} label={fieldLabel(key)} value={store.settings.hero?.[key] ?? ''} onChange={(value) => updateSettings({ hero: { ...store.settings.hero, [key]: value } })} />
                    ))}
                  </div>
                  <PhotoPicker label="Hero photo" image={store.settings.hero?.image ?? ''} onImage={(image) => updateSettings({ hero: { ...store.settings.hero, image } })} />
                </Section>

                <Section title="Promotional banner" description="Optional pop-up banner displayed to visitors.">
                  <Toggle label="Enable promotional banner" checked={store.settings.banner?.enabled === true} onChange={(enabled) => updateSettings({ banner: { ...store.settings.banner, enabled } })} />
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {['title', 'body', 'ctaLabel', 'ctaTo'].map((key) => (
                      <Field key={key} label={fieldLabel(key)} value={store.settings.banner?.[key] ?? ''} onChange={(value) => updateSettings({ banner: { ...store.settings.banner, [key]: value } })} />
                    ))}
                  </div>
                  <PhotoPicker label="Banner photo" image={store.settings.banner?.image ?? ''} onImage={(image) => updateSettings({ banner: { ...store.settings.banner, image } })} />
                </Section>

                <Section title="Home page copy and collections" description="Edit the remaining home page messages, brand values, story cards and curated collection details.">
                  <h3 className="font-semibold">Section headings and links</h3>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {Object.entries(store.settings.homeContent ?? {}).map(([key, value]) => (
                      <Field
                        key={key}
                        label={fieldLabel(key)}
                        value={value}
                        onChange={(nextValue) => updateSettings({
                          homeContent: { ...store.settings.homeContent, [key]: nextValue },
                        })}
                      />
                    ))}
                  </div>

                  <h3 className="mt-6 font-semibold">Editorial home section</h3>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {['eyebrow', 'titleLine1', 'titleLine2', 'body', 'ctaLabel', 'ctaTo'].map((key) => (
                      <Field
                        key={key}
                        label={fieldLabel(key)}
                        value={store.settings.homeEditorial?.[key] ?? ''}
                        onChange={(value) => updateSettings({
                          homeEditorial: { ...store.settings.homeEditorial, [key]: value },
                        })}
                      />
                    ))}
                  </div>
                  <PhotoPicker
                    label="Editorial photo"
                    image={store.settings.homeEditorial?.image ?? ''}
                    onImage={(image) => updateSettings({
                      homeEditorial: { ...store.settings.homeEditorial, image },
                    })}
                  />

                  <TextField
                    label="Brand values (one per line)"
                    value={(store.brandValues ?? []).join('\n')}
                    onChange={(value) => updateStore({
                      ...store,
                      brandValues: value.split('\n').map((item) => item.trim()).filter(Boolean),
                    })}
                  />

                  <h3 className="mt-6 font-semibold">Editorial story cards</h3>
                  <div className="mt-3 grid gap-4 sm:grid-cols-3">
                    {store.storyBlocks.map((block, index) => (
                      <div key={`story-${index}`} className="space-y-3 rounded-xl border border-sand-300 p-4">
                        <Field label="Card title" value={block.title} onChange={(title) => updateStore((current) => ({
                          ...current,
                          storyBlocks: current.storyBlocks.map((item, itemIndex) => itemIndex === index ? { ...item, title } : item),
                        }))} />
                        <TextField label="Card text" value={block.body} onChange={(body) => updateStore((current) => ({
                          ...current,
                          storyBlocks: current.storyBlocks.map((item, itemIndex) => itemIndex === index ? { ...item, body } : item),
                        }))} />
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold">Curated collections</h3>
                    <button type="button" onClick={addCollection} className={secondaryButton}>Add collection</button>
                  </div>
                  <div className="mt-3 space-y-4">
                    {store.collections.map((collection, index) => (
                      <div key={collection.slug} className="rounded-xl border border-sand-300 p-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {['title', 'slug', 'issue', 'tagline'].map((key) => (
                            <Field key={key} label={fieldLabel(key)} value={collection[key] ?? ''} onChange={(value) => updateStore((current) => ({
                              ...current,
                              collections: current.collections.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item),
                            }))} />
                          ))}
                        </div>
                        <TextField label="Collection description" value={collection.description} onChange={(description) => updateStore((current) => ({
                          ...current,
                          collections: current.collections.map((item, itemIndex) => itemIndex === index ? { ...item, description } : item),
                        }))} />
                        <Field label="Product IDs (comma separated)" value={(collection.productIds ?? []).join(', ')} onChange={(value) => updateStore((current) => ({
                          ...current,
                          collections: current.collections.map((item, itemIndex) => itemIndex === index ? { ...item, productIds: value.split(',').map((id) => id.trim()).filter(Boolean) } : item),
                        }))} />
                        <PhotoPicker label="Collection photo" image={collection.image} onImage={(image) => updateStore((current) => ({
                          ...current,
                          collections: current.collections.map((item, itemIndex) => itemIndex === index ? { ...item, image } : item),
                        }))} />
                        <button type="button" onClick={() => updateStore((current) => ({
                          ...current,
                          collections: current.collections.filter((_, itemIndex) => itemIndex !== index),
                        }))} className="mt-3 rounded-full border border-red-300 px-3 py-2 text-sm text-red-700">Remove collection</button>
                      </div>
                    ))}
                  </div>

                  <h3 className="mt-7 font-semibold">Collections page title and introduction</h3>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {['eyebrow', 'title'].map((key) => (
                      <Field key={key} label={fieldLabel(key)} value={store.settings.collectionsPage?.[key] ?? ''} onChange={(value) => updateSettings({
                        collectionsPage: { ...store.settings.collectionsPage, [key]: value },
                      })} />
                    ))}
                  </div>
                  <TextField label="Collections page introduction" value={store.settings.collectionsPage?.description ?? ''} onChange={(description) => updateSettings({
                    collectionsPage: { ...store.settings.collectionsPage, description },
                  })} />
                </Section>

                <Section title="Categories" description="Edit category labels and choose which categories are visible.">
                  <div className="space-y-4">
                    {store.categories.map((category, index) => (
                      <div key={category.slug} className="grid gap-3 rounded-xl border border-sand-300 p-4 sm:grid-cols-2">
                        <Field label="Category name" value={category.name} onChange={(name) => updateStore((current) => ({ ...current, categories: current.categories.map((item, itemIndex) => itemIndex === index ? { ...item, name } : item) }))} />
                        <Field label="Category slug" value={category.slug} onChange={(slug) => updateStore((current) => ({
                          ...current,
                          categories: current.categories.map((item, itemIndex) => itemIndex === index ? { ...item, slug } : item),
                          products: current.products.map((product) => product.category === category.slug ? { ...product, category: slug } : product),
                        }))} />
                        <Field label="Description" value={category.blurb} onChange={(blurb) => updateStore((current) => ({ ...current, categories: current.categories.map((item, itemIndex) => itemIndex === index ? { ...item, blurb } : item) }))} />
                        <Toggle label="Show category" checked={category.enabled !== false} onChange={(enabled) => updateStore((current) => ({ ...current, categories: current.categories.map((item, itemIndex) => itemIndex === index ? { ...item, enabled } : item) }))} />
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Prices and business details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tax rate (for example 0.05 = 5%)" type="number" min="0" step="0.01" value={store.settings.taxRate} onChange={(taxRate) => updateSettings({ taxRate: numberValue(taxRate) })} />
                    <Field label="Free shipping threshold (₹)" type="number" min="0" value={store.settings.freeShippingThreshold} onChange={(freeShippingThreshold) => updateSettings({ freeShippingThreshold: numberValue(freeShippingThreshold) })} />
                    {['sellerLegalName', 'businessAddress', 'gstin', 'grievanceOfficer', 'grievanceEmail', 'grievancePhone'].map((key) => (
                      <Field key={key} label={fieldLabel(key)} value={store.settings[key] ?? ''} onChange={(value) => updateSettings({ [key]: value })} />
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {tab === 'Offers & messages' && (
              <div className="space-y-6">
                <Section title="Announcements" description="Add messages to the rotating announcement bar.">
                  <button type="button" onClick={addAnnouncement} className={secondaryButton}>Add announcement</button>
                  <div className="mt-4 space-y-3">
                    {store.announcements.map((announcement, index) => (
                      <div key={announcement.id} className="grid gap-3 rounded-xl border border-sand-300 p-4 sm:grid-cols-[1fr_auto_auto]">
                        <Field label={`Announcement ${index + 1}`} value={announcement.text} onChange={(text) => updateStore((current) => ({ ...current, announcements: current.announcements.map((item, itemIndex) => itemIndex === index ? { ...item, text } : item) }))} />
                        <Toggle label="Enabled" checked={announcement.active !== false} onChange={(active) => updateStore((current) => ({ ...current, announcements: current.announcements.map((item, itemIndex) => itemIndex === index ? { ...item, active } : item) }))} />
                        <button type="button" onClick={() => updateStore((current) => ({ ...current, announcements: current.announcements.filter((_, itemIndex) => itemIndex !== index) }))} className="self-end rounded-full border border-sand-300 px-3 py-2 text-sm">Remove</button>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Promotions and promo codes">
                  <button type="button" onClick={addPromo} className={secondaryButton}>Add promo code</button>
                  <div className="mt-4 space-y-4">
                    {store.promos.map((promo, index) => (
                      <div key={`${promo.code}-${index}`} className="grid gap-3 rounded-xl border border-sand-300 p-4 sm:grid-cols-2">
                        {['code', 'description'].map((key) => (
                          <Field key={key} label={fieldLabel(key)} value={promo[key] ?? ''} onChange={(value) => updateStore((current) => ({ ...current, promos: current.promos.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: key === 'code' ? value.toUpperCase() : value } : item) }))} />
                        ))}
                        <SelectField label="Discount type" value={promo.type ?? 'percent'} onChange={(type) => updateStore((current) => ({ ...current, promos: current.promos.map((item, itemIndex) => itemIndex === index ? { ...item, type } : item) }))}>
                          <option value="percent">Percent off</option><option value="fixed">Flat amount off</option><option value="shipping">Free shipping</option>
                        </SelectField>
                        <Field label="Discount value" type="number" min="0" value={promo.value ?? 0} onChange={(value) => updateStore((current) => ({ ...current, promos: current.promos.map((item, itemIndex) => itemIndex === index ? { ...item, value: numberValue(value) } : item) }))} />
                        <Field label="Minimum order value (₹)" type="number" min="0" value={promo.minSubtotal ?? 0} onChange={(value) => updateStore((current) => ({ ...current, promos: current.promos.map((item, itemIndex) => itemIndex === index ? { ...item, minSubtotal: numberValue(value) } : item) }))} />
                        <Toggle label="Active" checked={promo.active !== false} onChange={(active) => updateStore((current) => ({ ...current, promos: current.promos.map((item, itemIndex) => itemIndex === index ? { ...item, active } : item) }))} />
                        <button type="button" onClick={() => updateStore((current) => ({ ...current, promos: current.promos.filter((_, itemIndex) => itemIndex !== index) }))} className="justify-self-start rounded-full border border-sand-300 px-3 py-2 text-sm">Remove promotion</button>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Wholesale orders">
                  <Toggle label="Enable wholesale discount information" checked={store.settings.bulkDiscount?.active === true} onChange={(active) => updateSettings({ bulkDiscount: { ...store.settings.bulkDiscount, active } })} />
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <Field label="Minimum pieces" type="number" min="1" value={store.settings.bulkDiscount?.minQuantity ?? 10} onChange={(value) => updateSettings({ bulkDiscount: { ...store.settings.bulkDiscount, minQuantity: numberValue(value) } })} />
                    <Field label="Discount percent" type="number" min="0" max="100" value={store.settings.bulkDiscount?.percent ?? 0} onChange={(value) => updateSettings({ bulkDiscount: { ...store.settings.bulkDiscount, percent: numberValue(value) } })} />
                    <Field label="Offer label" value={store.settings.bulkDiscount?.label ?? ''} onChange={(label) => updateSettings({ bulkDiscount: { ...store.settings.bulkDiscount, label } })} />
                  </div>
                </Section>

                <Section title="Store-wide offer">
                  <Toggle label="Enable festive offer" checked={store.settings.festiveOffer?.active === true} onChange={(active) => updateSettings({ festiveOffer: { ...store.settings.festiveOffer, active } })} />
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Field label="Offer label" value={store.settings.festiveOffer?.label ?? ''} onChange={(label) => updateSettings({ festiveOffer: { ...store.settings.festiveOffer, label } })} />
                    <Field label="Discount percent" type="number" min="0" max="100" value={store.settings.festiveOffer?.percent ?? 0} onChange={(value) => updateSettings({ festiveOffer: { ...store.settings.festiveOffer, percent: numberValue(value) } })} />
                    <TextField label="Offer note" value={store.settings.festiveOffer?.note ?? ''} onChange={(note) => updateSettings({ festiveOffer: { ...store.settings.festiveOffer, note } })} />
                  </div>
                </Section>

                <Section title="Shipping methods and prices">
                  <button
                    type="button"
                    onClick={() => updateSettings({
                      shippingMethods: [
                        ...(store.settings.shippingMethods ?? []),
                        { id: `shipping-${Date.now()}`, label: 'New delivery option', detail: '', price: 0, freeOverThreshold: false },
                      ],
                    })}
                    className={secondaryButton}
                  >
                    Add delivery option
                  </button>
                  <div className="mt-4 space-y-3">
                    {(store.settings.shippingMethods ?? []).map((method, index) => (
                      <div key={method.id ?? index} className="grid gap-3 rounded-xl border border-sand-300 p-4 sm:grid-cols-2">
                        <Field label="Delivery option" value={method.label ?? ''} onChange={(label) => updateSettings({ shippingMethods: store.settings.shippingMethods.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item) })} />
                        <Field label="Delivery estimate" value={method.detail ?? ''} onChange={(detail) => updateSettings({ shippingMethods: store.settings.shippingMethods.map((item, itemIndex) => itemIndex === index ? { ...item, detail } : item) })} />
                        <Field label="Price (₹)" type="number" min="0" value={method.price ?? 0} onChange={(value) => updateSettings({ shippingMethods: store.settings.shippingMethods.map((item, itemIndex) => itemIndex === index ? { ...item, price: numberValue(value) } : item) })} />
                        <Toggle label="Free over threshold" checked={method.freeOverThreshold === true} onChange={(freeOverThreshold) => updateSettings({ shippingMethods: store.settings.shippingMethods.map((item, itemIndex) => itemIndex === index ? { ...item, freeOverThreshold } : item) })} />
                        <button type="button" onClick={() => updateSettings({ shippingMethods: store.settings.shippingMethods.filter((_, itemIndex) => itemIndex !== index) })} className="justify-self-start rounded-full border border-sand-300 px-3 py-2 text-sm">Remove delivery option</button>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="WhatsApp purchase enquiries" description="Enabled contacts appear as customer purchase-enquiry destinations.">
                  <Toggle label="Enable WhatsApp enquiries" checked={store.settings.whatsapp?.enabled === true} onChange={(enabled) => updateSettings({ whatsapp: { ...store.settings.whatsapp, enabled } })} />
                  <button type="button" onClick={addWhatsAppContact} className={`${secondaryButton} mt-4`}>Add WhatsApp contact</button>
                  <div className="mt-4 space-y-3">
                    {(store.settings.whatsapp?.contacts ?? []).map((contact, index) => (
                      <div key={contact.id ?? index} className="grid gap-3 rounded-xl border border-sand-300 p-4 sm:grid-cols-[1fr_1fr_auto_auto]">
                        <Field label="Contact label" value={contact.label ?? ''} onChange={(label) => updateSettings({ whatsapp: { ...store.settings.whatsapp, contacts: store.settings.whatsapp.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, label } : item) } })} />
                        <Field label="WhatsApp number (country code, digits only)" inputMode="tel" value={contact.number ?? ''} onChange={(number) => updateSettings({ whatsapp: { ...store.settings.whatsapp, contacts: store.settings.whatsapp.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, number } : item) } })} />
                        <Toggle label="Enabled" checked={contact.enabled !== false} onChange={(enabled) => updateSettings({ whatsapp: { ...store.settings.whatsapp, contacts: store.settings.whatsapp.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, enabled } : item) } })} />
                        <button type="button" onClick={() => updateSettings({ whatsapp: { ...store.settings.whatsapp, contacts: store.settings.whatsapp.contacts.filter((_, itemIndex) => itemIndex !== index) } })} className="self-end rounded-full border border-sand-300 px-3 py-2 text-sm">Remove</button>
                      </div>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {tab === 'Publish' && (
              <div className="space-y-6">
                <Section title="Publish changes with GitHub" description="GitHub Pages cannot save repository files anonymously. This two-file upload method uses your normal GitHub account and does not put a token in the website.">
                  <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed">
                    <li>Click <strong>Download store data</strong>. It downloads the edited catalogue, prices, visibility, messages, offers and settings as <code>{PUBLISHED_FILE}</code>.</li>
                    <li>For each photo listed below, make a copy on your device with exactly the listed filename. Open <strong>Upload photo on GitHub</strong> beside its editor field, select that renamed copy, and commit it to <code>public/images/</code>.</li>
                    <li>Upload <code>{PUBLISHED_FILE}</code> to <code>public/</code> the first time. For later edits, open the existing file, replace its contents with the downloaded JSON, and commit.</li>
                    <li>Commit both uploads to <code>main</code> or use a pull request. GitHub Actions rebuilds the storefront; wait for Pages deployment to complete.</li>
                  </ol>
                  {imagePaths.length > 0 && (
                    <div className="mt-5 rounded-xl bg-sand-100 p-4">
                      <h3 className="font-semibold">Photo files referenced by this draft</h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {imagePaths.map((path) => <li key={path}><code>{path.split('/').at(-1)}</code></li>)}
                      </ul>
                    </div>
                  )}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button type="button" onClick={publishDraft} className={primaryButton}>Download store data</button>
                    <a href={`${REPOSITORY}/upload/main/public`} target="_blank" rel="noopener noreferrer" className={secondaryButton}>Upload store-data.json on GitHub</a>
                    <a href={`${REPOSITORY}/edit/main/public/store-data.json`} target="_blank" rel="noopener noreferrer" className={secondaryButton}>Edit published store data</a>
                    <a href={`${REPOSITORY}/upload/main/public/images`} target="_blank" rel="noopener noreferrer" className={secondaryButton}>Open photo upload folder</a>
                  </div>
                  <p className="mt-5 rounded-xl bg-sand-100 p-4 text-sm leading-relaxed">
                    After the first store-data commit, the storefront reads that committed file. Your draft is only in this browser until you download and upload it. After the Pages deployment completes, use <strong>Discard local draft</strong> to reload the newly published version. Keep a copy of the generated JSON before clearing the draft.
                  </p>
                </Section>
                <Section title="Browser draft">
                  <p className="text-sm text-ink-600">
                    {dirty ? 'There are unpublished edits in this browser.' : 'No unsaved local edits yet.'}
                  </p>
                  <button type="button" onClick={resetDraft} className="mt-4 rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                    Discard local draft
                  </button>
                </Section>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function numberValue(value) {
  return value === '' ? 0 : Number(value);
}

function fieldLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

const primaryButton = 'inline-flex items-center justify-center rounded-full bg-ink-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
const secondaryButton = 'inline-flex items-center justify-center rounded-full border border-ink-900/20 px-4 py-2.5 text-sm font-medium text-ink-900 hover:bg-sand-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';

function Section({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-sand-300 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-sand-100 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function Field({ label, onChange, ...props }) {
  const generatedId = useId();
  const id = `field-${generatedId}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <label htmlFor={id} className="block text-sm font-medium text-ink-800">
      {label}
      <input
        {...props}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 block w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10"
      />
    </label>
  );
}

function TextField({ label, value, onChange }) {
  const generatedId = useId();
  const id = `field-${generatedId}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <label htmlFor={id} className="block text-sm font-medium text-ink-800">
      {label}
      <textarea
        id={id}
        rows={3}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 block w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, children }) {
  const generatedId = useId();
  const id = `field-${generatedId}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <label htmlFor={id} className="block text-sm font-medium text-ink-800">
      {label}
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 block w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-900/10"
      >
        {children}
      </select>
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-ink-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-sand-400 accent-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      />
      {label}
    </label>
  );
}

function PhotoPicker({ label, image, onImage }) {
  const [uploadFile, setUploadFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    if (!uploadFile) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(uploadFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadFile]);

  function choosePhoto(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadFile(null);
      setFileError('Choose an image file.');
      return;
    }
    const extension = file.name.split('.').pop().toLowerCase();
    const allowed = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    if (!allowed.includes(extension)) {
      setUploadFile(null);
      setFileError('Use a JPEG, PNG, WebP or AVIF image.');
      return;
    }
    setUploadFile(file);
    setFileError('');
    const filename = `${slugify(file.name)}-${Date.now()}.${extension}`;
    onImage(`/images/${filename}`);
  }

  const imageSource = image && /^https?:\/\//i.test(image)
    ? image
    : image
    ? `${STORE_BASE_URL}${image.replace(/^\/+/, '')}`
      : '';

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-ink-800">{label}</p>
      {(preview || image) && (
        <img
          src={preview || imageSource}
          alt={`${label} preview`}
          className="mt-2 h-36 w-full max-w-xs rounded-xl border border-sand-300 object-cover"
        />
      )}
      <label className="mt-3 inline-flex cursor-pointer items-center rounded-full border border-sand-300 px-4 py-2 text-sm font-medium hover:bg-sand-100">
        Choose photo
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(event) => choosePhoto(event.target.files?.[0])}
        />
      </label>
      {fileError && <p role="alert" className="mt-2 text-sm text-red-700">{fileError}</p>}
      {image?.startsWith('/images/') && (
        <div className="mt-3 rounded-xl bg-sand-100 p-3 text-sm">
          <p>Suggested filename: <code className="font-semibold">{image.split('/').at(-1)}</code></p>
          <p className="mt-1 text-ink-600">The image path is set in this draft. Make a copy with this exact filename on your device, then select that copy on GitHub.</p>
          <a
            href={`${REPOSITORY}/upload/main/public/images`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${secondaryButton} mt-3`}
          >
            Upload photo on GitHub
          </a>
        </div>
      )}
      {image && !uploadFile && <p className="mt-2 break-all text-xs text-ink-500">Image reference: {image}</p>}
    </div>
  );
}
