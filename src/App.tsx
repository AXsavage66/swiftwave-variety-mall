import { useState, useMemo, useEffect } from 'react';

// --- STORE CONFIGURATION ---
const STORE_WHATSAPP_NUMBER = '2349066524315';
const STORE_NAME = 'Swiftwave Variety Mall';
const STORE_LOCATION = 'Shop 9 & 10 ABH Plaza, Bosso Road, Minna';
const PROMO_BANNER = '⚡ In-Store Pickup at ABH Plaza • Nationwide Delivery Available';

// Live Google Sheet CSV Endpoint
const PUBLISHED_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ8dPEVi06B26I8COih7Iwbal1TYoWMgzzfhOw7hbgSDHjxztBFSm39SCGxjFh9FWSrJxmC9Ej8ceRW/pub?output=csv';

interface Product {
  id: string;
  name: string;
  category: 'gadgets' | 'Household & Daily Essentials';
  price: number;
  description: string;
  image: string;
  badge?: string;
}

// Converts any standard Google Drive share link into a direct viewable image link
function normalizeImageUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.trim()) return '';
  const url = rawUrl.trim();

  // Matches Google Drive links: /file/d/ID, id=ID, or /d/ID
  const driveMatch =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    url.match(/\/d\/([a-zA-Z0-9_-]+)/);

  if (driveMatch && driveMatch[1]) {
    const fileId = driveMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
  }

  return url;
}

// Default offline fallback items
const DEFAULT_ITEMS: Product[] = [
  {
    id: 'g1',
    name: 'itel Energy POWER GO PRO',
    category: 'gadgets',
    price: 115000,
    description: 'Supports dual fast charging up to 100W via Solar panels and USB-C.',
    image: '/images/itel-power-go.jpg',
    badge: 'Popular',
  },
  {
    id: 'g2',
    name: 'Data Cable Set',
    category: 'gadgets',
    price: 3500,
    description: 'Multiple adapters (USB-A, Micro-USB, and Lightning) for different devices.',
    image: '/images/data-cable-set.jpg',
  },
  {
    id: 'g3',
    name: 'Multipurpose Foldable Stand Charging Cable',
    category: 'gadgets',
    price: 4000,
    description: 'Supports ultra-fast power delivery up to 240W.',
    image: '/images/stand-charging-cable.jpg',
  },
  {
    id: 'g4',
    name: 'TWS Clip-On Sports Earphones',
    category: 'gadgets',
    price: 13000,
    description: 'Noise reduction, with pocket charging case.',
    image: '/images/clip-earphones.jpg',
  },
  {
    id: 'h1',
    name: 'Portable Fabric Wardrobe',
    category: 'Household & Daily Essentials',
    price: 28000,
    description: 'Durable steel pipe frame, dustproof cover, multi-shelf storage.',
    image: '/images/fabric-wardrobe.jpg',
    badge: 'Essential',
  },
  {
    id: 'h2',
    name: 'Fish Soap Holder',
    category: 'Household & Daily Essentials',
    price: 1500,
    description: 'Double-layer self-draining design.',
    image: '/images/fish-soap-holder.jpg',
    badge: 'Bestseller',
  },
  {
    id: 'h3',
    name: '3-in-1 collapsible cutting board',
    category: 'Household & Daily Essentials',
    price: 5500,
    description: 'Used as a chopping board, washing tub and storage basket.',
    image: '/images/cutting-board.jpg',
  },
];

// Lightweight zero-dependency CSV parser
function parseGoogleSheetCSV(csvText: string): Product[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const products: Product[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    if (cols.length >= 4 && cols[0] && cols[1]) {
      const rawCategory = (cols[2] || '').toLowerCase();
      const category: 'gadgets' | 'Household & Daily Essentials' =
        rawCategory.includes('gadget') ? 'gadgets' : 'Household & Daily Essentials';

      products.push({
        id: cols[0],
        name: cols[1],
        category,
        price: Number((cols[3] || '0').replace(/[^0-9.-]+/g, '')) || 0,
        description: cols[4] || '',
        image: normalizeImageUrl(cols[5] || ''),
        badge: cols[6] || undefined,
      });
    }
  }
  return products;
}

export default function App() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_ITEMS);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'gadgets' | 'Household & Daily Essentials'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Enlarged Image Modal
  const [enlargedProduct, setEnlargedProduct] = useState<Product | null>(null);

  // Customer form state
  const [customerName, setCustomerName] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch live inventory from published Google Sheet
  useEffect(() => {
    setIsLoading(true);
    fetch(`${PUBLISHED_CSV_URL}&_t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('Network error');
        return res.text();
      })
      .then((csv) => {
        const parsed = parseGoogleSheetCSV(csv);
        if (parsed.length > 0) {
          setProducts(parsed);
        }
      })
      .catch((err) => {
        console.warn('Using local fallback items:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesCategory = activeTab === 'all' || item.category === activeTab;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeTab, searchQuery]);

  const addToCart = (productId: string) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[productId] > 1) {
        updated[productId] -= 1;
      } else {
        delete updated[productId];
      }
      return updated;
    });
  };

  const deleteFromCart = (productId: string) => {
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });
  };

  const totalItemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const cartTotalAmount = Object.entries(cart).reduce((sum, [id, qty]) => {
    const item = products.find((p) => p.id === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const handleSendWhatsAppOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (fulfillmentType === 'delivery' && !deliveryLocation.trim()) {
      setFormError('Please enter your delivery address / town.');
      return;
    }

    setFormError('');

    const itemizedList = Object.entries(cart)
      .map(([id, qty]) => {
        const item = products.find((p) => p.id === id);
        if (!item) return null;
        return `• ${qty}x ${item.name} — ₦${(item.price * qty).toLocaleString()}`;
      })
      .filter(Boolean)
      .join('\n');

    const fulfillmentText =
      fulfillmentType === 'pickup'
        ? `🏢 *Fulfillment:* In-Store Pickup (${STORE_LOCATION})`
        : `🚚 *Fulfillment:* Delivery to: ${deliveryLocation.trim()}`;

    const message = [
      `*NEW ORDER — ${STORE_NAME}*`,
      fulfillmentText,
      `---------------------------------`,
      `*ORDERED ITEMS:*`,
      itemizedList,
      `---------------------------------`,
      `💰 *TOTAL DUE:* ₦${cartTotalAmount.toLocaleString()}`,
      `---------------------------------`,
      `👤 *CUSTOMER DETAILS:*`,
      `• *Name:* ${customerName.trim()}`,
      orderNotes.trim() ? `• *Notes:* ${orderNotes.trim()}` : null,
      `• *Payment:* Bank Transfer on Confirmation`,
      `---------------------------------`,
      `_Please confirm item availability and send payment account details._`,
    ]
      .filter(Boolean)
      .join('\n');

    const whatsappUrl = `https://wa.me/${STORE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-32">
      {/* Top Banner */}
      <div className="bg-emerald-700 px-4 py-1.5 text-center text-xs font-semibold text-white">
        {PROMO_BANNER}
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900">{STORE_NAME}</h1>
            <p className="text-[11px] font-medium text-slate-500 line-clamp-1">
              📍 {STORE_LOCATION}
            </p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition active:scale-95"
          >
            <span>Cart</span>
            {totalItemsCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-xl px-4 pt-4">
        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search power banks, cables, irons..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-xs outline-none focus:border-slate-900"
          />
          <svg className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Categories tied to Shop 9 and Shop 10 */}
        <div className="mb-4 flex gap-1.5 rounded-xl bg-slate-200/80 p-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 rounded-lg py-2 text-center text-[11px] font-bold transition ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Stock
          </button>
          <button
            onClick={() => setActiveTab('gadgets')}
            className={`flex-1 rounded-lg py-2 text-center text-[11px] font-bold transition ${
              activeTab === 'gadgets' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📱 Shop 9: Gadgets
          </button>
          <button
            onClick={() => setActiveTab('Household & Daily Essentials')}
            className={`flex-1 rounded-lg py-2 text-center text-[11px] font-bold transition ${
              activeTab === 'Household & Daily Essentials' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏠 Shop 10: Essentials
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <p className="text-center text-[11px] text-slate-400 py-1">Updating stock list...</p>
        )}

        {/* Product Cards */}
        <div className="grid gap-3">
          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center">
              <p className="text-xs font-medium text-slate-500">No items match your search.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const currentQty = cart[product.id] || 0;
              return (
                <div
                  key={product.id}
                  className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs transition hover:border-slate-300"
                >
                  {/* Thumbnail — Tap to Enlarge */}
                  <div
                    onClick={() => setEnlargedProduct(product)}
                    className="group relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-100 bg-slate-100"
                    title="Tap to enlarge"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/></svg>';
                      }}
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    {product.badge && (
                      <span className="absolute bottom-1 left-1 rounded bg-slate-900/80 px-1 py-0.5 text-[8px] font-bold text-white backdrop-blur-xs">
                        {product.badge}
                      </span>
                    )}
                    <div className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/40 text-[9px] text-white opacity-80">
                      🔍
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h2 className="text-xs font-bold text-slate-900 line-clamp-1">{product.name}</h2>
                      <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-900">
                        ₦{product.price.toLocaleString()}
                      </span>

                      {/* Add/Quantity Buttons */}
                      {currentQty === 0 ? (
                        <button
                          onClick={() => addToCart(product.id)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-white transition active:scale-95"
                        >
                          + Add
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold shadow-xs active:scale-90"
                          >
                            -
                          </button>
                          <span className="w-3 text-center text-xs font-bold text-slate-900">{currentQty}</span>
                          <button
                            onClick={() => addToCart(product.id)}
                            className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-xs font-bold text-white shadow-xs active:scale-90"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalItemsCount > 0 && !isDrawerOpen && (
        <div className="fixed bottom-4 left-0 right-0 z-30 px-4">
          <div className="mx-auto flex max-w-xl items-center justify-between rounded-2xl bg-slate-950 p-3.5 text-white shadow-xl">
            <div>
              <p className="text-[11px] text-slate-400">{totalItemsCount} item{totalItemsCount > 1 ? 's' : ''} in cart</p>
              <p className="text-sm font-extrabold text-white">₦{cartTotalAmount.toLocaleString()}</p>
            </div>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-600 active:scale-95"
            >
              <span>View Order</span>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ENLARGED IMAGE MODAL */}
      {enlargedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs transition-opacity"
          onClick={() => setEnlargedProduct(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEnlargedProduct(null)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/90 text-sm font-bold text-slate-700 shadow-sm active:scale-90"
            >
              ✕
            </button>

            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 flex items-center justify-center">
              <img
                src={enlargedProduct.image}
                alt={enlargedProduct.name}
                onError={(e) => {
                  e.currentTarget.src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/></svg>';
                }}
                className="h-full w-full object-contain"
              />
              {enlargedProduct.badge && (
                <span className="absolute bottom-2 left-2 rounded-lg bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
                  {enlargedProduct.badge}
                </span>
              )}
            </div>

            <div className="mt-3">
              <h3 className="text-sm font-extrabold text-slate-900 leading-snug">{enlargedProduct.name}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed max-h-24 overflow-y-auto">
                {enlargedProduct.description}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
              <div>
                <p className="text-[10px] font-medium text-slate-400">Price</p>
                <span className="text-base font-extrabold text-slate-900">
                  ₦{enlargedProduct.price.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => {
                  addToCart(enlargedProduct.id);
                  setEnlargedProduct(null);
                }}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 active:scale-95"
              >
                + Add to Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer & Order Form */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Review Your Order</h3>
                <p className="text-[11px] text-slate-500">Fast fulfillment for Minna & nationwide orders</p>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Cart Items */}
            <div className="divide-y divide-slate-100 py-2">
              {Object.entries(cart).map(([id, qty]) => {
                const item = products.find((p) => p.id === id);
                if (!item) return null;
                return (
                  <div key={id} className="flex items-center justify-between py-2.5">
                    <div className="pr-2">
                      <p className="text-xs font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-500">
                        ₦{item.price.toLocaleString()} × {qty}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        ₦{(item.price * qty).toLocaleString()}
                      </span>
                      <button
                        onClick={() => deleteFromCart(id)}
                        className="text-slate-400 hover:text-red-500 ml-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-b border-slate-100 py-2.5">
              <span className="text-xs font-bold text-slate-600">Total Due</span>
              <span className="text-base font-extrabold text-slate-950">₦{cartTotalAmount.toLocaleString()}</span>
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleSendWhatsAppOrder} className="mt-3 space-y-2.5">
              {formError && (
                <p className="rounded-lg bg-red-50 p-2 text-[11px] font-semibold text-red-600">{formError}</p>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Ibrahim Giwa"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-900"
                />
              </div>

              {/* Fulfillment Type Toggle */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">How will you receive it? *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('pickup')}
                    className={`rounded-xl border p-2 text-left text-xs font-semibold transition ${
                      fulfillmentType === 'pickup'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    🏢 In-Store Pickup
                    <span className="block text-[10px] font-normal text-slate-500">Shop 9 & 10 ABH Plaza</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('delivery')}
                    className={`rounded-xl border p-2 text-left text-xs font-semibold transition ${
                      fulfillmentType === 'delivery'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    🚚 Delivery / Waybill
                    <span className="block text-[10px] font-normal text-slate-500">Minna or Nationwide</span>
                  </button>
                </div>
              </div>

              {/* Address Field — Conditional */}
              {fulfillmentType === 'delivery' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700">Delivery Address / Destination *</label>
                  <input
                    type="text"
                    required
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    placeholder="e.g. Bosso, Maitumbi, Abuja, or Kaduna"
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700">Item Notes (Optional)</label>
                <input
                  type="text"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Black color, or urgent dispatch"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-slate-900"
                />
              </div>

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md shadow-emerald-600/20 active:scale-98"
              >
                <span>Send Order to WhatsApp</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}