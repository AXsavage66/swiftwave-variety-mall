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
// 1. DATA FORMATTERS & EMBED RESOLVERS
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
// 2. TYPES & STORE CONFIGURATION
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

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1XysYSGvgDR9t70VSrIwdXsN3GwzOjFmLUOfgB2s8Xbo/gviz/tq?tqx=out:csv"; 

const SHOP_ACCOUNTS = {
  shop9: {
    title: "Shop 9: Daily Essentials & Home",
    bank: "OPay",
    number: "6551680741",
    name: "SWIFTWAVE VARIETY MALL LIMITED",
  },
  shop10: {
    title: "Shop 10: Gadgets & Tech Accessories",
    bank: "OPay",
    number: "6551791518",
    name: "SWIFTWAVE VARIETY MALL LIMITED",
  },
};

const MINNA_ZONES = [
  'Gidan Kwano (FUTMINNA Main Campus / Hostels)',
  'Bosso Campus (FUTMINNA Mini Campus / Staff Qtrs)',
  'Bosso Town / Mobil / Western Bypass',
  'Tunga / Commercial Hub / GRA',
  'Chanchaga / Shiroro Road',
  'Kpakungu / Minna City Gate',
  'Other Minna Location'
];

const getProductShop = (category: string): 'shop9' | 'shop10' => {
  const cat = category.toLowerCase();
  if (
    cat.includes('gadget') || 
    cat.includes('phone') || 
    cat.includes('creator') ||
    cat.includes('electronic')
  ) {
    return 'shop10';
  }
  return 'shop9';
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
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
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);

  // Cart with LocalStorage Persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedCart = localStorage.getItem('swiftwave_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [copiedShop9, setCopiedShop9] = useState<boolean>(false);
  const [copiedShop10, setCopiedShop10] = useState<boolean>(false);
  const [removedItemsNotice, setRemovedItemsNotice] = useState<string[]>([]);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

  // Customer, Fulfillment & Order Reference Fields
  const [orderId, setOrderId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'minna' | 'nationwide'>('pickup');
  const [minnaCampusZone, setMinnaCampusZone] = useState<string>('Gidan Kwano (FUTMINNA Main Campus / Hostels)');
  const [landmarkHostel, setLandmarkHostel] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  const WHATSAPP_PHONE = "2349066524315";

  // Sync Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('swiftwave_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  }, [cart]);

  // Network State Listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = sessionStorage.getItem('swiftwave_install_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  const dismissInstallBanner = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('swiftwave_install_dismissed', 'true');
  };

  // Google Sheet Catalog Sync
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

          const rawQuantity = clean(row[9]);
          const parsedQty = rawQuantity !== '' && !isNaN(Number(rawQuantity)) 
            ? Number(rawQuantity) 
            : undefined;

          const isExplicitlySoldOut = parsedQty !== undefined && parsedQty <= 0;

          parsed.push({
            id: clean(row[0]) || `SW-${String(i).padStart(3, '0')}`,
            name: clean(row[1]),
            category: normalizeCategory(clean(row[2])),
            price: Number(clean(row[3]).replace(/[^0-9.-]+/g, '')) || 0,
            description: clean(row[4]),
            images: rawImages.length > 0 ? rawImages : [""],
            badge: clean(row[6]) || undefined,
            in_stock: !isExplicitlySoldOut && (clean(row[7]).toLowerCase() === 'true' || clean(row[7]).toLowerCase() === 'yes'),
            video: clean(row[8]) || undefined,
            stock_quantity: parsedQty,
          });
        }

        setProducts(parsed);
      })
      .catch((err) => console.error("Error loading inventory sheet:", err))
      .finally(() => setLoading(false));
  }, []);

  // Cart & Inventory Stock Reconciliation
  useEffect(() => {
    if (products.length === 0) return;

    setCart((currentCart) => {
      if (currentCart.length === 0) return currentCart;

      const notices: string[] = [];
      const updatedCart: CartItem[] = [];

      currentCart.forEach((item) => {
        const liveProduct = products.find((p) => p.id === item.product.id);

        if (!liveProduct || !liveProduct.in_stock || (liveProduct.stock_quantity !== undefined && liveProduct.stock_quantity <= 0)) {
          notices.push(`"${item.product.name}" is now sold out and was removed.`);
        } else {
          let adjustedQty = item.quantity;
          if (liveProduct.stock_quantity !== undefined && item.quantity > liveProduct.stock_quantity) {
            adjustedQty = liveProduct.stock_quantity;
            notices.push(
              `"${liveProduct.name}" quantity adjusted from ${item.quantity} to ${liveProduct.stock_quantity} (max available).`
            );
          }

          updatedCart.push({
            product: liveProduct,
            quantity: adjustedQty,
          });
        }
      });

      if (notices.length > 0) {
        setRemovedItemsNotice(notices);
      }

      return updatedCart;
    });
  }, [products]);

  // Catalog Sorter: In-Stock Items First
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
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
      })
      .sort((a, b) => {
        if (a.in_stock === b.in_stock) return 0;
        return a.in_stock ? -1 : 1;
      });
  }, [products, selectedCategory, searchQuery]);

  // Cart Handlers
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const maxStock = product.stock_quantity;

      if (maxStock !== undefined && currentQty >= maxStock) {
        return prev;
      }

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
            const maxStock = item.product.stock_quantity;
            const newQty = item.quantity + delta;

            if (delta > 0 && maxStock !== undefined && item.quantity >= maxStock) {
              return item;
            }

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

  // Subtotal & Department Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const { shop9Items, shop10Items, shop9Total, shop10Total } = useMemo(() => {
    const s9Items: CartItem[] = [];
    const s10Items: CartItem[] = [];
    let s9Sum = 0;
    let s10Sum = 0;

    cart.forEach((item) => {
      const shop = getProductShop(item.product.category);
      if (shop === 'shop10') {
        s10Items.push(item);
        s10Sum += item.product.price * item.quantity;
      } else {
        s9Items.push(item);
        s9Sum += item.product.price * item.quantity;
      }
    });

    return {
      shop9Items: s9Items,
      shop10Items: s10Items,
      shop9Total: s9Sum,
      shop10Total: s10Sum,
    };
  }, [cart]);

  const hasShop9 = shop9Items.length > 0;
  const hasShop10 = shop10Items.length > 0;
  const isMixedCart = hasShop9 && hasShop10;

  const deliveryFee = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    if (deliveryMethod === 'minna') return 1500;
    return 4500;
  }, [deliveryMethod]);

  const orderTotal = cartSubtotal + deliveryFee;
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Opens Checkout with Fresh Order ID
  const openCheckout = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setOrderId(`SW-${randomSuffix}`);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleFinalOrder = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please provide your full name and active phone number.");
      return;
    }

    if (deliveryMethod === 'minna' && !landmarkHostel.trim()) {
      alert("Please specify your hostel, lodge, or landmark in Minna.");
      return;
    }

    if (deliveryMethod === 'nationwide' && !deliveryAddress.trim()) {
      alert("Please enter your state, city, and delivery destination.");
      return;
    }

    const deliveryTitle = 
      deliveryMethod === 'pickup' 
        ? "Store Pickup @ ABH Plaza, Minna (FREE)"
        : deliveryMethod === 'minna'
          ? `Minna Campus/Local Dispatch (₦1,500) - [${minnaCampusZone}]`
          : "Nationwide Logistics Dispatch (₦4,500)";

    let paymentBreakdownText = "";
    if (isMixedCart) {
      paymentBreakdownText = `*PAYMENT SPLIT INSTRUCTIONS:*
• Shop 9 (Essentials Subtotal): ₦${shop9Total.toLocaleString()} -> Pay to OPay (${SHOP_ACCOUNTS.shop9.number})
• Shop 10 (Gadgets Subtotal): ₦${shop10Total.toLocaleString()} -> Pay to OPay (${SHOP_ACCOUNTS.shop10.number})
• Delivery Fee: ₦${deliveryFee.toLocaleString()} (Paid to either account)
*TOTAL PAID:* ₦${orderTotal.toLocaleString()}`;
    } else if (hasShop10) {
      paymentBreakdownText = `*PAYMENT ACCOUNT:*
Paid into OPay (${SHOP_ACCOUNTS.shop10.number}) - Shop 10 Gadgets
Account: ${SHOP_ACCOUNTS.shop10.name}
*TOTAL PAID:* ₦${orderTotal.toLocaleString()}`;
    } else {
      paymentBreakdownText = `*PAYMENT ACCOUNT:*
Paid into OPay (${SHOP_ACCOUNTS.shop9.number}) - Shop 9 Daily Essentials
Account: ${SHOP_ACCOUNTS.shop9.name}
*TOTAL PAID:* ₦${orderTotal.toLocaleString()}`;
    }

    let itemsSummary = "";
    if (isMixedCart) {
      itemsSummary = `*SHOP 10 (GADGETS & TECH):*
${shop10Items.map((item, idx) => `  ${idx + 1}. ${item.product.name} x${item.quantity} = ₦${(item.product.price * item.quantity).toLocaleString()}`).join('\n')}

*SHOP 9 (DAILY ESSENTIALS):*
${shop9Items.map((item, idx) => `  ${idx + 1}. ${item.product.name} x${item.quantity} = ₦${(item.product.price * item.quantity).toLocaleString()}`).join('\n')}`;
    } else {
      itemsSummary = cart.map((item, idx) => 
        `${idx + 1}. ${item.product.name} (ID: ${item.product.id}) x${item.quantity} = ₦${(item.product.price * item.quantity).toLocaleString()}`
      ).join('\n');
    }

    const message = `🛍️ *PAID ORDER VERIFICATION - SWIFTWAVE MALL*
*Order Reference:* #${orderId}
----------------------------------------
*Customer Name:* ${customerName.trim()}
*Contact Phone:* ${customerPhone.trim()}

*Fulfillment:* ${deliveryTitle}
${deliveryMethod === 'minna' ? `*Campus/Area:* ${minnaCampusZone}\n*Hostel/Landmark:* ${landmarkHostel.trim()}\n` : ''}${deliveryMethod === 'nationwide' ? `*Delivery Destination:* ${deliveryAddress.trim()}\n` : ''}${orderNotes.trim() ? `*Special Notes:* ${orderNotes.trim()}\n` : ''}
*ITEMS ORDERED:*
${itemsSummary}
----------------------------------------
*Subtotal:* ₦${cartSubtotal.toLocaleString()}
*Delivery Fee:* ₦${deliveryFee.toLocaleString()}
----------------------------------------
${paymentBreakdownText}
----------------------------------------
*Transfer Narration Used:* ${orderId}
*(Attached is my payment transfer receipt screenshot)*`;

    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
    setCart([]);
    setIsCheckoutOpen(false);
  };

  const activeVideoEmbed = useMemo(() => {
    return activeModalProduct ? getVideoEmbed(activeModalProduct.video) : null;
  }, [activeModalProduct]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 text-xs py-1.5 px-4 font-bold text-center flex items-c