import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Toaster } from './components/ui/sonner';

// Layout
import AppLayout from './layouts/app-layout';
import AuthLayout from './layouts/auth-layout';

// Auth Pages
import LoginPage from './pages/auth/login';
import RegisterPage from './pages/auth/register';
import ForgotPasswordPage from './pages/auth/forgot-password';

// App Pages
import Dashboard from './pages/dashboard';
import ProductsPage from './pages/products/ProductsPage';
import ProductFormPage from './pages/products/ProductFormPage';
import OrdersPage from './pages/orders/orders-page';
import MyOrdersPage from './pages/orders/my-orders-page';
import DeliveriesPage from './pages/deliveries/deliveries-page';
import ClientsPage from './pages/clients/clients-page';
import ClientFormPage from './pages/clients/client-form-page';
import CheckoutPage from './pages/checkout/checkout-page';

// CSS
import '../css/app.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Auth Routes */}
            <Route path="/" element={<AuthLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
            </Route>
            
            {/* Protected Routes */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              {/* Products Routes */}
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<ProductFormPage />} />
              <Route path="products/:id/edit" element={<ProductFormPage />} />
              
              {/* Orders Routes */}
              <Route path="orders" element={<OrdersPage />} />
              <Route path="my-orders" element={<MyOrdersPage />} />
              
              {/* Deliveries Route */}
              <Route path="deliveries" element={<DeliveriesPage />} />
              
              {/* Clients Routes */}
              <Route path="clients" element={<ClientsPage />} />
              <Route path="clients/new" element={<ClientFormPage />} />
              <Route path="clients/:id/edit" element={<ClientFormPage />} />
              
              {/* Checkout Route */}
              <Route path="checkout" element={<CheckoutPage />} />
            </Route>
          </Routes>
          <Toaster />
        </div>
      </Router>
    </AppProvider>
  );
}

const container = document.getElementById('app');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}