import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, ShoppingBag, ExternalLink, ShieldCheck, Sparkles, Video, X,
  CheckCircle2, ChevronRight, ChevronLeft, Info, Plus, Minus,
  Trash2, Truck, Building2, Copy, Image as ImageIcon, Maximize2,
  PhoneCall, Check, Instagram, Facebook, MessageCircle, Headphones,
  Share, Calculator, Shield, Scale, ArrowDownCircle
} from 'lucide-react';

// ==========================================
// 0. ADMIN SMART LEDGER UI (HIDDEN ROUTE)
// ==========================================
function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinCode, setPinCode] = useState('');
  
  // The actual ID sent to Google
  const [productId, setProductId] = useState(''); 
  // What the user sees in the text box
  const [displayValue, setDisplayValue] = useState(''); 
  
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const ADMIN_PIN = "1275"; // Remember to change this to Haris's new PIN!

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode === ADMIN_PIN) {
      setIsAuthenticated(true);
      try {
        const res = await fetch("https://docs.google.com/spreadsheets/d/1XysYSGvgDR9t70VSrIwdXsN3GwzOjFmLUOfgB2s8Xbo/gviz/tq?tqx=out:csv");
        const text = await res.text();
        const lines = text.split('\n').filter(x => x.trim());
        if (lines.length > 1) {
          const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
          const idIdx = headers.findIndex(h => h.includes('id'));
          const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('product'));
          
          const parsed = [];
          for(let i = 1; i < lines.length; i++) {
             const row = parseCSVLine(lines[i]);
             if(idIdx > -1 && nameIdx > -1 && row[nameIdx]) {
                parsed.push({ id: row[idIdx], name: row[nameIdx] });
             }
          }
          setProducts(parsed);
        }
      } catch(err) { console.error("Catalog sync failed", err); }
    } else { alert("Unauthorized Access"); setPinCode(''); }
  };

  const handleLogSale = async (e: React.FormEvent) => {
    e.preventDefault();
    // Use the actual hidden ID, not the display name, or fallback to manual input if no dropdown was used
    const finalId = productId || displayValue; 
    if (!finalId.trim()) return;

    setLoading(true);
    setMessage({ text: '', type: '' });
    const API_URL = "https://script.google.com/macros/s/AKfycbzPx4RCKIubIJyKkHfdZuVjk_lNYyueQrRHJaDY7rDPWVTltpNlcGpLPq76ydXVjgwD7w/exec";

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ productId: finalId.trim(), quantity: quantity, pin: ADMIN_PIN })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setMessage({ text: `Success: ${quantity}x [${finalId}] logged.`, type: 'success' });
        setProductId(''); 
        setDisplayValue(''); 
        setQuantity(1);
      } else { setMessage({ text: "Error: " + data.message, type: 'error' }); }
    } catch (err) { setMessage({ text: "Network error.", type: 'error' }); }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full text-center border border-slate-200">
          <ShieldCheck className="w-12 h-12 text-[#A044C3] mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Restricted Access</h2>
          <p className="text-xs text-slate-500 mb-6">Enter admin PIN to access ledger</p>
          <input type="password" value={pinCode} onChange={(e) => setPinCode(e.target.value)} className="w-full text-center text-2xl tracking-[0.5em] font-black p-4 rounded-xl border border-slate-300 focus:border-[#A044C3] outline-none mb-4" placeholder="••••" maxLength={4} />
          <button type="submit" className="w-full bg-[#A044C3] text-[#FFBB1C] font-bold py-3 rounded-xl shadow-lg hover:opacity-90 transition-all">Unlock Desk</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
        <div className="flex justify-center mb-4"><div className="w-16 h-16 bg-[#A044C3]/10 text-[#A044C3] rounded-full flex items-center justify-center"><Calculator className="w-8 h-8" /></div></div>
        <h2 className="text-2xl font-black text-center text-slate-900 mb-1">Store Admin Desk</h2>
        <p className="text-sm text-center text-slate-500 mb-6 font-medium">Log Sales & Deduct Inventory</p>

        {message.text && (
          <div className={`p-4 rounded-xl mb-6 text-sm font-bold flex items-start gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <Shield className="w-5 h-5 shrink-0" />}<span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleLogSale} className="space-y-5">
          <div className="relative">
            <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Search Product Name or ID</label>
            <input
              type="text"
              placeholder="e.g. iPhone Charger..."
              value={displayValue}
              onChange={(e) => {
                 setDisplayValue(e.target.value);
                 // If user starts typing manually, clear the hidden ID so we fallback to manual text
                 setProductId(''); 
                 setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#A044C3] outline-none font-bold text-slate-900"
            />
            {showDropdown && displayValue && (
               <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {products.filter(p => p.name.toLowerCase().includes(displayValue.toLowerCase()) || p.id.toLowerCase().includes(displayValue.toLowerCase())).slice(0, 10).map(p => (
                     <div
                        key={p.id}
                        onClick={() => { 
                          setProductId(p.id); // Save the hidden ID for the server
                          setDisplayValue(p.name); // Show the name to Haris
                          setShowDropdown(false); 
                        }}
                        className="p-3 hover:bg-violet-50 cursor-pointer border-b border-slate-100 last:border-0"
                     >
                        <div className="flex justify-between items-center">
                           <span className="text-sm font-bold text-slate-900 truncate pr-2">{p.name}</span>
                           <span className="text-xs font-mono font-black text-[#A044C3] bg-violet-100 px-2 py-0.5 rounded">{p.id}</span>
                        </div>
                     </div>
                  ))}
               </div>
            )}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">Quantity Sold</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 border border-slate-300"><Minus className="w-5 h-5 text-slate-700" /></button>
              <input type="number" readOnly value={quantity} className="flex-1 text-center font-black text-xl p-2 rounded-xl border border-slate-300 outline-none" />
              <button type="button" onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 border border-slate-300"><Plus className="w-5 h-5 text-slate-700" /></button>
            </div>
          </div>
          <button type="submit" disabled={loading || !displayValue} className={`w-full font-bold text-sm py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${(loading || !displayValue) ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-[#A044C3] hover:opacity-90 text-[#FFBB1C] shadow-[#A044C3]/30'}`}>
            {loading ? <span className="animate-pulse">Logging to Ledger...</span> : <><span>Log Sale</span><Check className="w-5 h-5" /></>}
          </button>
        </form>
        <button onClick={() => window.location.href = '/'} className="w-full mt-4 text-xs font-bold text-slate-500 hover:text-[#A044C3] text-center py-2">Return to Storefront</button>
      </div>
    </div>
  );
}

// ==========================================
// 1. DATA FORMATTERS & EMBED RESOLVERS
// ==========================================
export function formatDriveUrl(url: string): string {
  if (!url) return "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=600&q=80";
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}=w800`;
  const idMatch = url.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return `https://lh3.googleusercontent.com/d/${idMatch[1]}=w800`;
  return url.trim();
}

export function getVideoThumbnail(videoUrl?: string): string | null {
  if (!videoUrl) return null;
  const cleanUrl = videoUrl.trim();
  const driveMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w800`;
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]+)/);
  if (ytMatch && ytMatch[1]) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return null;
}

export function getVideoEmbed(url?: string): { type: 'iframe' | 'video'; embedUrl: string } | null {
  if (!url) return null;
  const cleanUrl = url.trim();
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]+)/);
  if (ytMatch && ytMatch[1]) return { type: 'iframe', embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0` };
  const driveMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) return { type: 'iframe', embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview` };
  if (cleanUrl.match(/\.(mp4|webm|ogg)$/i)) return { type: 'video', embedUrl: cleanUrl };
  return null;
}

export function normalizeCategory(raw: string): string {
  if (!raw) return 'Gadgets';
  const s = raw.toLowerCase().trim();
  if (s.includes('phone') || s.includes('appliance') || s.includes('accessori') || s.includes('earphone') || s.includes('case')) return 'Phone Accessories';
  if (s.includes('gadget') || s.includes('power bank') || s.includes('tech') || s.includes('electronic')) return 'Gadgets';
  if (s.includes('school') || s.includes('stationer') || s.includes('book') || s.includes('pen')) return 'School Supplies';
  if (s.includes('kitchen') || s.includes('dining') || s.includes('cook') || s.includes('flask') || s.includes('blender') || s.includes('drink')) return 'Kitchen & Dining';
  if (s.includes('home') || s.includes('essential') || s.includes('room') || s.includes('decor') || s.includes('light')) return 'Room Essentials';
  if (s.includes('health') || s.includes('fitness') || s.includes('gym') || s.includes('massage') || s.includes('brace')) return 'Health & Fitness';
  if (s.includes('beaut') || s.includes('cosmetic') || s.includes('skin') || s.includes('care') || s.includes('hair') || s.includes('clipper')) return 'Beauty & Care';
  if (s.includes('bag') || s.includes('travel') || s.includes('backpack') || s.includes('luggage')) return 'Bags & Travel';
  if (s.includes('toy') || s.includes('child') || s.includes('kid') || s.includes('game') || s.includes('chess') || s.includes('rubik')) return "Children's Toys";
  if (s.includes('creator') || s.includes('tool') || s.includes('ring light') || s.includes('stream') || s.includes('stand') || s.includes('tripod')) return 'Creator Tools';
  return 'Room Essentials';
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
// 2. STORE CONFIGURATION
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
  stock_quantity?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

const CATEGORIES = [
  'All', 'New In', 'Gadgets', 'Phone Accessories', 'Creator Tools',
  'School Supplies', 'Kitchen & Dining', 'Room Essentials',
  'Health & Fitness', 'Beauty & Care', 'Bags & Travel', "Children's Toys"
] as const;

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1XysYSGvgDR9t70VSrIwdXsN3GwzOjFmLUOfgB2s8Xbo/gviz/tq?tqx=out:csv";

const SHOP_ACCOUNTS = {
  shop9: { title: "Shop 9: Daily Essentials", bank: "OPay", number: "6551680741", name: "SWIFTWAVE VARIETY MALL LIMITED" },
  shop10: { title: "Shop 10: Gadgets & Tech", bank: "OPay", number: "6551791518", name: "SWIFTWAVE VARIETY MALL LIMITED" },
};

const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/swiftwave_variety_mall",
  tiktok: "https://www.tiktok.com/@swiftwave.variety.mall",
  facebook: "https://www.facebook.com/share/1FYNyb95Kz/",
};

const SUPPORT_REPS = [
  { id: 'sup1', name: 'Support 1 (Main Store)', number: '2349066524315' },
  { id: 'sup2', name: 'Support 2 (Desk Rep)', number: '2348069318521' },
  { id: 'sup3', name: 'Support 3 (Customer Line)', number: '2349132028088' },
];

const MINNA_ZONES = [
  'Bosso (FUTMINNA Bosso Campus / Bosso Low-Cost / Mobil)',
  'Chanchaga / Shiroro Road / COE',
  'Tunga (Commercial Hub / Market / Police HQ / GRA)',
  'FUTMINNA Gidan Kwano (Main Campus)',
  'Kpakungu / Western Bypass',
  'Maitumbi / Old Airport Road',
  'Dutsen Kura / Kure Market',
  'Other Location in Minna'
];

const getProductShop = (category: string): 'shop9' | 'shop10' => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('gadget') || cat.includes('phone') || cat.includes('creator') || cat.includes('electronic')) return 'shop10';
  return 'shop9';
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/haris-admin-desk')) {
    return <AdminPanel />;
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // --- STATE MEMORY & PAGINATION ---
  const [selectedCategory, setSelectedCategory] = useState<string>(() => typeof window !== 'undefined' ? sessionStorage.getItem('sw_category') || 'All' : 'All');
  const [searchQuery, setSearchQuery] = useState<string>(() => typeof window !== 'undefined' ? sessionStorage.getItem('sw_search') || '' : '');
  const [displayLimit, setDisplayLimit] = useState<number>(48);

  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [mediaViewMode, setMediaViewMode] = useState<'photos' | 'video'>('photos');
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showCertLightbox, setShowCertLightbox] = useState<boolean>(false);
  const [showPolicyModal, setShowPolicyModal] = useState<boolean>(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedCart = localStorage.getItem('swiftwave_cart');
      if (!savedCart) return [];
      const parsed = JSON.parse(savedCart);
      return Array.isArray(parsed) ? parsed.filter((item: any) => item && item.product && typeof item.product.price === 'number') : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(() => typeof window !== 'undefined' ? localStorage.getItem('swiftwave_checkout_open') === 'true' : false);
  const [copiedShop9, setCopiedShop9] = useState<boolean>(false);
  const [copiedShop10, setCopiedShop10] = useState<boolean>(false);
  const [copiedOrderId, setCopiedOrderId] = useState<boolean>(false);
  const [removedItemsNotice, setRemovedItemsNotice] = useState<string[]>([]);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  const [selectedRepNumber, setSelectedRepNumber] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('swiftwave_support_rep') || SUPPORT_REPS[0].number : SUPPORT_REPS[0].number);
  const [orderId, setOrderId] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('swiftwave_order_id') || '' : '');
  const [customerName, setCustomerName] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('swiftwave_cust_name') || '' : '');
  const [customerPhone, setCustomerPhone] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('swiftwave_cust_phone') || '' : '');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'minna' | 'nationwide'>(() => typeof window !== 'undefined' ? (localStorage.getItem('swiftwave_delivery_method') as any) || 'pickup' : 'pickup');
  const [minnaCampusZone, setMinnaCampusZone] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('swiftwave_minna_zone') || MINNA_ZONES[0] : MINNA_ZONES[0]);
  const [landmarkHostel, setLandmarkHostel] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('swiftwave_landmark') || '' : '');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('swiftwave_deliv_address') || '' : '');
  const [orderNotes, setOrderNotes] = useState<string>(() => typeof window !== 'undefined' ? localStorage.getItem('swiftwave_order_notes') || '' : '');

  // Persist State Memory
  useEffect(() => {
    sessionStorage.setItem('sw_category', selectedCategory);
    sessionStorage.setItem('sw_search', searchQuery);
  }, [selectedCategory, searchQuery]);

  // Track & Restore Scroll Position Visually
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        sessionStorage.setItem('sw_scroll', window.scrollY.toString());
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (!loading && products.length > 0) {
      const savedScroll = sessionStorage.getItem('sw_scroll');
      if (savedScroll) {
        setTimeout(() => window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' }), 100);
      }
    }
  }, [loading, products.length]);

  // Local Storage Sync
  useEffect(() => {
    try {
      localStorage.setItem('swiftwave_cart', JSON.stringify(cart));
      localStorage.setItem('swiftwave_checkout_open', String(isCheckoutOpen));
      localStorage.setItem('swiftwave_order_id', orderId);
      localStorage.setItem('swiftwave_cust_name', customerName);
      localStorage.setItem('swiftwave_cust_phone', customerPhone);
      localStorage.setItem('swiftwave_delivery_method', deliveryMethod);
      localStorage.setItem('swiftwave_minna_zone', minnaCampusZone);
      localStorage.setItem('swiftwave_landmark', landmarkHostel);
      localStorage.setItem('swiftwave_deliv_address', deliveryAddress);
      localStorage.setItem('swiftwave_order_notes', orderNotes);
      localStorage.setItem('swiftwave_support_rep', selectedRepNumber);
    } catch (e) {
      console.error('Storage sync error:', e);
    }
  }, [cart, isCheckoutOpen, orderId, customerName, customerPhone, deliveryMethod, minnaCampusZone, landmarkHostel, deliveryAddress, orderNotes, selectedRepNumber]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // iOS Install
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      setIsIOS(/iphone|ipad|ipod/.test(ua));
      setIsStandalone(('standalone' in window.navigator) && !!(window.navigator as any).standalone);
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        if (!sessionStorage.getItem('swiftwave_install_dismissed')) setShowInstallBanner(true);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', () => { setShowInstallBanner(false); setDeferredPrompt(null); });
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { setShowInstallBanner(false); setDeferredPrompt(null); }
  };
  const dismissInstallBanner = () => { setShowInstallBanner(false); sessionStorage.setItem('swiftwave_install_dismissed', 'true'); };

  // --- SILENT POLLING DATA FETCH ---
  const fetchInventory = useCallback(async () => {
    try {
      const res = await fetch(GOOGLE_SHEET_CSV_URL);
      const csvText = await res.text();
      const rawLines = csvText.split('\n').filter(line => line.trim().length > 0);
      if (rawLines.length < 2) return;

      const headers = parseCSVLine(rawLines[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ''));
      const getIdx = (keywords: string[]) => headers.findIndex(h => keywords.some(k => h.includes(k.replace(/[^a-z]/g, ''))));

      const idx = {
        id: getIdx(['id']),
        name: getIdx(['name', 'product']),
        category: getIdx(['category']),
        costPrice: getIdx(['costprice', 'cost']),
        sellingPrice: getIdx(['sellingprice', 'sell']),
        stock: getIdx(['stockquantity', 'quantity']),
        desc: getIdx(['description', 'desc']),
        images: getIdx(['image']),
        badge: getIdx(['badge', 'label']),
        inStock: getIdx(['instock']),
        video: getIdx(['video'])
      };

      const parsed: Product[] = [];

      for (let i = 1; i < rawLines.length; i++) {
        const row = parseCSVLine(rawLines[i]);
        const clean = (val?: string) => (val || '').replace(/^["']|["']$/g, '').trim();

        const id = idx.id > -1 ? clean(row[idx.id]) : `SW-${String(i).padStart(3, '0')}`;
        const name = idx.name > -1 ? clean(row[idx.name]) : '';
        if (!name) continue;

        const sellStr = idx.sellingPrice > -1 ? clean(row[idx.sellingPrice]) : '';
        const costStr = idx.costPrice > -1 ? clean(row[idx.costPrice]) : '';
        const finalPriceStr = sellStr || costStr || '0';
        const price = Number(finalPriceStr.replace(/[^0-9.-]+/g, '')) || 0;

        const rawQuantity = idx.stock > -1 ? clean(row[idx.stock]) : '';
        const parsedQty = rawQuantity !== '' && !isNaN(Number(rawQuantity)) ? Number(rawQuantity) : undefined;
        const isExplicitlySoldOut = parsedQty !== undefined && parsedQty <= 0;

        let in_stock = !isExplicitlySoldOut;
        if (idx.inStock > -1) {
          const inStockVal = clean(row[idx.inStock]).toLowerCase();
          in_stock = !isExplicitlySoldOut && (inStockVal === 'true' || inStockVal === 'yes');
        }

        const rawImagesStr = idx.images > -1 ? clean(row[idx.images]) : '';
        const rawImages = rawImagesStr ? rawImagesStr.split(/[;,]/).map(u => clean(u)).filter(Boolean) : [];
        const rawVideo = idx.video > -1 ? clean(row[idx.video]) : '';
        const videoThumbnail = getVideoThumbnail(rawVideo);
        const finalImages = rawImages.length > 0 ? rawImages : videoThumbnail ? [videoThumbnail] : [""];

        parsed.push({
          id,
          name,
          category: normalizeCategory(idx.category > -1 ? clean(row[idx.category]) : ''),
          price,
          description: idx.desc > -1 ? clean(row[idx.desc]) : '',
          images: finalImages,
          badge: idx.badge > -1 ? clean(row[idx.badge]) : undefined,
          in_stock,
          video: rawVideo || undefined,
          stock_quantity: parsedQty,
        });
      }
      setProducts(parsed.reverse());
    } catch (err) {
      console.error("Error loading inventory sheet:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial Fetch & Polling Setup
  useEffect(() => {
    fetchInventory();
    const interval = setInterval(fetchInventory, 60000); // Silent update every 60s
    return () => clearInterval(interval);
  }, [fetchInventory]);

  // Handle URL Product Opening
  useEffect(() => {
    if (products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const productIdFromUrl = params.get('product') || sessionStorage.getItem('swiftwave_active_modal');
    if (productIdFromUrl && !activeModalProduct) {
      const matched = products.find((p) => p.id === productIdFromUrl);
      if (matched) { setActiveModalProduct(matched); setActiveImageIndex(0); setMediaViewMode('photos'); }
    }
  }, [products]);

  const openProductModal = (product: Product) => {
    sessionStorage.setItem('sw_scroll', window.scrollY.toString());
    setActiveModalProduct(product); setActiveImageIndex(0); setMediaViewMode('photos'); setIsDescExpanded(false);
    try {
      window.history.replaceState(null, '', `${window.location.pathname}?product=${encodeURIComponent(product.id)}`);
      sessionStorage.setItem('swiftwave_active_modal', product.id);
    } catch (e) { console.error(e); }
  };

  const closeProductModal = () => {
    setActiveModalProduct(null);
    try { window.history.replaceState(null, '', window.location.pathname); sessionStorage.removeItem('swiftwave_active_modal'); } catch (e) { console.error(e); }
  };

  // Cart Stock Sync Verification
  useEffect(() => {
    if (products.length === 0) return;
    setCart((currentCart) => {
      if (currentCart.length === 0) return currentCart;
      const notices: string[] = [];
      const updatedCart: CartItem[] = [];
      currentCart.forEach((item) => {
        if (!item || !item.product) return;
        const liveProduct = products.find((p) => p.id === item.product.id);
        if (!liveProduct || !liveProduct.in_stock || (liveProduct.stock_quantity !== undefined && liveProduct.stock_quantity <= 0)) {
          notices.push(`"${item.product.name}" is now sold out and was removed.`);
        } else {
          let adjustedQty = item.quantity;
          if (liveProduct.stock_quantity !== undefined && item.quantity > liveProduct.stock_quantity) {
            adjustedQty = liveProduct.stock_quantity;
            notices.push(`"${liveProduct.name}" quantity adjusted from ${item.quantity} to ${liveProduct.stock_quantity} (max available).`);
          }
          updatedCart.push({ product: liveProduct, quantity: adjustedQty });
        }
      });
      if (notices.length > 0) setRemovedItemsNotice(notices);
      return updatedCart;
    });
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    // STRICT "NEW IN" LOGIC: Absolute 20 newest items overriding categories
    if (selectedCategory === 'New In') {
      return products.slice(0, 20).sort((a, b) => (a.in_stock === b.in_stock ? 0 : a.in_stock ? -1 : 1));
    }

    return products
      .filter((p) => {
        if (!p) return false;

        // Multi-category support via description scanning
        const matchesCategory = selectedCategory === 'All' ? true :
          ((p.category || '').toLowerCase() === selectedCategory.toLowerCase() ||
            (p.description || '').toLowerCase().includes(selectedCategory.toLowerCase()));

        const searchTokens = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
        const matchesSearch = searchTokens.length === 0 || searchTokens.every(token =>
          (p.name || '').toLowerCase().includes(token) ||
          (p.description || '').toLowerCase().includes(token) ||
          (p.id || '').toLowerCase().includes(token));

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => (a.in_stock === b.in_stock ? 0 : a.in_stock ? -1 : 1));
  }, [products, selectedCategory, searchQuery]);

  // Pagination Slice
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(0, displayLimit);
  }, [filteredProducts, displayLimit]);

  const suggestedProducts = useMemo(() => {
    if (filteredProducts.length > 0 || !searchQuery) return [];
    const q = searchQuery.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    if (q.length < 3) return [];
    const searchRoot = q.slice(0, 3);
    return products.filter(p => p.name.toLowerCase().includes(searchRoot) || p.category.toLowerCase().includes(searchRoot)).slice(0, 4);
  }, [filteredProducts.length, searchQuery, products]);

  const relatedProducts = useMemo(() => {
    if (!activeModalProduct || products.length === 0) return [];
    const stopWords = new Set(['and', 'the', 'for', 'with', 'in', 'of', 'to', 'a', 'an', 'at', 'by', 'from', 'on', 'is', 'it', 'or', 'as', 'are', 'be', 'this', 'that', 'your', 'original', 'high', 'quality', 'new', 'best', 'pro', 'plus']);
    const currentTokens = activeModalProduct.name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
    const scored = products
      .filter((p) => p.id !== activeModalProduct.id)
      .map((p) => {
        let score = 0;
        if (p.category.toLowerCase() === activeModalProduct.category.toLowerCase()) score += 3;
        currentTokens.forEach((token) => {
          if (p.name.toLowerCase().includes(token)) score += 7;
          else if ((p.description || '').toLowerCase().includes(token)) score += 1.5;
        });
        if (p.in_stock) score += 1;
        return { product: p, score };
      });
    return scored.filter((item) => item.score > 0).sort((a, b) => b.score !== a.score ? b.score - a.score : Math.abs(a.product.price - activeModalProduct.price) - Math.abs(b.product.price - activeModalProduct.price)).slice(0, 4).map((item) => item.product);
  }, [activeModalProduct, products]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item?.product?.id === product.id);
      if (product.stock_quantity !== undefined && (existing ? existing.quantity : 0) >= product.stock_quantity) return prev;
      if (existing) return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { product, quantity: 1 }];
    });
    setToastMessage(`Added "${(product.name || '').slice(0, 26)}..." to cart`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item?.product?.id === productId) {
        const newQty = item.quantity + delta;
        if (delta > 0 && item.product.stock_quantity !== undefined && item.quantity >= item.product.stock_quantity) return item;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((item) => item?.product?.id !== productId));
  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + ((item?.product?.price || 0) * (item?.quantity || 1)), 0), [cart]);

  const { shop9Items, shop10Items, shop9Total, shop10Total } = useMemo(() => {
    const s9Items: CartItem[] = []; const s10Items: CartItem[] = [];
    let s9Sum = 0; let s10Sum = 0;
    cart.forEach((item) => {
      if (!item || !item.product) return;
      const shop = getProductShop(item.product.category || '');
      const val = (item.product.price || 0) * (item.quantity || 1);
      if (shop === 'shop10') { s10Items.push(item); s10Sum += val; } else { s9Items.push(item); s9Sum += val; }
    });
    return { shop9Items: s9Items, shop10Items: s10Items, shop9Total: s9Sum, shop10Total: s10Sum };
  }, [cart]);

  const hasShop9 = shop9Items.length > 0;
  const hasShop10 = shop10Items.length > 0;
  const isMixedCart = hasShop9 && hasShop10;
  const deliveryFee = useMemo(() => deliveryMethod === 'pickup' ? 0 : deliveryMethod === 'minna' ? 1500 : 4500, [deliveryMethod]);
  const orderTotal = cartSubtotal + deliveryFee;
  const totalCartCount = cart.reduce((sum, item) => sum + (item?.quantity || 0), 0);

  const openCheckout = () => {
    if (!orderId) setOrderId(`SW-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsCartOpen(false); setIsCheckoutOpen(true);
  };

  const handleFinalOrder = () => {
    if (!customerName.trim() || !customerPhone.trim()) return alert("Please provide your full name and an active phone number for rider calls.");
    if (deliveryMethod === 'minna' && !landmarkHostel.trim()) return alert("Please specify your delivery address, landmark, or campus drop-off point.");
    if (deliveryMethod === 'nationwide' && !deliveryAddress.trim()) return alert("Please enter your delivery destination (state, city, street).");

    const deliveryTitle = deliveryMethod === 'pickup' ? "Store Pickup @ ABH Plaza, Minna (FREE)" : deliveryMethod === 'minna' ? `Minna Local/Campus Dispatch (₦1,500) - [${minnaCampusZone}]` : "Nationwide Logistics Dispatch (₦4,500)";

    let paymentBreakdownText = isMixedCart ? `*PAYMENT SPLIT INSTRUCTIONS:*\n- Shop 9 (Essentials Subtotal): ₦${shop9Total.toLocaleString()} -> Pay to OPay (${SHOP_ACCOUNTS.shop9.number})\n- Shop 10 (Gadgets Subtotal): ₦${shop10Total.toLocaleString()} -> Pay to OPay (${SHOP_ACCOUNTS.shop10.number})\n- Delivery Fee: ₦${deliveryFee.toLocaleString()} (Paid to either account)\n*TOTAL PAID:* ₦${orderTotal.toLocaleString()}` : `*PAYMENT ACCOUNT:*\nPaid into OPay (${hasShop10 ? SHOP_ACCOUNTS.shop10.number : SHOP_ACCOUNTS.shop9.number}) - ${hasShop10 ? 'Shop 10 Gadgets' : 'Shop 9 Daily Essentials'}\nAccount: ${SHOP_ACCOUNTS.shop9.name}\n*TOTAL PAID:* ₦${orderTotal.toLocaleString()}`;
    let itemsSummary = isMixedCart ? `*SHOP 10 (GADGETS & TECH):*\n${shop10Items.map((item, idx) => `  ${idx + 1}. ${item.product.name} x${item.quantity} = ₦${(item.product.price * item.quantity).toLocaleString()}`).join('\n')}\n\n*SHOP 9 (DAILY ESSENTIALS):*\n${shop9Items.map((item, idx) => `  ${idx + 1}. ${item.product.name} x${item.quantity} = ₦${(item.product.price * item.quantity).toLocaleString()}`).join('\n')}` : cart.map((item, idx) => `${idx + 1}. ${item.product.name} (ID: ${item.product.id}) x${item.quantity} = ₦${(item.product.price * item.quantity).toLocaleString()}`).join('\n');

    const message = `🛍️ *PAID ORDER VERIFICATION - SWIFTWAVE MALL*\n*Order Reference:* #${orderId}\n----------------------------------------\n*Customer Name:* ${customerName.trim()}\n*Calling Phone:* ${customerPhone.trim()}\n\n*Fulfillment:* ${deliveryTitle}\n${deliveryMethod === 'minna' ? `*Area/Zone:* ${minnaCampusZone}\n*Address/Landmark/Drop Point:* ${landmarkHostel.trim()}\n` : ''}${deliveryMethod === 'nationwide' ? `*Delivery Destination:* ${deliveryAddress.trim()}\n` : ''}${orderNotes.trim() ? `*Special Notes:* ${orderNotes.trim()}\n` : ''}\n*ITEMS ORDERED:*\n${itemsSummary}\n----------------------------------------\n*Subtotal:* ₦${cartSubtotal.toLocaleString()}\n*Delivery Fee:* ₦${deliveryFee.toLocaleString()}\n----------------------------------------\n${paymentBreakdownText}\n----------------------------------------\n*Transfer Remark Used:* ${orderId}\n*(Attached is my payment transfer receipt screenshot)*`;
    window.open(`https://wa.me/${selectedRepNumber}?text=${encodeURIComponent(message)}`, '_blank');

    setCart([]); setOrderId(''); setOrderNotes(''); setLandmarkHostel(''); setIsCheckoutOpen(false);
    ['swiftwave_checkout_open', 'swiftwave_order_id', 'swiftwave_order_notes', 'swiftwave_landmark'].forEach(k => localStorage.removeItem(k));
  };

  const activeVideoEmbed = useMemo(() => activeModalProduct ? getVideoEmbed(activeModalProduct.video) : null, [activeModalProduct]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 text-xs py-1.5 px-4 font-bold text-center flex items-center justify-center gap-1.5 shadow-sm">
          <span>⚠ You are browsing offline. Showing saved inventory and catalog prices.</span>
        </div>
      )}

      {toastMessage && (
        <aside className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-violet-500/30 animate-bounce">
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center"><Check className="w-3 h-3 stroke-[3]" /></div>
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => { setToastMessage(null); setIsCartOpen(true); }} className="text-xs font-bold text-yellow-400 hover:text-white underline underline-offset-2 ml-1">View Cart</button>
        </aside>
      )}

      {/* Top Corporate Legal Badge Bar */}
      <div className="bg-violet-600 text-white text-xs py-2 px-4 border-b border-violet-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
            <span className="font-semibold text-white tracking-wide">SWIFTWAVE VARIETY MALL LIMITED</span>
            <span className="hidden md:inline text-white/50">|</span>
            <span className="hidden md:inline font-mono text-yellow-300">RC: 9468092</span>
          </div>
          <div className="flex items-center gap-4 text-white/90">
            <div className="flex items-center gap-2.5 pr-2 border-r border-white/30">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="hover:text-yellow-400 transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer" className="hover:text-yellow-400 transition-colors flex items-center">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.99v8.29c.03 2.05-.72 4.17-2.18 5.62-1.74 1.79-4.34 2.5-6.75 1.95-2.61-.53-4.78-2.6-5.46-5.18-.8-2.91.43-6.19 3.02-7.66 1.48-.87 3.26-1.07 4.93-.68v4.11c-.93-.31-1.99-.25-2.87.21-1.09.56-1.74 1.77-1.64 3 .07 1.19.86 2.27 2 2.59 1.25.37 2.7-.1 3.42-1.13.38-.52.55-1.17.54-1.81V.02z" /></svg>
              </a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" className="hover:text-yellow-400 transition-colors"><Facebook className="w-3.5 h-3.5" /></a>
            </div>
            <button onClick={() => setShowAboutModal(true)} className="hover:text-yellow-400 underline underline-offset-2 flex items-center gap-1 text-xs transition-colors"><Info className="w-3 h-3" /> About Brand</button>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center">
              <img src="/logo.png" alt="Swiftwave Variety Mall" className="h-10 sm:h-12 w-auto max-w-[200px] sm:max-w-[250px] object-contain object-left cursor-pointer" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setDisplayLimit(48); }} onError={(e) => { e.currentTarget.style.display = 'none'; if (e.currentTarget.nextElementSibling) { (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'; } }} />
              <div className="hidden items-center gap-2 cursor-pointer" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setDisplayLimit(48); }}>
                <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-yellow-400 shadow-md font-black">S</div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none">SWIFT<span className="text-violet-600">WAVE</span></h1>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">Variety Mall</p>
                </div>
              </div>
            </div>

            <div className="flex-1 max-w-md relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search products, gadgets, essentials..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-sm rounded-full pl-10 pr-4 py-2 border border-transparent focus:border-violet-600 focus:ring-4 focus:ring-violet-600/10 transition-all outline-none" />
            </div>

            <button onClick={() => setIsCartOpen(true)} className="relative inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-violet-900 text-xs sm:text-sm font-black px-4 py-2.5 rounded-full transition-all shadow-md active:scale-95">
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="bg-rose-500 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center -ml-1 shadow-sm">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

          <div className="mt-3 sm:hidden relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 text-sm rounded-xl pl-9 pr-3 py-2 border border-transparent focus:border-violet-600 focus:bg-white transition-all outline-none" />
          </div>

          <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 pb-1">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button key={cat} onClick={() => { setSelectedCategory(cat); setDisplayLimit(48); }} className={`text-xs font-bold px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 ${active ? 'bg-violet-600 text-yellow-400 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700'}`}>
                  {cat}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Brand Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-violet-700 to-violet-800 text-white p-6 sm:p-10 mb-8 shadow-xl border border-violet-500">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-yellow-400 text-violet-900 shadow-sm mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Retail Storefront
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white">
              Everyday Essentials Built for the Way You Actually Live.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-white/90 font-medium leading-relaxed">
              Order verified products directly from Shop 9 & 10, ABH Plaza, Minna with store pickup or swift dispatch.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none"></div>
        </section>

        <div className="flex items-center justify-between mb-4">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">Showing <span className="text-violet-700 font-black">{filteredProducts.length}</span> Products</p>
          {selectedCategory !== 'All' && <button onClick={() => { setSelectedCategory('All'); setDisplayLimit(48); }} className="text-xs font-semibold text-violet-600 hover:underline">Clear filter</button>}
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-slate-500 font-medium">Syncing live catalog from store inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-12 shadow-sm">
            <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-3"><Search className="w-6 h-6" /></div>
            <h3 className="text-base font-bold text-slate-900">No exact match found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">We couldn't find exactly "{searchQuery}". </p>
            {suggestedProducts.length > 0 ? (
              <div className="text-left bg-violet-50 rounded-xl p-4 border border-violet-100 mb-4">
                <h4 className="text-xs font-bold text-violet-700 mb-3 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Did you mean one of these?</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedProducts.map(p => (
                    <button key={p.id} onClick={() => openProductModal(p)} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-violet-100 hover:border-violet-300 transition-colors text-left">
                      <img src={formatDriveUrl(p.images?.[0] || '')} className="w-10 h-10 rounded-md object-cover bg-slate-50" alt="" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-violet-600 font-bold mt-0.5">₦{p.price.toLocaleString()}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="text-left bg-slate-50 rounded-xl p-4 border border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-2">Explore Popular Categories:</h4>
              <div className="flex flex-wrap gap-2">
                {['Gadgets', 'Phone Accessories', 'Kitchen & Dining', 'School Supplies'].map(cat => (
                  <button key={cat} onClick={() => { setSearchQuery(''); setSelectedCategory(cat); setDisplayLimit(48); }} className="text-[11px] font-semibold bg-white border border-slate-200 text-violet-600 px-3 py-1.5 rounded-lg shadow-sm hover:border-violet-300 transition-colors">{cat}</button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {paginatedProducts.map((product) => {
                const displayImage = formatDriveUrl(product.images?.[0] || '');
                const inCartQty = cart.find((i) => i?.product?.id === product.id)?.quantity || 0;
                const isMaxed = product.stock_quantity !== undefined && inCartQty >= product.stock_quantity;

                return (
                  <div key={product.id} className="group bg-white rounded-2xl border border-slate-200 hover:border-violet-400 hover:shadow-xl hover:shadow-violet-900/10 transition-all duration-300 flex flex-col overflow-hidden">
                    <div className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer" onClick={() => openProductModal(product)}>
                      <img src={displayImage} alt={product.name} className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      {!product.in_stock && (
                        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px] flex items-center justify-center">
                          <span className="bg-rose-600 text-white font-bold text-xs uppercase px-3 py-1 rounded-full shadow-lg">Sold Out</span>
                        </div>
                      )}
                      {product.badge && <span className="absolute top-2.5 left-2.5 bg-violet-600 text-yellow-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">{product.badge}</span>}
                      {product.in_stock && product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 5 && (
                        <span className="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-rose-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span> 🔥 Almost Sold Out ({product.stock_quantity} left)
                        </span>
                      )}
                      {product.video && (
                        <span className="absolute bottom-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md text-white px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md">
                          <Video className="w-3 h-3 text-yellow-400" /><span>Video</span>
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1">
                          <span className="text-violet-700 font-bold truncate max-w-[120px]">{product.category}</span>
                          <span className="font-mono text-slate-500">{product.id}</span>
                        </div>
                        <h3 onClick={() => openProductModal(product)} className="text-sm font-bold text-slate-900 line-clamp-2 hover:text-violet-600 cursor-pointer transition-colors">{product.name}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">{product.description}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Price</span>
                          <span className="text-base font-black text-slate-900">₦{product.price.toLocaleString()}</span>
                        </div>
                        {product.in_stock ? (
                          <button onClick={() => addToCart(product)} disabled={isMaxed} className={`inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl transition-all ${isMaxed ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 text-violet-900 shadow-sm active:scale-95'}`}>
                            <Plus className="w-3.5 h-3.5" /><span>{isMaxed ? 'Max in Cart' : 'Add'}</span>
                          </button>
                        ) : (
                          <a href={`https://wa.me/${selectedRepNumber}?text=${encodeURIComponent(`Hello Swiftwave Mall, I noticed "${product.name}" (ID: ${product.id}) is sold out. Please notify me when it is back in stock!\n\nReference Image: ${formatDriveUrl(product.images?.[0] || '')}`)}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-2 rounded-xl transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0" title="Notify me when restocked via WhatsApp">
                            <span>Restock</span><ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Load More */}
            {filteredProducts.length > displayLimit && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 48)}
                  className="bg-white border-2 border-violet-600 text-violet-600 hover:bg-violet-600 hover:text-white font-bold px-8 py-3 rounded-full transition-all shadow-sm flex items-center gap-2"
                >
                  <ArrowDownCircle className="w-5 h-5" />
                  <span>Load More Products (Showing {displayLimit} of {filteredProducts.length})</span>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Product Detail Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) closeProductModal(); }}>
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative border border-slate-200 flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md">{activeModalProduct.id}</span>
                <span className="text-xs text-slate-400">• {activeModalProduct.category}</span>
              </div>
              <button onClick={closeProductModal} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {activeModalProduct.video && (
                <div className="flex items-center gap-2 mb-3">
                  <button onClick={() => setMediaViewMode('photos')} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${mediaViewMode === 'photos' ? 'bg-violet-600 text-yellow-400 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><ImageIcon className="w-3.5 h-3.5" /><span>Product Photos ({activeModalProduct.images?.length || 1})</span></button>
                  <button onClick={() => setMediaViewMode('video')} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${mediaViewMode === 'video' ? 'bg-violet-600 text-yellow-400 shadow-sm' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'}`}><Video className="w-3.5 h-3.5" /><span>Watch Video Demo</span></button>
                </div>
              )}
              {mediaViewMode === 'video' && activeVideoEmbed ? (
                <div className="mb-4">
                  <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl bg-black overflow-hidden shadow-md border border-slate-800 flex items-center justify-center">
                    {activeVideoEmbed.type === 'iframe' ? <iframe src={activeVideoEmbed.embedUrl} title={activeModalProduct.name} className="w-full h-full border-0" allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /> : <video controls playsInline className="w-full h-full object-contain"><source src={activeVideoEmbed.embedUrl} type="video/mp4" /></video>}
                  </div>
                  {activeModalProduct.video && (
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                      <span>Store demonstration</span>
                      <a href={activeModalProduct.video} target="_blank" rel="noreferrer" className="text-violet-600 hover:text-violet-800 font-bold inline-flex items-center gap-1 bg-violet-100 hover:bg-violet-200 px-2.5 py-1 rounded-lg border border-violet-200 transition-colors"><span>Open Original Link</span><ExternalLink className="w-3 h-3" /></a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative aspect-video rounded-2xl bg-slate-100 overflow-hidden mb-4 group cursor-zoom-in" onClick={() => setIsLightboxOpen(true)}>
                  <img src={formatDriveUrl(activeModalProduct.images?.[activeImageIndex] || activeModalProduct.images?.[0] || '')} alt={activeModalProduct.name} className="w-full h-full object-contain" />
                  <div className="absolute top-2.5 right-2.5 bg-slate-900/60 backdrop-blur-md text-white p-1.5 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity"><Maximize2 className="w-4 h-4" /></div>
                  {activeModalProduct.images && activeModalProduct.images.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                      <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev === 0 ? activeModalProduct.images.length - 1 : prev - 1)); }} className="pointer-events-auto w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center transition-all"><ChevronLeft className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev === activeModalProduct.images.length - 1 ? 0 : prev + 1)); }} className="pointer-events-auto w-8 h-8 rounded-full bg-slate-950/70 hover:bg-slate-950 text-white flex items-center justify-center transition-all"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
              )}
              {mediaViewMode === 'photos' && activeModalProduct.images && activeModalProduct.images.length > 1 && (
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {activeModalProduct.images.map((img, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${activeImageIndex === idx ? 'border-violet-600 scale-95' : 'border-slate-200 opacity-60'}`}><img src={formatDriveUrl(img)} alt="" className="w-full h-full object-cover" /></button>
                  ))}
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900 leading-snug">{activeModalProduct.name}</h2>
                <div className="text-right shrink-0"><span className="text-xl font-black text-violet-700">₦{activeModalProduct.price.toLocaleString()}</span></div>
              </div>
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Specifications & Details</h4>
                <div className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  <p className="whitespace-pre-line inline">{isDescExpanded || activeModalProduct.description.length <= 150 ? activeModalProduct.description : `${activeModalProduct.description.slice(0, 150)}...`}</p>
                  {activeModalProduct.description.length > 150 && (
                    <button type="button" onClick={() => setIsDescExpanded(!isDescExpanded)} className="ml-1.5 text-violet-600 hover:underline font-bold inline underline-offset-2 transition-colors text-xs">{isDescExpanded ? 'Show less' : 'Read more'}</button>
                  )}
                </div>
              </div>
              {relatedProducts.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Similar & Related Products</h4>
                    <span className="text-[10px] text-violet-600 font-semibold">Recommended for you</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {relatedProducts.map((relProduct) => (
                      <div key={relProduct.id} onClick={() => openProductModal(relProduct)} className="group cursor-pointer bg-slate-50 hover:bg-violet-50 p-2 rounded-xl border border-slate-200/80 hover:border-violet-300 transition-all flex flex-col justify-between">
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-white mb-2 border border-slate-100"><img src={formatDriveUrl(relProduct.images?.[0] || '')} alt={relProduct.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" /></div>
                        <div>
                          <p className="text-[11px] font-bold text-slate-900 line-clamp-1 group-hover:text-violet-600">{relProduct.name}</p>
                          <p className="text-[11px] font-mono font-black text-violet-700 mt-0.5">₦{relProduct.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-col text-xs text-slate-500">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span>Verified Stock @ ABH Plaza</span></div>
                {activeModalProduct.in_stock && activeModalProduct.stock_quantity !== undefined && activeModalProduct.stock_quantity <= 5 && activeModalProduct.stock_quantity > 0 && (
                  <span className="text-[11px] font-bold text-rose-600 mt-0.5 flex items-center gap-1">🔥 High demand: Only {activeModalProduct.stock_quantity} left</span>
                )}
              </div>
              {activeModalProduct.in_stock ? (
                <button onClick={() => { addToCart(activeModalProduct); closeProductModal(); }} className="inline-flex items-center gap-2 text-sm font-black px-6 py-2.5 rounded-xl shadow-md bg-yellow-400 hover:bg-yellow-500 text-violet-900 transition-all active:scale-95"><Plus className="w-4 h-4" /><span>Add to Cart</span></button>
              ) : (
                <a href={`https://wa.me/${selectedRepNumber}?text=${encodeURIComponent(`Hello Swiftwave Mall, I saw that "${activeModalProduct.name}" (ID: ${activeModalProduct.id}) is currently sold out. When are you restocking it?\n\nReference Image: ${formatDriveUrl(activeModalProduct.images?.[0] || '')}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"><span>Request Restock via WhatsApp</span><ExternalLink className="w-3.5 h-3.5" /></a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between">
            <div className="p-4 border-b border-violet-200 bg-violet-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-violet-600" />
                <h3 className="font-bold text-slate-900">Your Shopping Cart</h3>
                <span className="text-xs bg-yellow-400 text-violet-900 font-black px-2 py-0.5 rounded-full">{totalCartCount}</span>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {removedItemsNotice.length > 0 && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-amber-950 block">Inventory Update</span>
                    <ul className="list-disc list-inside mt-1 font-semibold text-amber-900 text-[11px] space-y-0.5">{removedItemsNotice.map((msg, i) => <li key={i}>{msg}</li>)}</ul>
                  </div>
                  <button type="button" onClick={() => setRemovedItemsNotice([])} className="text-amber-600 hover:text-amber-950 p-1 font-bold"><X className="w-3.5 h-3.5" /></button>
                </div>
              )}
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <ShoppingBag className="w-12 h-12 mx-auto stroke-[1.5] mb-2 opacity-40 text-violet-600" />
                  <p className="text-sm font-medium">Your cart is empty</p>
                  <button onClick={() => setIsCartOpen(false)} className="mt-4 text-xs font-bold text-violet-600 hover:underline">Browse products</button>
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 items-center">
                    <img src={formatDriveUrl(product.images?.[0] || '')} alt="" className="w-14 h-14 object-cover rounded-xl bg-white border border-slate-200" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
                      <p className="text-xs font-mono font-semibold text-violet-600 mt-0.5">₦{(product.price * quantity).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQuantity(product.id, -1)} className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-bold font-mono px-1">{quantity}</span>
                        <button onClick={() => updateQuantity(product.id, 1)} disabled={product.stock_quantity !== undefined && quantity >= product.stock_quantity} className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${product.stock_quantity !== undefined && quantity >= product.stock_quantity ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95'}`}><Plus className="w-3.5 h-3.5" /></button>
                        {product.stock_quantity !== undefined && quantity >= product.stock_quantity && <span className="text-[10px] text-amber-700 font-bold ml-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Max ({product.stock_quantity})</span>}
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(product.id)} className="text-slate-400 hover:text-rose-600 p-2"><Trash2 className="w-4 h-4" /></button>
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
                <button onClick={openCheckout} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"><span>Proceed to Payment</span><ChevronRight className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsCheckoutOpen(false); }}>
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 relative border border-slate-200 shadow-2xl">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"><X className="w-4 h-4" /></button>
            <div className="flex items-center justify-between mb-2 pr-8">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-violet-100 text-violet-900 font-mono">Order #{orderId}</span>
                <button type="button" onClick={() => { navigator.clipboard.writeText(orderId); setCopiedOrderId(true); setTimeout(() => setCopiedOrderId(false), 2000); }} className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 hover:underline bg-violet-50 px-2 py-0.5 rounded"><Copy className="w-3 h-3" /><span>{copiedOrderId ? 'Copied!' : 'Copy Remark'}</span></button>
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-0.5">Checkout & Payment</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Copy the bank details below, transfer via your app, and return here to submit receipt via WhatsApp.</p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1"><Headphones className="w-3.5 h-3.5 text-violet-600" /><span>Send Order To WhatsApp Rep</span></span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SUPPORT_REPS.map((rep) => (
                    <button key={rep.id} type="button" onClick={() => setSelectedRepNumber(rep.number)} className={`p-2 rounded-xl border text-left transition-all ${selectedRepNumber === rep.number ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      <span className="text-[11px] block font-semibold leading-tight">{rep.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{rep.number}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input type="text" placeholder="e.g. Ibrahim Mukhtar" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-violet-600 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Active Phone Number</label>
                <div className="relative">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="tel" placeholder="e.g. 08012345678" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-violet-600 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Fulfillment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setDeliveryMethod('pickup')} className={`p-2 rounded-xl border text-center transition-all ${deliveryMethod === 'pickup' ? 'border-violet-600 bg-violet-50 text-violet-800 font-bold shadow-sm' : 'border-slate-200 text-slate-600'}`}>
                    <Building2 className="w-4 h-4 mx-auto mb-1 text-violet-600" /><span className="text-[11px] block">Shop Pickup</span><span className="text-[10px] text-emerald-600 font-bold">Free</span>
                  </button>
                  <button type="button" onClick={() => setDeliveryMethod('minna')} className={`p-2 rounded-xl border text-center transition-all ${deliveryMethod === 'minna' ? 'border-violet-600 bg-violet-50 text-violet-800 font-bold shadow-sm' : 'border-slate-200 text-slate-600'}`}>
                    <Truck className="w-4 h-4 mx-auto mb-1 text-violet-600" /><span className="text-[11px] block">Minna Delivery</span><span className="text-[10px] font-bold text-violet-700">₦1,500</span>
                  </button>
                  <button type="button" onClick={() => setDeliveryMethod('nationwide')} className={`p-2 rounded-xl border text-center transition-all ${deliveryMethod === 'nationwide' ? 'border-violet-600 bg-violet-50 text-violet-800 font-bold shadow-sm' : 'border-slate-200 text-slate-600'}`}>
                    <Truck className="w-4 h-4 mx-auto mb-1 text-violet-600" /><span className="text-[11px] block">Nationwide</span><span className="text-[10px] font-bold text-slate-600">₦4,500</span>
                  </button>
                </div>
              </div>
              {deliveryMethod === 'minna' && (
                <div className="p-3 bg-violet-50/50 border border-violet-200 rounded-2xl space-y-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-900 block mb-1">Minna Area / Hub</label>
                    <select value={minnaCampusZone} onChange={(e) => setMinnaCampusZone(e.target.value)} className="w-full text-xs p-2 rounded-xl border border-violet-300 bg-white font-medium text-slate-800 focus:border-violet-600 outline-none">
                      {MINNA_ZONES.map((zone) => <option key={zone} value={zone}>{zone}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-900 block mb-1">Delivery Address / Drop-off Point / Landmark</label>
                    <input type="text" placeholder="e.g. Bosso Low-Cost, Mobil" value={landmarkHostel} onChange={(e) => setLandmarkHostel(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-violet-300 bg-white focus:border-violet-600 outline-none" />
                  </div>
                </div>
              )}
              {deliveryMethod === 'nationwide' && (
                <div><label className="text-xs font-bold text-slate-700 block mb-1">Delivery Destination (State, City, Street)</label><input type="text" placeholder="e.g. Abuja FCT, Gwarinpa" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-violet-600 outline-none" /></div>
              )}
              <div><label className="text-xs font-bold text-slate-700 block mb-1">Order Notes (Optional)</label><input type="text" placeholder="e.g. Preferred color" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-violet-600 outline-none" /></div>
            </div>

            <div className="space-y-3 mb-5">
              {hasShop10 && (
                <div className="bg-[#A044C3] text-white rounded-2xl p-3.5 shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <div>
                      <span className="text-[10px] font-extrabold tracking-wider text-[#FFBB1C] uppercase block">SHOP 10 • GADGETS & TECH</span>
                      <span className="text-xs text-white/90 font-medium">Bank: OPay</span>
                    </div>
                    {isMixedCart && <span className="text-xs font-mono font-bold text-[#A044C3] bg-[#FFBB1C] px-2 py-0.5 rounded">Due: ₦{shop10Total.toLocaleString()}</span>}
                  </div>
                  <div className="flex justify-between items-center mt-2.5">
                    <div>
                      <span className="text-[10px] text-white/80 block">Account Number</span>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(SHOP_ACCOUNTS.shop10.number); setCopiedShop10(true); setTimeout(() => setCopiedShop10(false), 2000); }} className="inline-flex items-center gap-1.5 font-mono text-base font-black text-white hover:text-[#FFBB1C]">
                        <span>{SHOP_ACCOUNTS.shop10.number}</span><Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-right font-semibold text-white/80 max-w-[150px] leading-tight">SWIFTWAVE VARIETY MALL LIMITED</span>
                  </div>
                </div>
              )}
              {hasShop9 && (
                <div className="bg-[#A044C3] text-white rounded-2xl p-3.5 shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-white/20">
                    <div>
                      <span className="text-[10px] font-extrabold tracking-wider text-[#FFBB1C] uppercase block">SHOP 9 • DAILY ESSENTIALS</span>
                      <span className="text-xs text-white/90 font-medium">Bank: OPay</span>
                    </div>
                    {isMixedCart && <span className="text-xs font-mono font-bold text-[#A044C3] bg-[#FFBB1C] px-2 py-0.5 rounded">Due: ₦{shop9Total.toLocaleString()}</span>}
                  </div>
                  <div className="flex justify-between items-center mt-2.5">
                    <div>
                      <span className="text-[10px] text-white/80 block">Account Number</span>
                      <button type="button" onClick={() => { navigator.clipboard.writeText(SHOP_ACCOUNTS.shop9.number); setCopiedShop9(true); setTimeout(() => setCopiedShop9(false), 2000); }} className="inline-flex items-center gap-1.5 font-mono text-base font-black text-white hover:text-[#FFBB1C]">
                        <span>{SHOP_ACCOUNTS.shop9.number}</span><Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-right font-semibold text-white/80 max-w-[150px] leading-tight">SWIFTWAVE VARIETY MALL LIMITED</span>
                  </div>
                </div>
              )}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Grand Total Due</span>
                  <span className="text-[10px] text-slate-500">Includes ₦{deliveryFee.toLocaleString()} delivery</span>
                </div>
                <span className="text-lg font-black text-[#A044C3]">₦{orderTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center mb-4 px-2">
              <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                By finalizing this order, you agree to our <button type="button" onClick={() => { setIsCheckoutOpen(false); setShowPolicyModal(true); }} className="text-[#A044C3] font-bold hover:underline">48-hour Option of Defect return policy</button>.
              </p>
            </div>

            <button type="button" onClick={handleFinalOrder} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95">
              <span>I Have Transferred • Submit via WhatsApp</span><ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Brand Identity Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative border border-slate-200 shadow-2xl">
            <button onClick={() => setShowAboutModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white shadow-sm hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors z-10"><X className="w-4 h-4" /></button>
            
            <div className="flex justify-center mb-6 bg-[#A044C3] p-6 rounded-2xl mt-2"><img src="/logo.png" alt="Swiftwave" className="h-16 w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></div>
            
            <div className="flex items-center gap-2 mb-3"><ShieldCheck className="w-5 h-5 text-[#A044C3]" /><h3 className="text-base font-bold text-slate-900">About Swiftwave Variety Mall</h3></div>
            <p className="text-[13px] text-slate-600 leading-relaxed mb-6">Swiftwave is your modern everyday marketplace built for the way you actually live. Bringing together gadgets, home essentials, school supplies, phone accessories, beauty products, children's toys, and creator tools under one roof.</p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
              <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-wider mb-3">Connect With Us</h4>
              <div className="grid grid-cols-3 gap-2">
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 rounded-lg py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 hover:border-[#A044C3] hover:text-[#A044C3] transition-colors"><Instagram className="w-3.5 h-3.5 text-rose-500" /> Instagram</a>
                <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 rounded-lg py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 hover:border-[#A044C3] hover:text-[#A044C3] transition-colors"><svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.99v8.29c.03 2.05-.72 4.17-2.18 5.62-1.74 1.79-4.34 2.5-6.75 1.95-2.61-.53-4.78-2.6-5.46-5.18-.8-2.91.43-6.19 3.02-7.66 1.48-.87 3.26-1.07 4.93-.68v4.11c-.93-.31-1.99-.25-2.87.21-1.09.56-1.74 1.77-1.64 3 .07 1.19.86 2.27 2 2.59 1.25.37 2.7-.1 3.42-1.13.38-.52.55-1.17.54-1.81V.02z" /></svg> TikTok</a>
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" className="bg-white border border-slate-200 rounded-lg py-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 hover:border-[#A044C3] hover:text-[#A044C3] transition-colors"><Facebook className="w-3.5 h-3.5 text-blue-600" /> Facebook</a>
              </div>
            </div>

            <div className="p-4 bg-[#A044C3]/5 rounded-xl border border-[#A044C3]/20 mb-6">
              <div className="flex items-center justify-between mb-2"><span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Corporate Registration</span><span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" /> CAC Verified</span></div>
              <p className="text-xs font-mono text-slate-700 mb-4 leading-relaxed"><span className="font-semibold text-slate-900 font-sans">SWIFTWAVE VARIETY MALL LIMITED</span><br />RC: <span className="text-[#A044C3] font-bold">9468092</span> <span className="text-slate-300 mx-1">|</span> TIN: 2622689087269</p>
              <a href="https://search.cac.gov.ng/home" target="_blank" rel="noreferrer" className="w-full bg-white border border-[#A044C3]/30 text-[#A044C3] font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-[#A044C3] hover:text-[#FFBB1C] transition-colors"><ShieldCheck className="w-4 h-4" /> View Certificate of Incorporation <ExternalLink className="w-3 h-3" /></a>
            </div>
            
            <button onClick={() => setShowAboutModal(false)} className="w-full bg-slate-900 text-white font-bold text-sm py-3 rounded-xl hover:bg-slate-800 transition-colors shadow-md">Back to Catalog</button>
          </div>
        </div>
      )}

      {/* Shariah Compliance & T&C Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh]">
            <button onClick={() => setShowPolicyModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-6 h-6 text-violet-600" />
              <h3 className="text-lg font-bold text-slate-900">Store Policies & Returns</h3>
            </div>
            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="bg-violet-50 p-4 rounded-xl border border-violet-100">
                <h4 className="font-bold text-violet-900 uppercase tracking-wider mb-1.5 text-[11px]">1. Payment & Fulfillment</h4>
                <p>All sales are finalized upon the confirmation of payment receipt and physical or constructive delivery to the customer or their assigned rider. Nationwide deliveries require full payment prior to dispatch.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1.5 text-[11px]">2. Option of Defect (Khiyar al-Ayb)</h4>
                <p>We stand by our verified inventory. To ensure absolute transparency and fairness, we offer a strict <strong>48-hour return window</strong> exclusively for items sold with factory defects or dead-on-arrival status. Physical damage caused post-delivery is not covered.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-1.5 text-[11px]">3. Privacy Notice</h4>
                <p>Your phone number and address are utilized strictly for order fulfillment and dispatch logistics. We do not sell or expose your personal data to third-party marketers.</p>
              </div>
            </div>
            <button onClick={() => setShowPolicyModal(false)} className="w-full mt-6 bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl hover:bg-slate-800 transition-colors">I Understand</button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-violet-600 text-white/90 text-xs pt-10 pb-8 mt-auto border-t-4 border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/20">
            <div className="md:col-span-1">
              <div className="mb-3"><img src="/logo.png" alt="Swiftwave" className="h-8 w-auto object-contain filter brightness-0 invert" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></div>
              <p className="text-white/80 leading-relaxed text-xs">Friendly, fast, and affordable. The one-stop shop that keeps everyday life moving.</p>
            </div>
            <div>
              <h4 className="text-yellow-400 font-bold text-xs uppercase tracking-wider mb-3">Customer Support</h4>
              <ul className="space-y-2 text-white/80">
                {SUPPORT_REPS.map((rep) => (
                  <li key={rep.id}><a href={`https://wa.me/${rep.number}`} target="_blank" rel="noreferrer" className="hover:text-yellow-400 transition-colors flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" /><span>{rep.name}</span></a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-yellow-400 font-bold text-xs uppercase tracking-wider mb-3">Connect & Legal</h4>
              <div className="flex flex-col space-y-2 text-white/80">
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="hover:text-yellow-400 transition-colors flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5" /><span>Instagram</span></a>
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" className="hover:text-yellow-400 transition-colors flex items-center gap-1.5"><Facebook className="w-3.5 h-3.5" /><span>Facebook</span></a>
                <button onClick={() => setShowPolicyModal(true)} className="hover:text-yellow-400 transition-colors flex items-center gap-1.5 mt-2"><Scale className="w-3.5 h-3.5" /><span>Store Policies & Returns</span></button>
              </div>
            </div>
            <div>
              <h4 className="text-yellow-400 font-bold text-xs uppercase tracking-wider mb-3">Store Location</h4>
              <p className="leading-relaxed text-white/80">Shop 9 & 10, ABH Plaza,<br />Bosso Road, Opposite Fire Service,<br />Minna, Niger State.</p>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/70">
            <p>© {new Date().getFullYear()} Swiftwave Variety Mall Limited. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-yellow-400"><ShieldCheck className="w-4 h-4" /><span>CAC Registered Vendor</span></div>
              <div className="border-l border-white/20 pl-4">
                <span className="text-white/60 font-medium">Engineered by <span className="font-bold text-white/90">Mukhtar</span></span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}