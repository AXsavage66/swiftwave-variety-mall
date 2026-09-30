import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  ExternalLink, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  Video, 
  X, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  MapPin,
  Info
} from 'lucide-react';

// ==========================================
// 1. IMAGE FORMATTING UTILITY
// ==========================================
export function formatDriveUrl(url: string): string {
  if (!url) return "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80";
  
  // Handles standard Google Drive share links
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const fileId = match[1];
    // Google's direct CDN thumbnail endpoint (supports high resolution)
    return `https://lh3.googleusercontent.com/d/${fileId}=w800`;
  }
  
  // Handles direct drive ID strings or open id query links
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}=w800`;
  }
  
  return url.trim();
}

// ==========================================
// 2. TYPES & DATA CONTRACTS
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

// 7 Official Brand Pillars
const CATEGORIES = [
  'All',
  'Gadgets',
  'Phone Accessories',
  'School Supplies',
  'Home Essentials',
  'Beauty Products',
  "Children's Toys",
  'Creator Tools'
] as const;

// Paste your published Google Sheet CSV URL here:
// File -> Share -> Publish to web -> Format: Comma-separated values (.csv)
const GOOGLE_SHEET_CSV_URL = ""; 

// Fallback catalog
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "SW-001",
    name: "itel Energy POWER GO PRO 100W",
    category: "Gadgets",
    price: 115000,
    description: "Heavy-duty 100W ultra-fast portable power bank with solar input and dual Type-C PD support.",
    images: ["https://images.unsplash.com/photo-1609592424364-db0cb5b09040?auto=format&fit=crop&w=800&q=80"],
    badge: "Bestseller",
    in_stock: true
  },
  {
    id: "SW-002",
    name: "Clip-on Wireless ANC Earphones",
    category: "Phone Accessories",
    price: 13000,
    description: "Open-ear ergonomic fit with active ENC noise reduction and extended battery performance.",
    images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80"],
    badge: "Popular",
    in_stock: true
  },
  {
    id: "SW-003",
    name: "RGB Studio Creator Ring Light + 2.1m Stand",
    category: "Creator Tools",
    price: 24500,
    description: "Multi-color temperature controls with 3 phone mounts and remote shutter for live streaming.",
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"],
    badge: "New",
    in_stock: true
  }
];

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(Boolean(GOOGLE_SHEET_CSV_URL));

  // Store WhatsApp contact line
  const WHATSAPP_PHONE = "2349066524315"; 

  // Dynamic Google Sheet Sync
  useEffect(() => {
    if (!GOOGLE_SHEET_CSV_URL) return;

    fetch(GOOGLE_SHEET_CSV_URL)
      .then((res) => res.text())
      .then((csvText) => {
        const rows = csvText.split('\n').map((row) => row.split(','));
        const parsed: Product[] = [];
        
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row[0] || !row[1]) continue;

          // Supports comma or semicolon separated image URLs in column F
          const rawImages = row[5] 
            ? row[5].split(';').map((u) => u.trim()).filter(Boolean)
            : [];
          
          parsed.push({
            id: row[0]?.trim() || `SW-${String(i).padStart(3, '0')}`,
            name: row[1]?.trim() || '',
            category: row[2]?.trim() || 'Gadgets',
            price: Number(row[3]?.replace(/[^0-9.-]+/g, '')) || 0,
            description: row[4]?.trim() || '',
            images: rawImages.length > 0 ? rawImages : [""],
            badge: row[6]?.trim() || undefined,
            in_stock: row[7]?.toLowerCase().includes('true') || row[7]?.toLowerCase() === 'yes',
            video: row[8]?.trim() || undefined,
          });
        }

        if (parsed.length > 0) setProducts(parsed);
      })
      .catch((err) => console.error("Error loading inventory sheet:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const initiateWhatsAppOrder = (product: Product) => {
    const message = `Hello Swiftwave Mall! I would like to order:
- Product: ${product.name}
- Item ID: ${product.id}
- Price: ₦${product.price.toLocaleString()}

Is this available for pickup/delivery at ABH Plaza?`;
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
            <span className="hidden md:inline font-mono text-slate-400">RC: 9468092[cite: 2]</span>
            <span className="hidden lg:inline text-slate-600">|</span>
            <span className="hidden lg:inline font-mono text-slate-400">TIN: 2622689087269[cite: 2]</span>
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
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

            {/* Desktop Search Input */}
            <div className="flex-1 max-w-md relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search gadgets, accessories, power banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-sm rounded-full pl-10 pr-4 py-2 border border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
              />
            </div>

            {/* Contact Store Button */}
            <a
              href={`https://wa.me/${WHATSAPP_PHONE}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>Contact Store</span>
            </a>
          </div>

          {/* Mobile Search Bar */}
          <div className="mt-3 sm:hidden relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search items or codes (e.g. SW-001)..."
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
              Everyday Essentials Built for the Way You Actually Live[cite: 1].
            </h2>
            <p className="mt-2 text-sm sm:text-base text-blue-100 font-normal leading-relaxed">
              Order verified products directly from Shop 9 & 10, ABH Plaza, Minna with fast local pickup or direct dispatch.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-400/20 to-transparent pointer-events-none"></div>
        </section>

        {/* Catalog Header Meta */}
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
            <p className="mt-3 text-sm text-slate-500 font-medium">Syncing live store inventory...</p>
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
                  {/* Product Card Image Container */}
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

                    {/* Stock Status Badge */}
                    {!product.in_stock && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-rose-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-full">
                          Sold Out
                        </span>
                      </div>
                    )}

                    {/* Product Highlight Badge */}
                    {product.badge && (
                      <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                        {product.badge}
                      </span>
                    )}

                    {/* Video Availability Indicator */}
                    {product.video && (
                      <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white p-1.5 rounded-full shadow-md">
                        <Video className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  {/* Card Meta Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                        <span>{product.category}</span>
                        <span className="font-mono text-slate-500">{product.id}</span>
                      </div>

                      <h3 
                        onClick={() => {
                          setActiveModalProduct(product);
                          setActiveImageIndex(0);
                        }}
                        className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors"
                      >
                        {product.name}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Retail Price</span>
                        <span className="text-base font-black text-slate-900">
                          ₦{product.price.toLocaleString()}
                        </span>
                      </div>

                      <button
                        onClick={() => initiateWhatsAppOrder(product)}
                        disabled={!product.in_stock}
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                          product.in_stock
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/30 active:scale-95'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Order</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Multi-Image & Video Detail Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Navigation Bar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-600">{activeModalProduct.id}</span>
                <span className="text-xs text-slate-400 ml-2">• {activeModalProduct.category}</span>
              </div>
              <button
                onClick={() => setActiveModalProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Main Photo Viewer Stage */}
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

              {/* Angle Thumbnails */}
              {activeModalProduct.images.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {activeModalProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                        activeImageIndex === idx ? 'border-blue-600 scale-95' : 'border-slate-200 opacity-60'
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
                  <span className="text-xl font-black text-slate-900">
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

              {/* Video Demo Link */}
              {activeModalProduct.video && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                    <Video className="w-4 h-4 text-blue-600" />
                    <span>Product video clip available</span>
                  </div>
                  <a
                    href={activeModalProduct.video}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    Watch Video <ExternalLink className="w-3 h-3" />
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
                onClick={() => initiateWhatsAppOrder(activeModalProduct)}
                disabled={!activeModalProduct.in_stock}
                className={`inline-flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-all ${
                  activeModalProduct.in_stock
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corporate Brand Identity Modal[cite: 1, 2] */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative border border-slate-200 shadow-2xl">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-bold text-slate-900">About Swiftwave Variety Mall[cite: 1]</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Swiftwave is your modern everyday marketplace built for the way you actually live[cite: 1]. Bringing together gadgets, home essentials, school supplies, phone accessories, beauty products, children's toys, and creator tools under one roof[cite: 1].
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">Our Mission[cite: 1]</span>
              <p className="text-xs text-slate-600 mt-1">
                To create stylish, affordable, and practical accessories that help students and everyday users stay organized and express their identity[cite: 1].
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block">Corporate Registration[cite: 2]</span>
              <p className="text-xs font-mono text-slate-600 mt-1">
                Incorporated as SWIFTWAVE VARIETY MALL LIMITED[cite: 2]<br />
                RC: 9468092 | TIN: 2622689087269[cite: 2]
              </p>
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

      {/* Trust-Anchored Footer[cite: 1, 2] */}
      <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800 pt-10 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  S
                </div>
                <span className="text-sm font-black tracking-tight text-white">SWIFTWAVE</span>
              </div>
              <p className="text-slate-400 leading-relaxed text-xs max-w-sm">
                Friendly, fast, and affordable. The one-stop shop that keeps everyday life moving[cite: 1].
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Physical Store</h4>
              <p className="leading-relaxed text-slate-400">
                Shop 9 & 10, ABH Plaza,<br />
                Opposite Federal University of Technology (FUTMINNA) Road,<br />
                Minna, Niger State.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Corporate Credentials[cite: 2]</h4>
              <p className="text-slate-400 leading-relaxed font-mono">
                Entity: Swiftwave Variety Mall Limited[cite: 2]<br />
                Registration No: 9468092[cite: 2]<br />
                Tax ID: 2622689087269[cite: 2]
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} Swiftwave Variety Mall Limited. All rights reserved[cite: 2].</p>
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Certified CAC Registered Commercial Vendor[cite: 2]</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}