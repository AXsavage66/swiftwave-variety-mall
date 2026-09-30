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
  Copy
} from 'lucide-react';

// ==========================================
// 1. GOOGLE DRIVE IMAGE CDN RESOLVER
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

// Robust CSV row parser handling quotes and commas inside text
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

// Category pillars including restored "New In"
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
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showCertLightbox, setShowCertLightbox] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [copiedBank, setCopiedBank] = useState<boolean>(false);

  // Customer Checkout Details
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'minna' | 'nationwide'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Store Credentials
  const WHATSAPP_PHONE = "2349066524315";
  const BANK_NAME = "Moniepoint MFB";
  const ACCOUNT_NUMBER = "9468092000"; // Replace with client's actual bank account number
  const ACCOUNT_NAME = "Swiftwave Variety Mall Limited";

  // Dynamic Google Sheet Sync
  useEffect(() => {
    fetch(GOOGLE_SHEET_CSV_URL)
      .then((res) => res.text())
      .then((csvText) => {
        const rawLines = csvText.split('\n').filter(line => line.trim().length > 0);
        const parsed: Product[] = [];
        
        // Start from row index 1 to skip table headers
        for (let i = 1; i < rawLines.length; i++) {
          const row = parseCSVLine(rawLines[i]);
          if (!row[0] || !row[1]) continue;

          // Strip surrounding quotes if present
          const clean = (val: string) => (val || '').replace(/^["']|["']$/g, '').trim();

          const rawImages = clean(row[5])
            ? clean(row[5]).split(/[;,]/).map(u => clean(u)).filter(Boolean)
            : [];

          parsed.push({
            id: clean(row[0]) || `SW-${String(i).padStart(3, '0')}`,
            name: clean(row[1]),
            category: clean(row[2]) || 'Gadgets',
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

  // Filter Catalog
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

  // Cart Operations
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

  // WhatsApp Order Submission with Payment Status
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

*(I have attached my bank transaction receipt screenshot below)*`;

    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Top Corporate Legal Badge Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white tracking-wide">SWIFTWAVE VARIETY MALL LIMITED</span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline font-mono text-slate-400">RC: 9468092</span>
            <span className="hidden lg:inline text-slate-600">|</span>
            <span className="hidden lg:inline font-mono text-slate-400">TIN: 2622689087269</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              Shop 9 & 10, ABH Plaza, Minna
            </span>
            <button 
              onClick={() => setShowAboutModal(true)} 
              className="hover:text-blue-400 underline underline-offset-2 flex items-center gap-1 text-xs transition-colors"
            >
              <Info className="w-3 h-3" /> About Brand
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Swiftwave Variety Mall" 
                className="w-10 h-10 object-contain rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                }}
              />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 hidden items-center justify-center text-white shadow-md shadow-blue-500/20">
                <ShoppingBag className="w-5 h-5" />
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  SWIFT<span className="text-blue-600">WAVE</span>
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">
                  Variety Mall
                </p>
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
                className="w-full bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-sm rounded-full pl-10 pr-4 py-2 border border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              />
            </div>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full transition-all shadow-md shadow-blue-600/20 active:scale-95"
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
              className="w-full bg-slate-100 text-sm rounded-xl pl-9 pr-3 py-2 border border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none"
            />
          </div>

          {/* Category Filter Pills */}
          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3.5 pb-1">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-semibold px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Catalog View */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-950 text-white p-6 sm:p-10 mb-8 shadow-xl">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 text-blue-200 backdrop-blur-md mb-3 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              Verified Retail Storefront
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Everyday Essentials Built for the Way You Actually Live.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-blue-100 font-normal leading-relaxed">
              Order verified products directly from Shop 9 & 10, ABH Plaza, Minna with store pickup or swift dispatch.
            </p>
          </div>
        </section>

        {/* Catalog Meta */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
            Showing <span className="text-slate-900">{filteredProducts.length}</span> Products
          </p>
          {selectedCategory !== 'All' && (
            <button 
              onClick={() => setSelectedCategory('All')} 
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Syncing live catalog from store inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search query or switching categories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product) => {
              const displayImage = formatDriveUrl(product.images[0]);
              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-400/70 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  <div 
                    className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer"
                    onClick={() => {
                      setActiveModalProduct(product);
                      setActiveImageIndex(0);
                    }}
                  >
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-rose-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-full">
                          Sold Out
                        </span>
                      </div>
                    )}

                    {product.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                        {product.badge}
                      </span>
                    )}

                    {product.video && (
                      <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white p-1.5 rounded-full shadow-md">
                        <Video className="w-3.5 h-3.5" />
       