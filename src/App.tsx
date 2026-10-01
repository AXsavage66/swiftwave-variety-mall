import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  ExternalLink, 
  ShieldCheck, 
  Sparkles, 
  Video, 
  X, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  MapPin,
  Info,
  Plus,
  Minus,
  Trash2,
  Truck,
  Building2,
  Copy,
  Image as ImageIcon
} from 'lucide-react';

// ==========================================
// 1. IMAGE & VIDEO RESOLVERS
// ==========================================
export function formatDriveUrl(url: string): string {
  if (!url) return "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80";
  
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=w800`;
  }
  
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}=w800`;
  }
  
  return url.trim();
}

// Converts YouTube or Google Drive share links into embeddable on-site players
export function getVideoEmbed(url?: string): { type: 'iframe' | 'video'; embedUrl: string } | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // YouTube Links (Standard, Shorts, or youtu.be)
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]+)/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`
    };
  }

  // Google Drive Video Links
  const driveMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`
    };
  }

  // Direct MP4 / WebM
  if (cleanUrl.match(/\.(mp4|webm|ogg)$/i)) {
    return {
      type: 'video',
      embedUrl: cleanUrl
    };
  }

  return null;
}

// Typo guard and category normalizer
export function normalizeCategory(raw: string): string {
  if (!raw) return 'Gadgets';
  const s = raw.toLowerCase().trim();

  if (s.includes('phone') || s.includes('appliance') || s.includes('accessori') || s.includes('earphone') || s.includes('case')) {
    return 'Phone Accessories';
  }
  if (s.includes('gadget') || s.includes('power bank') || s.includes('tech') || s.includes('electronic')) {
    return 'Gadgets';
  }
  if (s.includes('school') || s.includes('stationer') || s.includes('book') || s.includes('bag') || s.includes('pen')) {
    return 'School Supplies';
  }
  if (s.includes('home') || s.includes('essential') || s.includes('kitchen') || s.includes('room')) {
    return 'Home Essentials';
  }
  if (s.includes('beaut') || s.includes('cosmetic') || s.includes('skin') || s.includes('care')) {
    return 'Beauty Products';
  }
  if (s.includes('toy') || s.includes('child') || s.includes('kid')) {
    return "Children's Toys";
  }
  if (s.includes('creator') || s.includes('tool') || s.includes('ring light') || s.includes('stream') || s.includes('stand')) {
    return 'Creator Tools';
  }

  return raw.trim();
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

// ==========================================
// 2. TYPES
// ==========================================
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  images: string[];
  badge?: string;
  in_stock: boolean;
  video?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

const CATEGORIES = [
  'All',
  'New In',
  'Gadgets',
  'Phone Accessories',
  'School Supplies',
  'Home Essentials',
  'Beauty Products',
  "Children's Toys",
  'Creator Tools'
] as const;

// Permanent Live Google Sheet GViz CSV endpoint
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1XysYSGvgDR9t70VSrIwdXsN3GwzOjFmLUOfgB2s8Xbo/gviz/tq?tqx=out:csv"; 

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Media Modal States
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [mediaViewMode, setMediaViewMode] = useState<'photos' | 'video'>('photos');

  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showCertLightbox, setShowCertLightbox] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Cart & Checkout
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [copiedBank, setCopiedBank] = useState<boolean>(false);

  // Form Fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'minna' | 'nationwide'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  const WHATSAPP_PHONE = "2349066524315";
  const BANK_NAME = "Moniepoint MFB";
  const ACCOUNT_NUMBER = "9468092000";
  const ACCOUNT_NAME = "Swiftwave Variety Mall Limited";

  // Google Sheet Inventory Sync
  useEffect(() => {
    fetch(GOOGLE_SHEET_CSV_URL)
      .then((res) => res.text())
      .then((csvText) => {
        const rawLines = csvText.split('\n').filter(line => line.trim().length > 0);
        const parsed: Product[] = [];
        
        for (let i = 1; i < rawLines.length; i++) {
          const row = parseCSVLine(rawLines[i]);
          if (!row[0] || !row[1]) continue;

          const clean = (val: string) => (val || '').replace(/^["']|["']$/g, '').trim();
          const rawImages = clean(row[5])
            ? clean(row[5]).split(/[;,]/).map(u => clean(u)).filter(Boolean)
            : [];

          parsed.push({
            id: clean(row[0]) || `SW-${String(i).padStart(3, '0')}`,
            name: clean(row[1]),
            category: normalizeCategory(clean(row[2])),
            price: Number(clean(row[3]).replace(/[^0-9.-]+/g, '')) || 0,
            description: clean(row[4]),
            images: rawImages.length > 0 ? rawImages : [""],
            badge: clean(row[6]) || undefined,
            in_stock: clean(row[7]).toLowerCase() === 'true' || clean(row[7]).toLowerCase() === 'yes',
            video: clean(row[8]) || undefined,
          });
        }

        setProducts(parsed);
      })
      .catch((err) => console.error("Error loading inventory sheet:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = 
        selectedCategory === 'All' 
          ? true 
          : selectedCategory === 'New In'
            ? (p.badge?.toLowerCase() === 'new' || p.badge?.toLowerCase() === 'new in')
            : p.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => 
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const deliveryFee = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    if (deliveryMethod === 'minna') return 1500;
    return 4500;
  }, [deliveryMethod]);

  const orderTotal = cartSubtotal + deliveryFee;
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(ACCOUNT_NUMBER);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleFinalOrder = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please provide your full name and phone number.");
      return;
    }

    if (deliveryMethod !== 'pickup' && !deliveryAddress.trim()) {
      alert("Please enter your delivery destination.");
      return;
    }

    const itemsSummary = cart.map((item, idx) => 
      `${idx + 1}. ${item.product.name} (ID: ${item.product.id}) x${item.quantity} = ₦${(item.product.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const deliveryTitle = 
      deliveryMethod === 'pickup' 
        ? "Store Pickup @ ABH Plaza, Minna (FREE)"
        : deliveryMethod === 'minna'
          ? "Local Dispatch within Minna (₦1,500)"
          : "Nationwide Logistics Dispatch (₦4,500)";

    const message = `🛍️ *PAID ORDER CONFIRMATION - SWIFTWAVE MALL*
----------------------------------------
*Customer Name:* ${customerName.trim()}
*Contact Phone:* ${customerPhone.trim()}

*Fulfillment:* ${deliveryTitle}
${deliveryMethod !== 'pickup' ? `*Delivery Address:* ${deliveryAddress.trim()}\n` : ''}${orderNotes.trim() ? `*Special Notes:* ${orderNotes.trim()}\n` : ''}
*ITEMS ORDERED:*
${itemsSummary}
----------------------------------------
*Subtotal:* ₦${cartSubtotal.toLocaleString()}
*Delivery Fee:* ₦${deliveryFee.toLocaleString()}
*TOTAL PAID:* ₦${orderTotal.toLocaleString()}
----------------------------------------
*Payment Details:*
Paid into ${BANK_NAME} (${ACCOUNT_NUMBER})
Account: ${ACCOUNT_NAME}

*(Attached is my payment transfer receipt screenshot)*`;

    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const activeVideoEmbed = useMemo(() => {
    return activeModalProduct ? getVideoEmbed(activeModalProduct.video) : null;
  }, [activeModalProduct]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Top Corporate Legal Badge Bar (Dark Purple/Black) */}
      <div className="bg-[#170a2c] text-purple-200 text-xs py-2 px-4 border-b border-purple-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white tracking-wide">SWIFTWAVE VARIETY MALL LIMITED</span>
            <span className="hidden md:inline text-purple-400/40">|</span>
            <span className="hidden md:inline font-mono text-purple-300">RC: 9468092</span>
            <span className="hidden lg:inline text-purple-400/40">|</span>
            <span className="hidden lg:inline font-mono text-purple-300">TIN: 2622689087269</span>
          </div>
          <div className="flex items-center gap-4 text-purple-300">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              Shop 9 & 10, ABH Plaza, Minna
            </span>
            <button 
              onClick={() => setShowAboutModal(true)} 
              className="hover:text-white underline underline-offset-2 flex items-center gap-1 text-xs transition-colors"
            >
              <Info className="w-3 h-3" /> About Brand
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Brand Logo: Full Horizontal Viewport Layout */}
            <div className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Swiftwave Variety Mall" 
                className="h-10 sm:h-12 w-auto max-w-[200px] sm:max-w-[250px] object-contain object-left cursor-pointer"
                onClick={() => setSelectedCategory('All')}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                  }
                }}
              />
              
              {/* Fallback Text If Logo Is Missing */}
              <div className="hidden items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 to-violet-600 flex items-center justify-center text-white shadow-md font-black">
                  S
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                    SWIFT<span className="text-purple-600">WAVE</span>
                  </h1>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">
                    Variety Mall
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Search */}
            <div className="flex-1 max-w-md relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products, gadgets, essentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-sm rounded-full pl-10 pr-4 py-2 border border-transparent focus:border-purple-600 focus:ring-4 focus:ring-purple-600/10 transition-all outline-none"
              />
            </div>

            {/* Cart Drawer Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full transition-all shadow-md shadow-purple-700/20 active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="bg-emerald-500 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center -ml-1">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-3 sm:hidden relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-sm rounded-xl pl-9 pr-3 py-2 border border-transparent focus:border-purple-600 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Category Filter Pills (Purple Active States) */}
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 pb-1">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                    active
                      ? 'bg-purple-700 text-white shadow-sm shadow-purple-700/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Catalog */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Brand Hero Banner (Royal Purple Gradient) */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-6 sm:p-10 mb-8 shadow-xl border border-purple-900/40">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-purple-200 backdrop-blur-md mb-3 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              Verified Retail Storefront
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Everyday Essentials Built for the Way You Actually Live.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-purple-100/90 font-normal leading-relaxed">
              Order verified products directly from Shop 9 & 10, ABH Plaza, Minna with store pickup or swift dispatch.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-purple-500/20 to-transparent pointer-events-none"></div>
        </section>

        {/* Filter Meta Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
            Showing <span className="text-purple-900 font-black">{filteredProducts.length}</span> Products
          </p>
          {selectedCategory !== 'All' && (
            <button 
              onClick={() => setSelectedCategory('All')} 
              className="text-xs font-semibold text-purple-700 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-700 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Syncing live catalog from store inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 mt-1">
              {selectedCategory !== 'All' 
                ? `No items found in "${selectedCategory}". Products will appear here when assigned this category in your spreadsheet.`
                : "No products matched your search query."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const displayImage = formatDriveUrl(product.images[0]);
              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-950/5 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div 
                    className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer"
                    onClick={() => {
                      setActiveModalProduct(product);
                      setActiveImageIndex(0);
                      setMediaViewMode('photos');
                    }}
                  >
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-rose-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow-lg">
                          Sold Out
                        </span>
                      </div>
                    )}

                    {product.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-purple-700 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                        {product.badge}
                      </span>
                    )}

                    {product.video && (
                      <span className="absolute bottom-2.5 right-2.5 bg-purple-950/80 backdrop-blur-md text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md">
                        <Video className="w-3 h-3 text-purple-300" />
                        <span>Video</span>
                      </span>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                        <span className="text-purple-800 font-bold">{product.category}</span>
                        <span className="font-mono text-slate-500">{product.id}</span>
                      </div>

                      <h3 
                        onClick={() => {
                          setActiveModalProduct(product);
                          setActiveImageIndex(0);
                          setMediaViewMode('photos');
                        }}
                        className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-purple-700 cursor-pointer transition-colors"
                      >
                        {product.name}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                        <span className="text-base font-black text-slate-900">
                          ₦{product.price.toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={!product.in_stock}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                          product.in_stock
                            ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm shadow-purple-700/30 active:scale-95'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Modal (Photos & On-Site Video Embed Player) */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative border border-slate-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                  {activeModalProduct.id}
                </span>
                <span className="text-xs text-slate-400">• {activeModalProduct.category}</span>
              </div>
              <button
                onClick={() => setActiveModalProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              
              {/* Media Switcher: Photos vs Live Video */}
              {activeModalProduct.video && (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={() => setMediaViewMode('photos')}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${
                      mediaViewMode === 'photos'
                        ? 'bg-purple-700 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Product Photos ({activeModalProduct.images.length})</span>
                  </button>

                  <button
                    onClick={() => setMediaViewMode('video')}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${
                      mediaViewMode === 'video'
                        ? 'bg-purple-700 text-white shadow-sm'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Watch Video Demo</span>
                  </button>
                </div>
              )}

              {/* Main Media Stage */}
              {mediaViewMode === 'video' && activeVideoEmbed ? (
                <div className="relative aspect-video rounded-2xl bg-black overflow-hidden mb-4 shadow-md border border-slate-800">
                  {activeVideoEmbed.type === 'iframe' ? (
                    <iframe
                      src={activeVideoEmbed.embedUrl}
                      title={activeModalProduct.name}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <video controls autoPlay className="w-full h-full object-contain">
                      <source src={activeVideoEmbed.embedUrl} type="video/mp4" />
                      Your browser does not support HTML5 video.
                    </video>
                  )}
                </div>
              ) : (
                <div className="relative aspect-video rounded-2xl bg-slate-100 overflow-hidden mb-4">
                  <img
                    src={formatDriveUrl(activeModalProduct.images[activeImageIndex] || activeModalProduct.images[0])}
                    alt={activeModalProduct.name}
                    className="w-full h-full object-contain"
                  />

                  {activeModalProduct.images.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev === 0 ? activeModalProduct.images.length - 1 : prev - 1));
                        }}
                        className="pointer-events-auto w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev === activeModalProduct.images.length - 1 ? 0 : prev + 1));
                        }}
                        className="pointer-events-auto w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Photo Thumbnails */}
              {mediaViewMode === 'photos' && activeModalProduct.images.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {activeModalProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                        activeImageIndex === idx ? 'border-purple-600 scale-95' : 'border-slate-200 opacity-60'
                      }`}
                    >
                      <img src={formatDriveUrl(img)} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Title & Price Header */}
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900 leading-snug">{activeModalProduct.name}</h2>
                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-purple-900">
                    ₦{activeModalProduct.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Specifications Block */}
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Specifications & Details</h4>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                  {activeModalProduct.description}
                </p>
              </div>

              {/* External Source Fallback Link */}
              {activeModalProduct.video && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-purple-700 font-semibold">
                    <Video className="w-3.5 h-3.5" />
                    On-site HD Video Enabled
                  </span>
                  <a
                    href={activeModalProduct.video}
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-600 hover:underline font-bold inline-flex items-center gap-1"
                  >
                    Open Original Player <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Verified Stock @ ABH Plaza</span>
              </div>
              <button
                onClick={() => {
                  addToCart(activeModalProduct);
                  setActiveModalProduct(null);
                }}
                disabled={!activeModalProduct.in_stock}
                className={`inline-flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-all ${
                  activeModalProduct.in_stock
                    ? 'bg-purple-700 hover:bg-purple-800 text-white shadow-purple-700/30'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-slate-900">Your Shopping Cart</h3>
                <span className="text-xs bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                  {totalCartCount}
                </span>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto stroke-[1.5] mb-2 opacity-40 text-purple-600" />
                  <p className="text-sm font-medium">Your cart is empty</p>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 text-xs font-bold text-purple-700 hover:underline"
                  >
                    Browse products
                  </button>
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 items-center">
                    <img 
                      src={formatDriveUrl(product.images[0])} 
                      alt="" 
                      className="w-14 h-14 object-cover rounded-xl bg-white border border-slate-200" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                      <p className="text-xs font-mono font-semibold text-purple-700 mt-0.5">
                        ₦{(product.price * quantity).toLocaleString()}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono px-1">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(product.id)}
                      className="text-slate-400 hover:text-rose-600 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-black text-slate-900 text-base">₦{cartSubtotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <span>Proceed to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout & Direct Bank Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative border border-slate-200 shadow-2xl">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">Checkout & Payment</h3>
            <p className="text-xs text-slate-500 mb-4">Complete your transfer and submit your order details for dispatch confirmation.</p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ibrahim Mukhtar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Phone Number (WhatsApp Active)</label>
                <input
                  type="tel"
                  placeholder="e.g. 08012345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Fulfillment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      deliveryMethod === 'pickup'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mx-auto mb-1 text-purple-700" />
                    <span className="text-[11px] block">Shop Pickup</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Free</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('minna')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      deliveryMethod === 'minna'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-purple-700" />
                    <span className="text-[11px] block">Minna Delivery</span>
                    <span className="text-[10px] font-bold text-slate-600">₦1,500</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('nationwide')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      deliveryMethod === 'nationwide'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-purple-700" />
                    <span className="text-[11px] block">Nationwide</span>
                    <span className="text-[10px] font-bold text-slate-600">₦4,500</span>
                  </button>
                </div>
              </div>

              {deliveryMethod !== 'pickup' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Address & Landmark</label>
                  <input
                    type="text"
                    placeholder="Hostel, Street address, or Campus Area"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Order Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Call when dispatch arrives, preferred color"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            <div className="bg-[#170a2c] text-white rounded-2xl p-4 mb-5 space-y-2 border border-purple-900/60">
              <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase block">
                Direct Bank Transfer Details
              </span>
              
              <div className="flex justify-between items-center pt-1 border-t border-purple-950">
                <span className="text-xs text-purple-200/70">Bank Name</span>
                <span className="text-xs font-bold">{BANK_NAME}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-purple-200/70">Account Number</span>
                <button
                  type="button"
                  onClick={copyAccountNumber}
                  className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-emerald-400 hover:underline"
                >
                  <span>{ACCOUNT_NUMBER}</span>
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-purple-200/70">Account Name</span>
                <span className="text-xs font-semibold">{ACCOUNT_NAME}</span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-purple-950 text-sm">
                <span className="font-bold text-purple-200">Amount Due</span>
                <span className="font-black text-emerald-400 text-base">₦{orderTotal.toLocaleString()}</span>
              </div>
            </div>

            {copiedBank && (
              <p className="text-center text-xs text-emerald-600 font-bold mb-3 animate-fade-in">
                Account number copied to clipboard!
              </p>
            )}

            <button
              type="button"
              onClick={handleFinalOrder}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>I Have Transferred • Submit via WhatsApp</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2 leading-relaxed">
              Your formatted invoice will open directly in WhatsApp to verify your payment receipt with the store manager.
            </p>
          </div>
        </div>
      )}

      {/* Brand Identity Modal (Displays High-Res Logo Prominently) */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative border border-slate-200 shadow-2xl">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Prominent High-Resolution Logo Stage */}
            <div className="flex justify-center mb-4 bg-purple-50/60 p-4 rounded-2xl border border-purple-100">
              <img 
                src="/logo.png" 
                alt="Swiftwave Variety Mall" 
                className="h-14 sm:h-16 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-purple-700" />
              <h3 className="text-base font-bold text-slate-900">About Swiftwave Variety Mall</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Swiftwave is your modern everyday marketplace built for the way you actually live. Bringing together gadgets, home essentials, school supplies, phone accessories, beauty products, children's toys, and creator tools under one roof.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">Our Mission</span>
              <p className="text-xs text-slate-600 mt-1">
                To create stylish, affordable, and practical accessories that help students and everyday users stay organized and express their identity.
              </p>
            </div>

            <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-950 uppercase tracking-wider">
                  Corporate Registration
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" /> CAC Verified
                </span>
              </div>
              
              <p className="text-xs font-mono text-slate-700 mt-1.5 leading-relaxed">
                <span className="font-semibold text-slate-900">SWIFTWAVE VARIETY MALL LIMITED</span><br />
                RC: <span className="text-purple-700 font-bold">9468092</span> | TIN: 2622689087269
              </p>

              <button
                onClick={() => setShowCertLightbox(true)}
                className="mt-3 w-full bg-white hover:bg-purple-700 hover:text-white text-purple-700 border border-purple-200 hover:border-transparent font-bold text-xs py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-purple-500/5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>View Certificate of Incorporation</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      )}

      {/* Official CAC Certificate Lightbox Modal */}
      {showCertLightbox && (
        <div 
          className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowCertLightbox(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-xl w-full p-4 relative shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 leading-none">Federal Republic of Nigeria</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">RC: 9468092 | Incorporated April 7, 2026</p>
                </div>
              </div>
              <button
                onClick={() => setShowCertLightbox(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-3 bg-slate-50 rounded-xl p-2 flex items-center justify-center">
              <img
                src="/cac-certificate.jpg"
                alt="Swiftwave Variety Mall Limited CAC Certificate"
                className="w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Issued under Companies and Allied Matters Act 2020</span>
              <a
                href="/cac-certificate.jpg"
                target="_blank"
                rel="noreferrer"
                className="text-purple-700 hover:underline font-bold inline-flex items-center gap-1"
              >
                Open Original <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Trust-Anchored Footer (Deep Purple/Black) */}
      <footer className="bg-[#120722] text-purple-200/80 text-xs border-t border-purple-950 pt-10 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-purple-950">
            <div>
              <div className="mb-3">
                <img 
                  src="/logo.png" 
                  alt="Swiftwave" 
                  className="h-8 w-auto object-contain filter brightness-110"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <p className="text-purple-300/70 leading-relaxed text-xs max-w-sm">
                Friendly, fast, and affordable. The one-stop shop that keeps everyday life moving.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Physical Store</h4>
              <p className="leading-relaxed text-purple-300/70">
                Shop 9 & 10, ABH Plaza,<br />
                Opposite Federal University of Technology (FUTMINNA) Road,<br />
                Minna, Niger State.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Corporate Credentials</h4>
              <p className="text-purple-300/70 leading-relaxed font-mono">
                Entity: Swiftwave Variety Mall Limited<br />
                Registration No: 9468092<br />
                Tax ID: 2622689087269
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-purple-400/60">
            <p>© {new Date().getFullYear()} Swiftwave Variety Mall Limited. All rights reserved.</p>
            <div className="flex items-center gap-2 text-purple-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Certified CAC Registered Commercial Vendor</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
