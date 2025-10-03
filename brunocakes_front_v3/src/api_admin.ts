// API Administrativa para Bruno Cake
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;
const DOMAIN_BASE_URL = import.meta.env.VITE_DOMAIN_BASE_URL;
// Headers com token de admin
const getAdminAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  const headers = {
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return headers;
};

// Headers específicos para FormData (sem Content-Type)
const getAdminAuthHeadersForFormData = () => {
  const token = localStorage.getItem('admin_token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    // Não incluir Accept nem Content-Type para FormData
  };
};

// Função genérica de requisição admin
export const adminApiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const defaultOptions: RequestInit = { 
      headers: { ...getAdminAuthHeaders(), ...options.headers }, 
      mode: 'cors', // Adicionar modo CORS
      ...options 
    };

  // ...
    
    const response = await fetch(url, defaultOptions);

  // ...

    // 204 é um sucesso para operações que não retornam conteúdo
    if (response.status === 204) {
  // ...
      return { success: true };
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`❌ Erro na API: ${response.status} - ${JSON.stringify(errorData)}`);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
  // ...
    return responseData;
  } catch (error) {
  // ...
    throw error;
  }
};

// Endpoints administrativos
export const ADMIN_API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/admin/login`,
    logout: `${API_BASE_URL}/admin/logout`,
    me: `${API_BASE_URL}/admin/me`,
  },
  products: {
    list: `${API_BASE_URL}/admin/products`,
    create: `${API_BASE_URL}/admin/products`,
    show: (id: string) => `${API_BASE_URL}/admin/products/${id}`,
    update: (id: string) => `${API_BASE_URL}/admin/products/${id}`,
    toggle: (id: string) => `${API_BASE_URL}/admin/products/${id}/toggle`,
    stock: (id: string) => `${API_BASE_URL}/admin/products/${id}/stock`,
    updateStock: (id: string) => `${API_BASE_URL}/admin/products/${id}/stock`,
    reserveStock: (id: string) => `${API_BASE_URL}/admin/products/${id}/reserve-stock`,
    syncStock: `${API_BASE_URL}/admin/products/sync-stock`,
    lowStock: `${API_BASE_URL}/admin/products/low-stock`,
    stockReport: `${API_BASE_URL}/admin/products/stock-report`,
  },
  orders: {
    list: `${API_BASE_URL}/admin/orders`,
    show: (id: string) => `${API_BASE_URL}/admin/orders/${id}`,
    update: (id: string) => `${API_BASE_URL}/admin/orders/${id}`,
    updateStatus: (id: string) => `${API_BASE_URL}/admin/orders/${id}/status`,
    confirmMany: `${API_BASE_URL}/admin/orders/confirm-many`,
    approvePayment: `${API_BASE_URL}/admin/orders/approve-payment`,
    cancelPayment: `${API_BASE_URL}/admin/orders/cancel-payment`,
    markCompleted: `${API_BASE_URL}/admin/orders/mark-completed`,
    finish: `${API_BASE_URL}/admin/orders/finish`,
  },
  clients: {
    list: `${API_BASE_URL}/admin/clients`,
    unique: `${API_BASE_URL}/admin/customers/unique`,
    show: (id: string) => `${API_BASE_URL}/admin/clients/${id}`,
    update: (id: string) => `${API_BASE_URL}/admin/clients/${id}`,
    delete: (id: string) => `${API_BASE_URL}/admin/clients/${id}`,
  },
  analytics: {
    dashboard: `${API_BASE_URL}/admin/dashboard`,
    general: `${API_BASE_URL}/analytics`,
  },
  admin: {
    profile: `${API_BASE_URL}/admin/profile`,
    testQueue: `${API_BASE_URL}/admin/test-queue`,
  }
};

// API administrativa
export const adminApi = {
  // === AUTENTICAÇÃO ===
  login: async (email: string, password: string) => {
    const response = await adminApiRequest(ADMIN_API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Persistir token e dados do admin
    if (response && response.token) {
      localStorage.setItem('admin_token', response.token);
      
      // Salvar dados do admin se retornados
      if (response.user) {
        const adminData = {
          id: String(response.user.id || '1'),
          name: response.user.name || 'Admin',
          email: response.user.email || email,
          role: 'staff' as const,
          created_at: response.user.created_at || new Date().toISOString(),
          updated_at: response.user.updated_at || new Date().toISOString(),
        };
        localStorage.setItem('bruno_admin', JSON.stringify(adminData));
      } else {
        // Fallback se backend não retornar user
        const fallbackAdminData = {
          id: '1',
          name: 'Admin',
          email: email,
          role: 'staff' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem('bruno_admin', JSON.stringify(fallbackAdminData));
      }
    } else {
      console.error('❌ Login falhou - token não encontrado na resposta');
    }
    
    return response;
  },

  logout: async () => {
    try {
      await adminApiRequest(ADMIN_API_ENDPOINTS.auth.logout, { method: 'POST' });
    } catch (error) {
      console.warn('Erro ao fazer logout no servidor:', error);
    } finally {
      // Sempre limpar dados locais
      localStorage.removeItem('admin_token');
      localStorage.removeItem('bruno_admin');
    }
  },

  getMe: () => adminApiRequest(ADMIN_API_ENDPOINTS.auth.me),

  // === PRODUTOS ===
  getProducts: () => adminApiRequest(ADMIN_API_ENDPOINTS.products.list),

  getProduct: (id: string) => adminApiRequest(ADMIN_API_ENDPOINTS.products.show(id)),

  createProduct: (data: any) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'file' && value instanceof File) {
        formData.append('image', value);
      } else if (key === 'stock') {
        // Mapear 'stock' do frontend para 'quantity' do backend
        formData.append('quantity', String(value));
      } else if (key === 'available') {
        // Mapear 'available' do frontend para 'is_active' do backend
        formData.append('is_active', String(value));
      } else if (value !== undefined && value !== null) {
        if (typeof value === 'boolean' || typeof value === 'number') {
          formData.append(key, String(value));
        } else {
          formData.append(key, value as string);
        }
      }
    });
    return adminApiRequest(ADMIN_API_ENDPOINTS.products.create, {
      method: 'POST',
      body: formData,
      headers: getAdminAuthHeadersForFormData(), // Headers específicos para FormData
    });
  },

  updateProduct: (id: string, data: any) => {
    const formData = new FormData();
    
    // Log dos dados recebidos
  // ...
    
    // Adicionar _method=PUT para compatibilidade com alguns backends PHP/Laravel
    formData.append('_method', 'PUT');
    
    Object.entries(data).forEach(([key, value]) => {
      if (key === 'file' && value instanceof File) {
        formData.append('image', value);
  // ...
      } else if (key === 'stock') {
        // Mapear 'stock' do frontend para 'quantity' do backend
        formData.append('quantity', String(value));
  // ...
      } else if (key === 'available') {
        // Mapear 'available' do frontend para 'is_active' do backend
        formData.append('is_active', String(value));
  // ...
      } else if (value !== undefined && value !== null && value !== '') {
        const stringValue = typeof value === 'boolean' || typeof value === 'number' 
          ? String(value) 
          : value as string;
        formData.append(key, stringValue);
  // ...
      }
    });
    
    // Log de debug para ver todos os campos
  // ...
    for (let [key, value] of formData.entries()) {
  // ...
    }
    
    // Usar POST com _method=PUT para melhor compatibilidade
    return adminApiRequest(ADMIN_API_ENDPOINTS.products.update(id), {
      method: 'POST',
      body: formData,
      headers: getAdminAuthHeadersForFormData(),
    });
  },

  toggleProduct: (id: string) => adminApiRequest(ADMIN_API_ENDPOINTS.products.toggle(id), { method: 'PATCH' }),

  updateProductStock: (id: string, quantity: number) => {
    return adminApiRequest(ADMIN_API_ENDPOINTS.products.updateStock(id), {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  // === ESTOQUE ===
  checkStock: (productId: string) => adminApiRequest(ADMIN_API_ENDPOINTS.products.stock(productId)),

  reserveStock: (productId: string, quantity: number) => {
    return adminApiRequest(ADMIN_API_ENDPOINTS.products.reserveStock(productId), {
      method: 'POST',
      body: JSON.stringify({ quantity }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  syncStock: () => {
    return adminApiRequest(ADMIN_API_ENDPOINTS.products.syncStock, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  getLowStockProducts: () => adminApiRequest(ADMIN_API_ENDPOINTS.products.lowStock),

  getStockReport: () => adminApiRequest(ADMIN_API_ENDPOINTS.products.stockReport),

  // === PEDIDOS ===
  getOrders: () => adminApiRequest(ADMIN_API_ENDPOINTS.orders.list),

  getOrder: (id: string) => adminApiRequest(ADMIN_API_ENDPOINTS.orders.show(id)),

  updateOrder: (id: string, data: any) => {
  // ...
    
    return adminApiRequest(ADMIN_API_ENDPOINTS.orders.update(id), { 
      method: 'PUT', 
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });
  },

  updateOrderStatus: (id: string, status: string) => {
    
    
    return adminApiRequest(ADMIN_API_ENDPOINTS.orders.updateStatus(id), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  confirmManyOrders: (orderIds: string[] | number[]) => {
    if (orderIds.length === 0) {
      throw new Error('Nenhum ID de pedido fornecido para confirmação.');
    }
    
    
    return adminApiRequest(ADMIN_API_ENDPOINTS.orders.confirmMany, {
      method: 'PATCH',
      body: JSON.stringify({ order_ids: orderIds }),
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(),
      },
    });
  },

  approvePayments: (orderIds: string[] | number[]) => {
    if (orderIds.length === 0) {
      throw new Error('A lista de IDs de pedidos está vazia.');
    }
    return adminApiRequest(ADMIN_API_ENDPOINTS.orders.approvePayment, {
      method: 'PATCH',
      body: JSON.stringify({ order_ids: orderIds }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  cancelPayments: (orderIds: string[] | number[]) => {
    
    return adminApiRequest(ADMIN_API_ENDPOINTS.orders.cancelPayment, {
      method: 'PATCH',
      body: JSON.stringify({ order_ids: orderIds }),
      headers: {
        'Content-Type': 'application/json',
        ...getAdminAuthHeaders(), // garante que o Authorization vá
      },
    });
  },

  markAsCompleted: (orderIds: string[] | number[]) => {
    if (orderIds.length === 0) {
      throw new Error('A lista de IDs de pedidos está vazia.');
    }
    
 
    
    return adminApiRequest(ADMIN_API_ENDPOINTS.orders.finish, {
      method: 'PATCH',
      body: JSON.stringify({ order_ids: orderIds }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // === CLIENTES ===
  getClients: () => adminApiRequest(ADMIN_API_ENDPOINTS.clients.list),

  getUniqueClients: () => adminApiRequest(ADMIN_API_ENDPOINTS.clients.unique),

  getClient: (id: string) => adminApiRequest(ADMIN_API_ENDPOINTS.clients.show(id)),

  updateClient: (id: string, data: any) => {
    return adminApiRequest(ADMIN_API_ENDPOINTS.clients.update(id), { 
      method: 'PUT', 
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      }
    });
  },

  deleteClient: (id: string) => adminApiRequest(ADMIN_API_ENDPOINTS.clients.delete(id), { method: 'DELETE' }),

  // === ANALYTICS ===
  getAnalytics: () => adminApiRequest(ADMIN_API_ENDPOINTS.analytics.dashboard),
  
  getGeneralAnalytics: () => adminApiRequest(ADMIN_API_ENDPOINTS.analytics.general),

  // === PERFIL ADMIN ===
  getProfile: () => adminApiRequest(ADMIN_API_ENDPOINTS.admin.profile),

  // === TESTES E UTILITÁRIOS ===
  testQueue: () => {
    return adminApiRequest(ADMIN_API_ENDPOINTS.admin.testQueue, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
    });
  },
};

export { API_BASE_URL, getAdminAuthHeaders, getAdminAuthHeadersForFormData };
export default adminApi;