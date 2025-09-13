import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, createContext, useContext, useEffect } from 'react';
import { Toaster } from './components/ui/sonner';
import { api } from './api';
import { toast } from 'sonner';

// Auth Components (apenas admin)
import { AdminLogin } from './components/auth/AdminLogin';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProductsManagement } from './components/admin/ProductsManagement';
import { OrdersManagement } from './components/admin/OrdersManagement';
import { ClientsManagement } from './components/admin/ClientsManagement';

// Public Components (sem necessidade de login)
import { PublicMenu } from './components/public/PublicMenu';
import { Cart } from './components/public/Cart';
import { Checkout } from './components/public/Checkout';
import { PixPayment } from './components/client/PixPayment';
import { ClientOrders as OrderTracking } from './components/client/ClientOrders';

// Layout Components
import { AdminLayout } from './components/layouts/AdminLayout';
import { PublicLayout } from './components/layouts/PublicLayout';

// API
import { STORE_CONFIG } from './api';

import { useNavigate } from 'react-router-dom';

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
  category: string;
  available: boolean;
  stock: number;
  expiryDate?: string;
  isPromotion: boolean;
  promotionPrice?: number;
  isNew: boolean;
  ingredients?: string[];
  allergens?: string[];
  weight?: number;
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
const AppContext = createContext<{
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
  deleteProduct: (id: string) => void;
  createOrder: (customer: CustomerData, items: CartItem[], total: number) => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  updatePaymentStatus: (orderId: string, status: Order['paymentStatus']) => void;
  loadAnalytics: () => void;
  getOrderById: (orderId: string) => Order | undefined;
}>({
  admin: null,
  isAdminAuthenticated: false,
  adminLogin: async () => false,
  adminLogout: () => {},
  cart: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateCartQuantity: () => {},
  clearCart: () => {},
  products: [],
  orders: [],
  analytics: null,
  addProduct: () => {},
  updateProduct: () => {},
  deleteProduct: () => {},
  createOrder: async () => '',
  updateOrderStatus: () => {},
  updatePaymentStatus: () => {},
  loadAnalytics: () => {},
  getOrderById: () => undefined,
});

export const useApp = () => useContext(AppContext);

// Mock data para Bruno Cakes
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Torta de Chocolate Belga',
    description: 'Tora completa de chocolate belga com recheio cremoso e cobertura especial',
    price: 89.90,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    category: 'Tortas de Chocolate',
    available: true,
    stock: 8,
    expiryDate: '2024-12-31',
    isPromotion: false,
    isNew: true,
    ingredients: ['Chocolate belga', 'Creme de leite', 'Ovos', 'Farinha especial'],
    allergens: ['Leite', 'Ovos', 'Glúten'],
    weight: 1200,
  },
  {
    id: '2',
    name: 'Tora de Morango com Chantilly',
    description: 'Deliciosa tora de morango fresco com chantilly batido na hora',
    price: 79.90,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400',
    category: 'Tortas de Frutas',
    available: true,
    stock: 6,
    expiryDate: '2024-12-25',
    isPromotion: true,
    promotionPrice: 69.90,
    isNew: false,
    ingredients: ['Morangos frescos', 'Chantilly', 'Massa de biscotto', 'Açúcar'],
    allergens: ['Leite', 'Ovos', 'Glúten'],
    weight: 1000,
  },
  {
    id: '3',
    name: 'Tora Red Velvet',
    description: 'A famosa tora red velvet com cream cheese e toque especial Bruno Cakes',
    price: 94.90,
    image: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=400',
    category: 'Tortas Especiais',
    available: true,
    stock: 5,
    expiryDate: '2024-12-30',
    isPromotion: false,
    isNew: true,
    ingredients: ['Massa red velvet', 'Cream cheese', 'Manteiga', 'Corante natural'],
    allergens: ['Leite', 'Ovos', 'Glúten'],
    weight: 1100,
  },
  {
    id: '4',
    name: 'Tora de Limão Siciliano',
    description: 'Tora refrescante de limão siciliano com merengue queimado',
    price: 74.90,
    image: 'https://images.unsplash.com/photo-1571197119492-2d4acb8f6aa4?w=400',
    category: 'Tortas de Frutas',
    available: true,
    stock: 7,
    expiryDate: '2024-12-28',
    isPromotion: true,
    promotionPrice: 64.90,
    isNew: false,
    ingredients: ['Limão siciliano', 'Merengue', 'Massa podre doce', 'Creme de limão'],
    allergens: ['Leite', 'Ovos', 'Glúten'],
    weight: 950,
  },
  {
    id: '5',
    name: 'Tora Prestígio',
    description: 'Inspirada no doce brasileiro, tora de coco com chocolate',
    price: 84.90,
    image: 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=400',
    category: 'Tortas de Chocolate',
    available: true,
    stock: 4,
    expiryDate: '2024-12-27',
    isPromotion: false,
    isNew: false,
    ingredients: ['Coco ralado', 'Chocolate meio amargo', 'Leite condensado', 'Massa de chocolate'],
    allergens: ['Leite', 'Coco', 'Glúten'],
    weight: 1150,
  },
];

const mockAdmin = {
  id: '1',
  name: 'Bruno Admin',
  email: 'admin@brunocakes.com.br',
  password: 'admin123',
  role: 'staff' as const
};

// Mock analytics data
const mockAnalytics: AnalyticsData = {
  salesByDay: [
    { date: '2024-01-01', amount: 1250.00 },
    { date: '2024-01-02', amount: 1680.50 },
    { date: '2024-01-03', amount: 920.30 },
    { date: '2024-01-04', amount: 2180.90 },
    { date: '2024-01-05', amount: 1920.75 },
  ],
  salesByMonth: [
    { month: 'Jan/24', amount: 35420.50 },
    { month: 'Fev/24', amount: 42650.30 },
    { month: 'Mar/24', amount: 38780.90 },
  ],
  salesByYear: [
    { year: '2022', amount: 325000.00 },
    { year: '2023', amount: 480000.00 },
    { year: '2024', amount: 545000.00 },
  ],
  topProductsWeek: [
    { product: 'Torta de Chocolate Belga', quantity: 15, revenue: 1348.50 },
    { product: 'Tora de Morango com Chantilly', quantity: 12, revenue: 838.80 },
    { product: 'Tora Red Velvet', quantity: 8, revenue: 759.20 },
  ],
  topProductsMonth: [
    { product: 'Torta de Chocolate Belga', quantity: 65, revenue: 5843.50 },
    { product: 'Tora Prestígio', quantity: 48, revenue: 4075.20 },
    { product: 'Tora de Limão Siciliano', quantity: 42, revenue: 2725.80 },
  ],
  neighborhoodsSales: [
    { neighborhood: 'Centro', orders: 125, revenue: 12250.00 },
    { neighborhood: 'Jardins', orders: 98, revenue: 9720.00 },
    { neighborhood: 'Vila Madalena', orders: 87, revenue: 8890.00 },
    { neighborhood: 'Pinheiros', orders: 76, revenue: 7340.00 },
    { neighborhood: 'Moema', orders: 54, revenue: 5890.00 },
  ],
  totalRevenue: 545870.50,
};

function App() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(mockAnalytics);
  const isAdminAuthenticated = !!admin;

  // Load cart from localStorage on app start
  useEffect(() => {
    const savedAdmin = localStorage.getItem('bruno_admin');
    const savedCart = localStorage.getItem('bruno_cart');
    
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin));
    }
    
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bruno_cart', JSON.stringify(cart));
  }, [cart]);

const adminLogin = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await api.adminLogin(email, password);

    if (response?.token) {
      // Salva token no localStorage
      localStorage.setItem('admin_token', response.token);

      // **Remove a chamada para /admin/me**
      // let adminData = { id: '1', name: email, email }; // fallback
      const adminData = { id: '1', name: email, email, role: 'staff' } as const;

      // Atualiza estado
      setAdmin(adminData);

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
    toast.info('Logout realizado com sucesso');
    navigate('/admin/login'); // 🔑 redireciona para login
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    if (product.stock < quantity) {
      toast.error('Estoque insuficiente');
      return;
    }

    setCart(prev => {
      const existingItem = prev.find(item => item.product.id === product.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.stock) {
          toast.error('Quantidade solicitada excede o estoque disponível');
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
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
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      toast.error('Quantidade solicitada excede o estoque disponível');
      return;
    }
    
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    toast.info('Carrinho limpo');
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProduct = { ...product, id: Date.now().toString() };
    setProducts(prev => [...prev, newProduct]);
    toast.success('Produto adicionado com sucesso');
  };

  const updateProduct = (id: string, productData: Partial<Product>) => {
    setProducts(prev =>
      prev.map(product =>
        product.id === id ? { ...product, ...productData } : product
      )
    );
    toast.success('Produto atualizado com sucesso');
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(product => product.id !== id));
    toast.success('Produto removido com sucesso');
  };

  const createOrder = async (customer: CustomerData, items: CartItem[], total: number): Promise<string> => {
    const newOrder: Order = {
      id: Date.now().toString(),
      customer,
      items,
      total,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    // Update stock
    items.forEach(item => {
      updateProduct(item.product.id, {
        stock: item.product.stock - item.quantity
      });
    });
    
    setOrders(prev => [...prev, newOrder]);
    toast.success('Pedido criado com sucesso');
    return newOrder.id;
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );
    toast.success('Status do pedido atualizado');
  };

  const updatePaymentStatus = (orderId: string, paymentStatus: Order['paymentStatus']) => {
    setOrders(prev =>
      prev.map(order =>
        order.id === orderId ? { ...order, paymentStatus } : order
      )
    );
  };

  const getOrderById = (orderId: string): Order | undefined => {
    return orders.find(order => order.id === orderId);
  };

  const loadAnalytics = () => {
    setAnalytics(mockAnalytics);
  };

  const appValue = {
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
    deleteProduct,
    createOrder,
    updateOrderStatus,
    updatePaymentStatus,
    loadAnalytics,
    getOrderById,
  };

  return (
    <AppContext.Provider value={appValue}>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Admin Login Route */}
            <Route path="/admin/login" element={
              !isAdminAuthenticated ? <AdminLogin /> : <Navigate to="/admin" />
            } />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              isAdminAuthenticated ? <AdminLayout /> : <Navigate to="/admin/login" />
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="clients" element={<ClientsManagement />} />
            </Route>
            
            {/* Public Routes (Clientes) */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<PublicMenu />} />
              <Route path="menu" element={<Navigate to="/" />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="payment/:orderId" element={<PixPayment />} />
              <Route path="order/:orderId" element={<OrderTracking />} />
            </Route>

            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AppContext.Provider>
  );
}

export default App;