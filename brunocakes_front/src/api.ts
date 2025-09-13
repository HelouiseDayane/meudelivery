const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://api.brunocakes.com.br'
  : import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Configuração da loja
export const STORE_CONFIG = {
  name: 'Bruno Cakes',
  slogan: 'Aqui não é fatia nem pedaço, aqui é tora!',
  address: 'Rua das Tortas, 123 - Centro, São Paulo - SP',
  phone: '(11) 99999-9999',
  email: 'contato@brunocakes.com.br',
  pixKey: 'contato@brunocakes.com.br',
  workingHours: 'Segunda à Sábado: 8h às 18h | Domingo: 9h às 15h',
  instagram: '@brunocakes_oficial',
  whatsapp: '5511999999999'
};

// Endpoints
export const API_ENDPOINTS = {
  auth: {
    adminLogin: `${API_BASE_URL}/admin/login`,
    logout: `${API_BASE_URL}/admin/logout`,
    me: `${API_BASE_URL}/admin/me`,
  },
  clients: {
    register: `${API_BASE_URL}/register-cliente`,
    list: `${API_BASE_URL}/clients`,
    show: (id: string) => `${API_BASE_URL}/clients/${id}`,
    update: (id: string) => `${API_BASE_URL}/clients/${id}`,
    delete: (id: string) => `${API_BASE_URL}/clients/${id}`,
  },
  products: {
    list: `${API_BASE_URL}/products`,
    show: (id: string) => `${API_BASE_URL}/products/${id}`,
    create: `${API_BASE_URL}/products`,
    update: (id: string) => `${API_BASE_URL}/products/${id}`,
    delete: (id: string) => `${API_BASE_URL}/products/${id}`,
  },
  orders: {
    create: `${API_BASE_URL}/orders`,
    list: `${API_BASE_URL}/orders`,
    show: (id: string) => `${API_BASE_URL}/orders/${id}`,
    update: (id: string) => `${API_BASE_URL}/orders/${id}`,
    delete: (id: string) => `${API_BASE_URL}/orders/${id}`,
    myOrders: `${API_BASE_URL}/orders`
  },
  payments: {
    create: `${API_BASE_URL}/payments`,
    list: `${API_BASE_URL}/payments`,
    show: (id: string) => `${API_BASE_URL}/payments/${id}`,
    myPayments: `${API_BASE_URL}/payments`
  },
  deliveries: {
    list: `${API_BASE_URL}/deliveries`,
    create: `${API_BASE_URL}/deliveries`,
    show: (id: string) => `${API_BASE_URL}/deliveries/${id}`,
    update: (id: string, data: any) => `${API_BASE_URL}/deliveries/${id}`,
    delete: (id: string) => `${API_BASE_URL}/deliveries/${id}`
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = { headers: { ...getAuthHeaders(), ...options.headers }, ...options };
  try {
    const response = await fetch(url, defaultOptions);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const api = {
  adminLogin: (email: string, password: string) => apiRequest(API_ENDPOINTS.auth.adminLogin, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  logout: () => apiRequest(API_ENDPOINTS.auth.logout, { method: 'POST' }),
  getMe: () => apiRequest(API_ENDPOINTS.auth.me),

  getProducts: () => apiRequest(API_ENDPOINTS.products.list),
  getProduct: (id: string) => apiRequest(API_ENDPOINTS.products.show(id)),
  createProduct: (product: any) => apiRequest(API_ENDPOINTS.products.create, { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id: string, product: any) => apiRequest(API_ENDPOINTS.products.update(id), { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (id: string) => apiRequest(API_ENDPOINTS.products.delete(id), { method: 'DELETE' }),

  registerClient: (data: any) => apiRequest(API_ENDPOINTS.clients.register, { method: 'POST', body: JSON.stringify(data) }),
  getClients: () => apiRequest(API_ENDPOINTS.clients.list),
  getClient: (id: string) => apiRequest(API_ENDPOINTS.clients.show(id)),
  updateClient: (id: string, data: any) => apiRequest(API_ENDPOINTS.clients.update(id), { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => apiRequest(API_ENDPOINTS.clients.delete(id), { method: 'DELETE' }),

  createOrder: (data: any) => apiRequest(API_ENDPOINTS.orders.create, { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => apiRequest(API_ENDPOINTS.orders.list),
  getOrder: (id: string) => apiRequest(API_ENDPOINTS.orders.show(id)),
  updateOrder: (id: string, data: any) => apiRequest(API_ENDPOINTS.orders.update(id), { method: 'PUT', body: JSON.stringify(data) }),

  createPayment: (data: any) => apiRequest(API_ENDPOINTS.payments.create, { method: 'POST', body: JSON.stringify(data) }),
  getPayments: () => apiRequest(API_ENDPOINTS.payments.list),
  getPayment: (id: string) => apiRequest(API_ENDPOINTS.payments.show(id)),

  getDeliveries: () => apiRequest(API_ENDPOINTS.deliveries.list),
  createDelivery: (data: any) => apiRequest(API_ENDPOINTS.deliveries.create, { method: 'POST', body: JSON.stringify(data) }),
  updateDelivery: (id: string, data: any) => apiRequest(API_ENDPOINTS.deliveries.update(id, data), { method: 'PUT', body: JSON.stringify(data) })
};

export default api;
