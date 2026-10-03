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
  Check,
  Instagram,
  Facebook,
  MessageCircle,
  Headphones
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

  // Google Drive Video Links - Official Embed Preview
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
// 2. STORE CONFIGURATION & SOCIAL HANDLES
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

const SOCIAL_LINKS = {
  instagram: "https://instagram.com/swiiftwave_variety_mall",
  tiktok: "https://www.tiktok.com/@swiftwave.variety.mall",
  facebook: "https://facebook.com/swiftwaveNG",
};

const SUPPORT_REPS = [
  { id: 'sup1', name: 'Support 1 (Main Store)', number: '2349066524315' },
  { id: 'sup2', name: 'Support 2 (Desk Rep)', number: '2348069318521' },
  { id: 'sup3', name: 'Support 3 (Customer Line)', number: '2349132028088' },
];

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
  const cat = (category || '').toLowerCase();
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
  const [isOffline, setIsOffline] = useState<boolean>(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  // Cart with Defensive LocalStorage Persistence
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const savedCart = localStorage.getItem('swiftwave_cart');
      if (!savedCart) return [];
      const parsed = JSON.parse(savedCart);
      if (Array.isArray(parsed)) {
        return parsed.filter((item: any) => item && item.product && typeof item.product.price === 'number');
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Checkout Modal State
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

  // Customer, Fulfillment & Rep Routing
  const [selectedRepNumber, setSelectedRepNumber] = useState<string>(() => {
    if (typeof window === 'undefined') return SUPPORT_REPS[0].number;
    return localStorage.getItem('swiftwave_support_rep') || SUPPORT_REPS[0].number;
  });

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

  // Sync Form States to LocalStorage
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
        if (!item || !item.product) return;
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

  // Catalog Filtering
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products
      .filter((p, index) => {
        if (!p) return false;
        const isAutoNew = index < 10 || (p.badge?.toLowerCase().includes('new') ?? false);
        const pCategory = p.category || '';
        const matchesCategory = 
          selectedCategory === 'All' 
            ? true 
            : selectedCategory === 'New In'
              ? isAutoNew
              : pCategory.toLowerCase() === selectedCategory.toLowerCase();

        const pName = p.name || '';
        const pDesc = p.description || '';
        const pId = p.id || '';
        const q = searchQuery.toLowerCase();

        const matchesSearch = 
          pName.toLowerCase().includes(q) || 
          pDesc.toLowerCase().includes(q) ||
          pId.toLowerCase().includes(q);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (a.in_stock === b.in_stock) return 0;
        return a.in_stock ? -1 : 1;
      });
  }, [products, selectedCategory, searchQuery]);

  // Add to Cart
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item?.product?.id === product.id);
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

    setToastMessage(`Added "${(product.name || '').slice(0, 26)}..." to cart`);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => 
      prev
        .map((item) => {
          if (item?.product?.id === productId) {
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
    setCart((prev) => prev.filter((item) => item?.product?.id !== productId));
  };

  // Subtotal & Department Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      if (!item || !item.product || typeof item.product.price !== 'number') return sum;
      return sum + item.product.price * (item.quantity || 1);
    }, 0);
  }, [cart]);

  const { shop9Items, shop10Items, shop9Total, shop10Total } = useMemo(() => {
    const s9Items: CartItem[] = [];
    const s10Items: CartItem[] = [];
    let s9Sum = 0;
    let s10Sum = 0;

    cart.forEach((item) => {
      if (!item || !item.product) return;
      const shop = getProductShop(item.product.category || '');
      const qty = item.quantity || 1;
      const price = item.product.price || 0;
      if (shop === 'shop10') {
        s10Items.push(item);
        s10Sum += price * qty;
      } else {
        s9Items.push(item);
        s9Sum += price * qty;
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
  const totalCartCount = cart.reduce((sum, item) => sum + (item?.quantity || 0), 0);

  // Opens Checkout preserving order ID
  const openCheckout = () => {
    if (!orderId) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setOrderId(`SW-${randomSuffix}`);
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleFinalOrder = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please provide your full name and an active phone number for rider calls.");
      return;
    }

    if (deliveryMethod === 'minna' && !landmarkHostel.trim()) {
      alert("Please specify your delivery address, landmark, or campus drop-off point.");
      return;
    }

    if (deliveryMethod === 'nationwide' && !deliveryAddress.trim()) {
      alert("Please enter your delivery destination (state, city, street).");
      return;
    }

    const deliveryTitle = 
      deliveryMethod === 'pickup' 
        ? "Store Pickup @ ABH Plaza, Minna (FREE)"
        : deliveryMethod === 'minna'
          ? `Minna Local/Campus Dispatch (₦1,500) - [${minnaCampusZone}]`
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
*Calling Phone:* ${customerPhone.trim()}

*Fulfillment:* ${deliveryTitle}
${deliveryMethod === 'minna' ? `*Area/Zone:* ${minnaCampusZone}\n*Address/Landmark/Drop Point:* ${landmarkHostel.trim()}\n` : ''}${deliveryMethod === 'nationwide' ? `*Delivery Destination:* ${deliveryAddress.trim()}\n` : ''}${orderNotes.trim() ? `*Special Notes:* ${orderNotes.trim()}\n` : ''}
*ITEMS ORDERED:*
${itemsSummary}
----------------------------------------
*Subtotal:* ₦${cartSubtotal.toLocaleString()}
*Delivery Fee:* ₦${deliveryFee.toLocaleString()}
----------------------------------------
${paymentBreakdownText}
----------------------------------------
*Transfer Remark Used:* ${orderId}
*(Attached is my payment transfer receipt screenshot)*`;

    window.open(`https://wa.me/${selectedRepNumber}?text=${encodeURIComponent(message)}`, '_blank');
    
    setCart([]);
    setOrderId('');
    setOrderNotes('');
    setLandmarkHostel('');
    setIsCheckoutOpen(false);
    localStorage.removeItem('swiftwave_checkout_open');
    localStorage.removeItem('swiftwave_order_id');
    localStorage.removeItem('swiftwave_order_notes');
    localStorage.removeItem('swiftwave_landmark');
  };

  const activeVideoEmbed = useMemo(() => {
    return activeModalProduct ? getVideoEmbed(activeModalProduct.video) : null;
  }, [activeModalProduct]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* Offline Alert Strip */}
      {isOffline && (
        <div className="bg-amber-500 text-amber-950 text-xs py-1.5 px-4 font-bold text-center flex items-center justify-center gap-1.5 shadow-sm">
          <span>⚠ You are browsing offline. Showing saved inventory and catalog prices.</span>
        </div>
      )}

      {/* Floating Add-to-Cart Toast */}
      {toastMessage && (
        <aside 
          aria-label="Cart Notification"
          className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-3 border border-purple-500/30 animate-bounce"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button
            onClick={() => {
              setToastMessage(null);
              setIsCartOpen(true);
            }}
            className="text-xs font-bold text-purple-300 hover:text-white underline underline-offset-2 ml-1"
          >
            View Cart
          </button>
        </aside>
      )}

      {/* Top Corporate Legal Badge Bar & Social Presence */}
      <div className="bg-[#170a2c] text-purple-200 text-xs py-2 px-4 border-b border-purple-950">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white tracking-wide">SWIFTWAVE VARIETY MALL LIMITED</span>
            <span className="hidden md:inline text-purple-400/40">|</span>
            <span className="hidden md:inline font-mono text-purple-300">RC: 9468092</span>
          </div>

          <div className="flex items-center gap-4 text-purple-300">
            {/* Social Header Quick Links */}
            <div className="flex items-center gap-2.5 pr-2 border-r border-purple-900/80">
              <a 
                href={SOCIAL_LINKS.instagram} 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-white transition-colors"
                title="Follow on Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a 
                href={SOCIAL_LINKS.tiktok} 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-white transition-colors flex items-center"
                title="Follow on TikTok"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.99v8.29c.03 2.05-.72 4.17-2.18 5.62-1.74 1.79-4.34 2.5-6.75 1.95-2.61-.53-4.78-2.6-5.46-5.18-.8-2.91.43-6.19 3.02-7.66 1.48-.87 3.26-1.07 4.93-.68v4.11c-.93-.31-1.99-.25-2.87.21-1.09.56-1.74 1.77-1.64 3 .07 1.19.86 2.27 2 2.59 1.25.37 2.7-.1 3.42-1.13.38-.52.55-1.17.54-1.81V.02z" />
                </svg>
              </a>
              <a 
                href={SOCIAL_LINKS.facebook} 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-white transition-colors"
                title="Follow on Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
            </div>

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
            
            {/* Brand Logo */}
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
                <span className="bg-emerald-500 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center -ml-1 animate-pulse">
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

          {/* Category Filter Pills */}
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
        
        {/* Brand Hero Banner */}
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
              const displayImage = formatDriveUrl(product.images?.[0] || '');
              const inCartQty = cart.find((i) => i?.product?.id === product.id)?.quantity || 0;
              const isMaxed = product.stock_quantity !== undefined && inCartQty >= product.stock_quantity;

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
                      setIsDescExpanded(false);
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

                    {/* Low Stock Warning Badge */}
                    {product.in_stock && product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 3 && (
                      <span className="absolute top-2.5 right-2.5 bg-amber-400 text-amber-950 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-900 animate-ping"></span>
                        Only {product.stock_quantity} left
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
                          setIsDescExpanded(false);
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

                      {product.in_stock ? (
                        <button
                          onClick={() => addToCart(product)}
                          disabled={isMaxed}
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                            isMaxed
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-purple-700 hover:bg-purple-800 text-white shadow-sm shadow-purple-700/30 active:scale-95'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isMaxed ? 'Max in Cart' : 'Add'}</span>
                        </button>
                      ) : (
                        <a
                          href={`https://wa.me/${selectedRepNumber}?text=${encodeURIComponent(
                            `Hello Swiftwave Mall, I noticed "${product.name}" (ID: ${product.id}) is sold out. Please notify me when it is back in stock!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-2 rounded-xl transition-all bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 active:scale-95 shrink-0"
                          title="Notify me when restocked via WhatsApp"
                        >
                          <span>Restock</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative border border-slate-200 flex flex-col max-h-[92vh]">
            
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
                    <span>Product Photos ({activeModalProduct.images?.length || 1})</span>
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

              {/* Main Media Stage: Full Width 4:3 with Fullscreen support */}
              {mediaViewMode === 'video' && activeVideoEmbed ? (
                <div className="mb-4">
                  <div className="relative w-full aspect-[4/3] sm:aspect-video rounded-2xl bg-black overflow-hidden shadow-md border border-slate-800 flex items-center justify-center">
                    {activeVideoEmbed.type === 'iframe' ? (
                      <iframe
                        src={activeVideoEmbed.embedUrl}
                        title={activeModalProduct.name}
                        className="w-full h-full border-0"
                        allow="fullscreen; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <video 
                        controls 
                        playsInline 
                        preload="auto" 
                        className="w-full h-full object-contain"
                      >
                        <source src={activeVideoEmbed.embedUrl} type="video/mp4" />
                        Your browser does not support HTML5 video.
                      </video>
                    )}
                  </div>
                  
                  {activeModalProduct.video && (
                    <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                      <span>Store demonstration</span>
                      <a
                        href={activeModalProduct.video}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-700 hover:text-purple-900 font-bold inline-flex items-center gap-1 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200 transition-colors"
                      >
                        <span>Open Original Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className="relative aspect-video rounded-2xl bg-slate-100 overflow-hidden mb-4 group cursor-zoom-in"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Click to view full image in high resolution"
                >
                  <img
                    src={formatDriveUrl(activeModalProduct.images?.[activeImageIndex] || activeModalProduct.images?.[0] || '')}
                    alt={activeModalProduct.name}
                    className="w-full h-full object-contain"
                  />

                  <div className="absolute top-2.5 right-2.5 bg-slate-900/60 backdrop-blur-md text-white p-1.5 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </div>

                  {activeModalProduct.images && activeModalProduct.images.length > 1 && (
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
              {mediaViewMode === 'photos' && activeModalProduct.images && activeModalProduct.images.length > 1 && (
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

              <div className="flex items-start justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-900 leading-snug">{activeModalProduct.name}</h2>
                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-purple-900">
                    ₦{activeModalProduct.price.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Description with Inline Expand */}
              <div className="mt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Specifications & Details</h4>
                <div className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                  <p className="whitespace-pre-line inline">
                    {isDescExpanded || activeModalProduct.description.length <= 150
                      ? activeModalProduct.description
                      : `${activeModalProduct.description.slice(0, 150)}...`}
                  </p>
                  {activeModalProduct.description.length > 150 && (
                    <button
                      type="button"
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      className="ml-1.5 text-purple-700 hover:text-purple-900 font-bold inline underline underline-offset-2 transition-colors text-xs"
                    >
                      {isDescExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex flex-col text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Verified Stock @ ABH Plaza</span>
                </div>

                {activeModalProduct.in_stock && activeModalProduct.stock_quantity !== undefined && activeModalProduct.stock_quantity <= 3 && activeModalProduct.stock_quantity > 0 && (
                  <span className="text-[11px] font-bold text-amber-700 mt-0.5 flex items-center gap-1">
                    ⚠️ High demand: Only {activeModalProduct.stock_quantity} units remaining
                  </span>
                )}
              </div>

              {activeModalProduct.in_stock ? (
                <button
                  onClick={() => {
                    addToCart(activeModalProduct);
                    setActiveModalProduct(null);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-xl shadow-md bg-purple-700 hover:bg-purple-800 text-white shadow-purple-700/30 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              ) : (
                <a
                  href={`https://wa.me/${selectedRepNumber}?text=${encodeURIComponent(
                    `Hello Swiftwave Mall, I saw that "${activeModalProduct.name}" (ID: ${activeModalProduct.id}) is currently sold out. When are you restocking it?`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all"
                >
                  <span>Request Restock via WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* High-Resolution Lightbox Modal */}
      {isLightboxOpen && activeModalProduct && (
        <div 
          className="fixed inset-0 z-[70] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="flex items-center justify-between text-white max-w-5xl mx-auto w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-purple-300 font-bold bg-purple-900/60 px-2.5 py-1 rounded-lg border border-purple-700/50">
                {activeImageIndex + 1} / {activeModalProduct.images?.length || 1}
              </span>
              <h4 className="text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-md text-slate-200">
                {activeModalProduct.name}
              </h4>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full my-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={formatDriveUrl(activeModalProduct.images?.[activeImageIndex] || activeModalProduct.images?.[0] || '')}
              alt=""
              className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl select-none"
            />

            {activeModalProduct.images && activeModalProduct.images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === 0 ? activeModalProduct.images.length - 1 : prev - 1))}
                  className="absolute left-2 sm:left-4 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-white/10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev === activeModalProduct.images.length - 1 ? 0 : prev + 1))}
                  className="absolute right-2 sm:right-4 w-12 h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-white/10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {activeModalProduct.images && activeModalProduct.images.length > 1 && (
            <div className="flex justify-center gap-2 max-w-md mx-auto overflow-x-auto py-2" onClick={(e) => e.stopPropagation()}>
              {activeModalProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-purple-500 scale-105' : 'border-white/20 opacity-50'
                  }`}
                >
                  <img src={formatDriveUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
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
              {removedItemsNotice.length > 0 && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-amber-950 block">Inventory Update</span>
                    <ul className="list-disc list-inside mt-1 font-semibold text-amber-900 text-[11px] space-y-0.5">
                      {removedItemsNotice.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRemovedItemsNotice([])}
                    className="text-amber-600 hover:text-amber-950 p-1 font-bold"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

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
                      src={formatDriveUrl(product.images?.[0] || '')} 
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
                          disabled={product.stock_quantity !== undefined && quantity >= product.stock_quantity}
                          className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                            product.stock_quantity !== undefined && quantity >= product.stock_quantity
                              ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        {product.stock_quantity !== undefined && quantity >= product.stock_quantity && (
                          <span className="text-[10px] text-amber-700 font-bold ml-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Max ({product.stock_quantity})
                          </span>
                        )}
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
                  onClick={openCheckout}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Proceed to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCheckoutOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 relative border border-slate-200 shadow-2xl">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Order Reference Pill & Narration Copy */}
            <div className="flex items-center justify-between mb-2 pr-8">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-900 font-mono">
                  Order #{orderId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(orderId);
                    setCopiedOrderId(true);
                    setTimeout(() => setCopiedOrderId(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:underline bg-purple-50 px-2 py-0.5 rounded"
                  title="Copy Remark for Bank App"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedOrderId ? 'Copied!' : 'Copy Remark'}</span>
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-0.5">Checkout & Payment</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Copy the bank details below, transfer via your banking app, and return here to submit your receipt via WhatsApp.
            </p>

            <div className="space-y-3 mb-5">
              
              {/* WhatsApp Support Rep Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1">
                    <Headphones className="w-3.5 h-3.5 text-purple-700" />
                    <span>Send Order To WhatsApp Rep</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Choose who to message</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SUPPORT_REPS.map((rep) => (
                    <button
                      key={rep.id}
                      type="button"
                      onClick={() => setSelectedRepNumber(rep.number)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        selectedRepNumber === rep.number
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[11px] block font-semibold leading-tight">{rep.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{rep.number}</span>
                    </button>
                  ))}
                </div>
              </div>

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
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1">
                  <span>Active Phone Number</span>
                  <span className="text-[10px] font-normal text-slate-400">For rider direct voice calls</span>
                </label>
                <div className="relative">
                  <PhoneCall className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="e.g. 08012345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Fulfillment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('pickup')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      deliveryMethod === 'pickup'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-sm'
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
                    className={`p-2 rounded-xl border text-center transition-all ${
                      deliveryMethod === 'minna'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-sm'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-purple-700" />
                    <span className="text-[11px] block">Minna Delivery</span>
                    <span className="text-[10px] font-bold text-purple-900">₦1,500</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('nationwide')}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      deliveryMethod === 'nationwide'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-sm'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Truck className="w-4 h-4 mx-auto mb-1 text-purple-700" />
                    <span className="text-[11px] block">Nationwide</span>
                    <span className="text-[10px] font-bold text-slate-600">₦4,500</span>
                  </button>
                </div>
              </div>

              {/* Minna Metropolitan & Campus Drop-Off Pickers */}
              {deliveryMethod === 'minna' && (
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5 animate-fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-purple-950 block mb-1">
                      Minna Area / Hub
                    </label>
                    <select
                      value={minnaCampusZone}
                      onChange={(e) => setMinnaCampusZone(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-purple-300 bg-white font-medium text-slate-800 focus:border-purple-600 outline-none"
                    >
                      {MINNA_ZONES.map((zone) => (
                        <option key={zone} value={zone}>{zone}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-purple-950 block mb-1">
                      Delivery Address / Drop-off Point / Landmark
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Gidan Kwano Main Gate, Bosso Low-Cost, or Street Address in Tunga"
                      value={landmarkHostel}
                      onChange={(e) => setLandmarkHostel(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-purple-300 bg-white text-slate-800 focus:border-purple-600 outline-none"
                    />
                    <p className="text-[10px] text-purple-700/80 mt-1">
                      ℹ Campus dispatch riders meet customers at the Main School Gate / central landmark.
                    </p>
                  </div>
                </div>
              )}

              {/* Nationwide Address Field */}
              {deliveryMethod === 'nationwide' && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Delivery Destination (State, City, Street)</label>
                  <input
                    type="text"
                    placeholder="e.g. Abuja FCT, Gwarinpa, 3rd Avenue, House 12"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Order Notes / Color / Preference (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Preferred color, or specific delivery instructions"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            {/* Dynamic Bank Account Cards */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-purple-900 uppercase">
                  {isMixedCart ? 'Transfer Payment by Store Department' : 'Official OPay Account Details'}
                </span>
                <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                  Remark: {orderId}
                </span>
              </div>

              {/* Shop 10 Box */}
              {hasShop10 && (
                <div className="bg-[#170a2c] text-white rounded-2xl p-3.5 border border-purple-900/60 shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-purple-950">
                    <div>
                      <span className="text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase block">
                        SHOP 10 • GADGETS & TECH
                      </span>
                      <span className="text-xs text-purple-200 font-medium">Bank: OPay</span>
                    </div>
                    {isMixedCart && (
                      <span className="text-xs font-mono font-bold text-purple-200 bg-purple-900/50 px-2 py-0.5 rounded">
                        Due: ₦{shop10Total.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-2.5">
                    <div>
                      <span className="text-[10px] text-purple-300 block">Account Number</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(SHOP_ACCOUNTS.shop10.number);
                          setCopiedShop10(true);
                          setTimeout(() => setCopiedShop10(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 font-mono text-base font-black text-emerald-400 hover:underline"
                      >
                        <span>{SHOP_ACCOUNTS.shop10.number}</span>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-right font-semibold text-purple-300 max-w-[150px] leading-tight">
                      SWIFTWAVE VARIETY MALL LIMITED
                    </span>
                  </div>
                  {copiedShop10 && (
                    <p className="text-[11px] text-emerald-400 font-bold mt-1">✓ Copied Shop 10 Account!</p>
                  )}
                </div>
              )}

              {/* Shop 9 Box */}
              {hasShop9 && (
                <div className="bg-[#170a2c] text-white rounded-2xl p-3.5 border border-purple-900/60 shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-purple-950">
                    <div>
                      <span className="text-[10px] font-extrabold tracking-wider text-amber-400 uppercase block">
                        SHOP 9 • DAILY ESSENTIALS & HOME
                      </span>
                      <span className="text-xs text-purple-200 font-medium">Bank: OPay</span>
                    </div>
                    {isMixedCart && (
                      <span className="text-xs font-mono font-bold text-purple-200 bg-purple-900/50 px-2 py-0.5 rounded">
                        Due: ₦{shop9Total.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center mt-2.5">
                    <div>
                      <span className="text-[10px] text-purple-300 block">Account Number</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(SHOP_ACCOUNTS.shop9.number);
                          setCopiedShop9(true);
                          setTimeout(() => setCopiedShop9(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 font-mono text-base font-black text-amber-300 hover:underline"
                      >
                        <span>{SHOP_ACCOUNTS.shop9.number}</span>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-right font-semibold text-purple-300 max-w-[150px] leading-tight">
                      SWIFTWAVE VARIETY MALL LIMITED
                    </span>
                  </div>
                  {copiedShop9 && (
                    <p className="text-[11px] text-amber-300 font-bold mt-1">✓ Copied Shop 9 Account!</p>
                  )}
                </div>
              )}

              {/* Total & Summary Strip */}
              <div className="p-3 bg-purple-50 rounded-2xl border border-purple-200 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-purple-950 block">Grand Total Due</span>
                  <span className="text-[10px] text-purple-700">Includes ₦{deliveryFee.toLocaleString()} delivery</span>
                </div>
                <span className="text-lg font-black text-purple-950">
                  ₦{orderTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinalOrder}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span>I Have Transferred • Submit via WhatsApp</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2 leading-relaxed">
              Order routes to selected rep with reference <strong className="font-mono text-slate-600">#{orderId}</strong> for instant store confirmation.
            </p>
          </div>
        </div>
      )}

      {/* Brand Identity Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative border border-slate-200 shadow-2xl">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
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

            {/* Official Social Media Strip */}
            <div className="mb-4 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block mb-2">Connect With Us</span>
              <div className="flex items-center gap-2">
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-600" />
                  <span>Instagram</span>
                </a>
                <a
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <svg className="w-3.5 h-3.5 fill-current text-slate-900" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.99v8.29c.03 2.05-.72 4.17-2.18 5.62-1.74 1.79-4.34 2.5-6.75 1.95-2.61-.53-4.78-2.6-5.46-5.18-.8-2.91.43-6.19 3.02-7.66 1.48-.87 3.26-1.07 4.93-.68v4.11c-.93-.31-1.99-.25-2.87.21-1.09.56-1.74 1.77-1.64 3 .07 1.19.86 2.27 2 2.59 1.25.37 2.7-.1 3.42-1.13.38-.52.55-1.17.54-1.81V.02z" />
                  </svg>
                  <span>TikTok</span>
                </a>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Facebook className="w-3.5 h-3.5 text-blue-600" />
                  <span>Facebook</span>
                </a>
              </div>
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

      {/* Floating Mobile Install App Banner */}
      {showInstallBanner && (
        <aside 
          aria-label="Install App"
          className="fixed bottom-4 left-4 right-4 sm:hidden z-40 bg-[#170a2c] text-white p-3.5 rounded-2xl border border-purple-800/80 shadow-2xl flex items-center justify-between gap-3 animate-fade-in"
        >
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/logo.png"
              alt="Swiftwave"
              className="w-10 h-10 rounded-xl object-contain bg-purple-950 p-1 border border-purple-800 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">Install Swiftwave App</h4>
              <p className="text-[10px] text-purple-300 truncate">Faster browsing & instant order tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition-all shadow-md shadow-purple-900/40 active:scale-95"
            >
              Install
            </button>
            <button
              onClick={dismissInstallBanner}
              className="text-purple-400 hover:text-white p-1"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Footer */}
      <footer className="bg-[#120722] text-purple-200/80 text-xs border-t border-purple-950 pt-10 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-purple-950">
            <div className="md:col-span-1">
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
              <p className="text-purple-300/70 leading-relaxed text-xs">
                Friendly, fast, and affordable. The one-stop shop that keeps everyday life moving.
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Customer Support</h4>
              <ul className="space-y-2 text-purple-300/70">
                {SUPPORT_REPS.map((rep) => (
                  <li key={rep.id}>
                    <a 
                      href={`https://wa.me/${rep.number}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{rep.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Connect With Us</h4>
              <div className="flex flex-col space-y-2 text-purple-300/70">
                <a 
                  href={SOCIAL_LINKS.instagram} 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-pink-400 transition-colors flex items-center gap-1.5"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>Instagram</span>
                </a>
                <a 
                  href={SOCIAL_LINKS.tiktok} 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.99v8.29c.03 2.05-.72 4.17-2.18 5.62-1.74 1.79-4.34 2.5-6.75 1.95-2.61-.53-4.78-2.6-5.46-5.18-.8-2.91.43-6.19 3.02-7.66 1.48-.87 3.26-1.07 4.93-.68v4.11c-.93-.31-1.99-.25-2.87.21-1.09.56-1.74 1.77-1.64 3 .07 1.19.86 2.27 2 2.59 1.25.37 2.7-.1 3.42-1.13.38-.52.55-1.17.54-1.81V.02z" />
                  </svg>
                  <span>TikTok</span>
                </a>
                <a 
                  href={SOCIAL_LINKS.facebook} 
                  target="_blank" 
                  rel="noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <Facebook className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Store Location</h4>
              <p className="leading-relaxed text-purple-300/70">
                Shop 9 & 10, ABH Plaza,<br />
                Bosso Road, Opposite Fire Service,<br />
                Minna, Niger State.
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
