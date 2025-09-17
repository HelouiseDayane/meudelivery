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
// Função utilitária para montar a URL da imagem do produto
export const getProductImageUrl = (image: string | undefined | null) => {
  if (!image) return undefined;
  // Remove barras iniciais
  const cleanPath = image.replace(/^\/+/, '');
  // Se já começa com http, retorna direto
  if (cleanPath.startsWith('http')) return cleanPath;
  // Se já começa com storage, retorna com domínio
  if (cleanPath.startsWith('storage/')) return `http://localhost:8000/${cleanPath}`;
  // Se começa com products/, retorna storage/products
  if (cleanPath.startsWith('products/')) return `http://localhost:8000/storage/products/${cleanPath.replace('products/', '')}`;
  // Caso contrário, assume storage/products
  return `http://localhost:8000/storage/products/${cleanPath}`;
};
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
    listPublic: `${API_BASE_URL}/products`,
    showPublic: (id: string) => `${API_BASE_URL}/products/${id}`,
    listAdmin: `${API_BASE_URL}/admin/products`,
    createAdmin: `${API_BASE_URL}/admin/products`,
    updateAdmin: (id: string) => `${API_BASE_URL}/admin/products/${id}`,
    toggleAdmin: (id: string) => `${API_BASE_URL}/admin/products/${id}/toggle`,
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
    update: (id: string) => `${API_BASE_URL}/deliveries/${id}`,
    delete: (id: string) => `${API_BASE_URL}/deliveries/${id}`
  }
};

// Headers com token
const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return {
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Função genérica de requisição
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const defaultOptions: RequestInit = { 
      headers: { ...getAuthHeaders(), ...options.headers }, 
      ...options 
    };

    const response = await fetch(url, defaultOptions);

    if (response.status === 204) return null; // sem conteúdo
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

// API pública/admin
export const api = {
  adminLogin: (email: string, password: string) => 
    apiRequest(API_ENDPOINTS.auth.adminLogin, { method: 'POST', body: JSON.stringify({ email, password }) }),
  
  logout: () => apiRequest(API_ENDPOINTS.auth.logout, { method: 'POST' }),
  getMe: () => apiRequest(API_ENDPOINTS.auth.me),

  getPublicProducts: () => apiRequest(API_ENDPOINTS.products.listPublic),
  getPublicProduct: (id: string) => apiRequest(API_ENDPOINTS.products.showPublic(id)),

  getAdminProducts: () => apiRequest(API_ENDPOINTS.products.listAdmin),
  createAdminProduct: (data: any) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'file' && value instanceof File) {
        formData.append('image', value);
      } else if (value !== undefined && value !== null) {
        // Se for boolean ou number, converte para string
        if (typeof value === 'boolean' || typeof value === 'number') {
          formData.append(key, String(value));
        } else {
          formData.append(key, value as string);
        }
      }
    });
    return apiRequest(API_ENDPOINTS.products.createAdmin, {
      method: 'POST',
      body: formData,
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
      },
    });
  },
  updateAdminProduct: (id: string, data: any) => {
    const formData = new FormData();
    formData.append('_method', 'PATCH');
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'file' && value instanceof File) {
        formData.append('image', value);
      } else if (value !== undefined && value !== null) {
        if (typeof value === 'boolean' || typeof value === 'number') {
          formData.append(key, String(value));
        } else {
          formData.append(key, value as string);
        }
      }
    });
    return apiRequest(API_ENDPOINTS.products.updateAdmin(id), {
      method: 'POST',
      body: formData,
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
      },
    });
  },
  toggleAdminProduct: (id: string) => apiRequest(API_ENDPOINTS.products.toggleAdmin(id), { method: 'PATCH' }),

  registerClient: (data: any) => apiRequest(API_ENDPOINTS.clients.register, { method: 'POST', body: JSON.stringify(data) }),
  getClients: () => apiRequest(API_ENDPOINTS.clients.list),
  getClient: (id: string) => apiRequest(API_ENDPOINTS.clients.show(id)),
  updateClient: (id: string, data: any) => apiRequest(API_ENDPOINTS.clients.update(id), { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => apiRequest(API_ENDPOINTS.clients.delete(id)),

  createOrder: (data: any) => apiRequest(API_ENDPOINTS.orders.create, { method: 'POST', body: JSON.stringify(data) }),
  getOrders: () => apiRequest(API_ENDPOINTS.orders.list),
  getOrder: (id: string) => apiRequest(API_ENDPOINTS.orders.show(id)),
  updateOrder: (id: string, data: any) => apiRequest(API_ENDPOINTS.orders.update(id), { method: 'PUT', body: JSON.stringify(data) }),

  createPayment: (data: any) => apiRequest(API_ENDPOINTS.payments.create, { method: 'POST', body: JSON.stringify(data) }),
  getPayments: () => apiRequest(API_ENDPOINTS.payments.list),
  getPayment: (id: string) => apiRequest(API_ENDPOINTS.payments.show(id)),

  getDeliveries: () => apiRequest(API_ENDPOINTS.deliveries.list),
  createDelivery: (data: any) => apiRequest(API_ENDPOINTS.deliveries.create, { method: 'POST', body: JSON.stringify(data) }),
  updateDelivery: (id: string, data: any) => apiRequest(API_ENDPOINTS.deliveries.update(id), { method: 'PUT', body: JSON.stringify(data) }),
};

export default api;
