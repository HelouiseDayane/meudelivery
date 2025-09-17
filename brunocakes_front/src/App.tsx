import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { Toaster } from './components/ui/sonner';
import { api } from './api';
import { toast } from 'sonner';

// Auth Components
import { AdminLogin } from './components/auth/AdminLogin';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProductsManagement } from './components/admin/ProductsManagement';
import { OrdersManagement } from './components/admin/OrdersManagement';
import { ClientsManagement } from './components/admin/ClientsManagement';

// Public Components
import { PublicMenu } from './components/public/PublicMenu';
import { Cart } from './components/public/Cart';
import { Checkout } from './components/public/Checkout';
import { PixPayment } from './components/client/PixPayment';
import { ClientOrders as OrderTracking } from './components/client/ClientOrders';

// Layouts
import { AdminLayout } from './components/layouts/AdminLayout';
import { PublicLayout } from './components/layouts/PublicLayout';

// Types
interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'staff';
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  file?: File;
  category: string;
  available: boolean;
  stock: number;
  expiryDate?: string;
  isPromotion: boolean;
  promotionPrice?: number;
  isNew: boolean;
  is_active?: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  additionalInfo?: string;
}

interface Order {
  id: string;
  customer: CustomerData;
  items: CartItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'cancelled';
  createdAt: string;
  pixPaymentId?: string;
}

interface AnalyticsData {
  salesByDay: { date: string; amount: number }[];
  salesByMonth: { month: string; amount: number }[];
  salesByYear: { year: string; amount: number }[];
  topProductsWeek: { product: string; quantity: number; revenue: number }[];
  topProductsMonth: { product: string; quantity: number; revenue: number }[];
  neighborhoodsSales: { neighborhood: string; orders: number; revenue: number }[];
  totalRevenue: number;
}

// Context
interface AppContextProps {
  admin: Admin | null;
  isAdminAuthenticated: boolean;
  adminLogin: (email: string, password: string) => Promise<boolean>;
  adminLogout: () => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  products: Product[];
  orders: Order[];
  analytics: AnalyticsData | null;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  toggleProduct: (id: string) => void;
  createOrder: (customer: CustomerData, items: CartItem[], total: number) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updatePaymentStatus: (orderId: string, status: Order['paymentStatus']) => void;
  loadAnalytics: () => void;
  getOrderById: (orderId: string) => Order | undefined;
}

const AppContext = createContext<AppContextProps>({} as AppContextProps);
export const useApp = () => useContext(AppContext);

// App
function App() {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdminAuthenticated = !!admin;

  // --- Admin Functions ---
  const adminLogin = async (email: string, password: string): Promise<boolean> => {
    try {
      const response: any = await api.adminLogin(email, password);
      if (response?.token) {
        localStorage.setItem('admin_token', response.token);
        const adminData: Admin = {
          id: response.id,
          name: response.name,
          email: response.email,
          role: 'staff'
        };
        setAdmin(adminData);
        localStorage.setItem('bruno_admin', JSON.stringify(adminData));
        toast.success(`Bem-vindo ao painel administrativo, ${adminData.name}!`);
        return true;
      }
      toast.error('Email ou senha incorretos');
      return false;
    } catch (err: any) {
      toast.error(err.message || 'Erro no login');
      return false;
    }
  };

  const adminLogout = () => {
    setAdmin(null);
    localStorage.removeItem('bruno_admin');
    localStorage.removeItem('admin_token');
    toast.info('Logout realizado com sucesso');
    navigate('/admin/login');
  };

  // --- Cart Functions ---
  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock < quantity) return toast.error('Estoque insuficiente');

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (newQty > product.stock) return prev;
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: newQty } : item);
      }
      return [...prev, { product, quantity }];
    });
    toast.success(`${product.name} adicionada ao carrinho`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    toast.info('Item removido do carrinho');
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) return toast.error('Quantidade solicitada excede o estoque');
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Carrinho limpo');
  };

const addProduct = async (product: Omit<Product, 'id'>) => {
  try {
    const newProduct = await api.createAdminProduct(product);
    setProducts(prev => [...prev, newProduct]);
    toast.success('Produto adicionado com sucesso');
  } catch {
    toast.error('Erro ao adicionar produto');
  }
};

const updateProduct = async (id: string, productData: Partial<Product>) => {
  try {
    const updated = await api.updateAdminProduct(id, productData);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    toast.success('Produto atualizado com sucesso');
  } catch {
    toast.error('Erro ao atualizar produto');
  }
};

const toggleProduct = async (id: string) => {
  try {
    const updated = await api.toggleAdminProduct(id);
    setProducts(prev => prev.map(p => p.id === id ? updated : p));
    toast.success(`Produto ${updated.available ? 'ativado' : 'desativado'} com sucesso`);
  } catch {
    toast.error('Erro ao alterar status do produto');
  }
};


  // --- Order Functions ---
  const createOrder = async (customer: CustomerData, items: CartItem[], total: number): Promise<string> => {
    try {
      const order = await api.createOrder({ customer, items, total });
      setOrders(prev => [...prev, order]);
      items.forEach(item => updateProduct(item.product.id, { stock: item.product.stock - item.quantity }));
      toast.success('Pedido criado com sucesso');
      return order.id;
    } catch {
      toast.error('Erro ao criar pedido');
      return '';
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const updated = await api.updateOrder(orderId, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      toast.success('Status do pedido atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const updatePaymentStatus = async (orderId: string, status: Order['paymentStatus']) => {
    try {
      const updated = await api.updateOrder(orderId, { paymentStatus: status });
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    } catch {}
  };

  const getOrderById = (orderId: string): Order | undefined => orders.find(o => o.id === orderId);

  const loadAnalytics = async () => {
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch {
      toast.error('Erro ao carregar analytics');
    }
  };

  // --- Load localStorage & products ---
  useEffect(() => {
    const savedAdmin = localStorage.getItem('bruno_admin');
    const savedToken = localStorage.getItem('admin_token');
    const savedCart = localStorage.getItem('bruno_cart');

    if (savedAdmin && savedToken) setAdmin(JSON.parse(savedAdmin));
    if (savedCart) setCart(JSON.parse(savedCart));

    // Função para mapear os dados do backend para camelCase
    function mapProductFromBackend(p: any): Product {
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        promotionPrice: p.promotion_price ? Number(p.promotion_price) : undefined,
        category: p.category,
        image: p.image,
        available: Boolean(p.is_active),
        stock: Number(p.quantity),
        expiryDate: p.expires_at ? p.expires_at.split(' ')[0] : '',
        isPromotion: Boolean(p.is_promo),
        isNew: Boolean(p.is_new),
      };
    }

    const handleSetProducts = (data: any[]) => {
      setProducts(Array.isArray(data) ? data.map(mapProductFromBackend) : []);
    };

    if (isAdminAuthenticated) {
      api.getAdminProducts()
        .then(handleSetProducts)
        .catch(() => toast.error('Erro ao carregar produtos admin'));
    } else {
      api.getPublicProducts()
        .then(handleSetProducts)
        .catch(() => toast.error('Erro ao carregar produtos'));
    }

    setLoading(false);
  }, []);

  if (loading) return null;

  const appValue: AppContextProps = {
    admin,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    products,
    orders,
    analytics,
    addProduct,
    updateProduct,
    toggleProduct,
    createOrder,
    updateOrderStatus,
    updatePaymentStatus,
    loadAnalytics,
    getOrderById
  };

  return (
    <AppContext.Provider value={appValue}>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/admin/login" element={!isAdminAuthenticated ? <AdminLogin /> : <Navigate to="/admin" />} />
          <Route path="/admin" element={isAdminAuthenticated ? <AdminLayout /> : <Navigate to="/admin/login" />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductsManagement />} />
            <Route path="orders" element={<OrdersManagement />} />
            <Route path="clients" element={<ClientsManagement />} />
          </Route>

          <Route path="/" element={<PublicLayout />}>
            <Route index element={<PublicMenu />} />
            <Route path="menu" element={<Navigate to="/" />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="payment/:orderId" element={<PixPayment />} />
            <Route path="order/:orderId" element={<OrderTracking />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <Toaster />
      </div>
    </AppContext.Provider>
  );
}

export default App;
