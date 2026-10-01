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
   