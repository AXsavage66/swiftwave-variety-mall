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
  Image as ImageIcon,
  Maximize2,
  PhoneCall,
  Check
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

export function getVideoThumbnail(videoUrl?: string): string | null {
  if (!videoUrl) return null;
  const cleanUrl = videoUrl.trim();

  // Google Drive Video Preview Frame
  const driveMatch = cleanUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}=w800`;
  }

  // YouTube / Shorts High-Res Thumbnail
  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]+)/);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  return null;
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

// Refined, accurate Minna metropolitan and campus hubs
const MINNA_ZONES = [
  'FUTMINNA Gidan Kwano (Main Campus / Main Gate)',
  'Bosso (FUTMINNA Bosso Campus / Bosso Low-Cost / Mobil)',
  'Tunga (Commercial Hub / Market / Police HQ / GRA)',
  'Chanchaga / Shiroro Road / College of Education (COE)',
  'Kpakungu / Western Bypass / Minna City Gate',
  'Maitumbi / Old Airport Road',
  'Dutsen Kura (Gwari & Hausa) / Kure Market',
  'Other Location in Minna'
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
  
  // Media Modal & Lightbox States
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [mediaViewMode, setMediaViewMode] = useState<'photos' | 'video'>('photos');
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

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
  
  // Floating Toast Notification when adding items
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Checkout Modal State (Persisted in localStorage against app switching)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('swiftwave_checkout_open') === 'true';
  });

  const [copiedShop9, setCopiedShop9] = useState<boolean>(false);
  const [copiedShop10, setCopiedShop10] = useState<boolean>(false);
  const [copiedOrderId, setCopiedOrderId] = useState<boolean>(false);
  const [removedItemsNotice, setRemovedItemsNotice] = useState<string[]>([]);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

  // Customer, Fulfillment & Order Reference Fields (Persisted in localStorage)
  const [orderId, setOrderId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('swiftwave_order_id') || '';
  });

  const [customerName, setCustomerName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('swiftwave_cust_name') || '';
  });

  const [customerPhone, setCustomerPhone] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('swiftwave_cust_phone') || '';
  });

  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'minna' | 'nationwide'>(() => {
    if (typeof window === 'undefined') return 'pickup';
    return (localStorage.getItem('swiftwave_delivery_method') as any) || 'pickup';
  });

  const [minnaCampusZone, setMinnaCampusZone] = useState<string>(() => {
    if (typeof window === 'undefined') return MINNA_ZONES[0];
    return localStorage.getItem('swiftwave_minna_zone') || MINNA_ZONES[0];
  });

  const [landmarkHostel, setLandmarkHostel] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('swiftwave_landmark') || '';
  });

  const [deliveryAddress, setDeliveryAddress] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('swiftwave_deliv_address') || '';
  });

  const [orderNotes, setOrderNotes] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('swiftwave_order_notes') || '';
  });

  const WHATSAPP_PHONE = "2349066524315";

  // Sync Form States to LocalStorage to survive banking app switches
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
    } catch (e) {
      console.error('Storage sync error:', e);
    }
  }, [cart, isCheckoutOpen, orderId, customerName, customerPhone, deliveryMethod, minnaCampusZone, landmarkHostel, deliveryAddress, orderNotes]);

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

  // Google Sheet Catalog Sync (Reversed for newest at top)
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

          const rawVideo = clean(row[8]);
          const videoThumbnail = getVideoThumbnail(rawVideo);

          const finalImages = rawImages.length > 0 
            ? rawImages 
            : videoThumbnail 
              ? [videoThumbnail] 
              : [""];

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
            images: finalImages,
            badge: clean(row[6]) || undefined,
            in_stock: !isExplicitlySoldOut && (clean(row[7]).toLowerCase() === 'true' || clean(row[7]).toLowerCase() === 'yes'),
            video: rawVideo || undefined,
            stock_quantity: parsedQty,
          });
        }

        setProducts(parsed.reverse());
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

  // Catalog Filtering with Automatic "New In" Detection
  const filteredProducts = useMemo(() => {
    return products
      .filter((p, index) => {
        const isAutoNew = index < 10 || (p.badge?.toLowerCase().includes('new') ?? false);

        const matchesCategory = 
          selectedCategory === 'All' 
            ? true 
            : selectedCategory === 'New In'
              ? isAutoNew
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

  // Non-intrusive Add to Cart (Never forces open the cart drawer)
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

    // Sleek non-blocking confirmation toast
    setToastMessage(`Added "${product.name.slice(0, 26)}..." to cart`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
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

  // Opens Checkout preserving or generating order ID
  const openCheckout = () => {
    if (!orderId) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setOrderId(`SW-${randomSuffix}`);
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleFinalOrder = () => {
    if (!customerName.trim() || !customerPhone