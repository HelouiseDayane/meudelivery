// Configuração da API pública para Bruno Cakes
const API_BASE_URL = 'http://localhost:8000/api';

// Configuração da loja Bruno Cakes
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
  products: {
    listPublic: `${API_BASE_URL}/products`,
    showPublic: (id: string) => `${API_BASE_URL}/products/${id}`,
    withStock: `${API_BASE_URL}/products/with-stock`,
    stock: (id: string) => `${API_BASE_URL}/products/${id}/stock`,
    allStock: `${API_BASE_URL}/products/stock/all`,
  },
  orders: {
    create: `${API_BASE_URL}/orders`,
    show: (id: string) => `${API_BASE_URL}/orders/${id}`,
    byContact: `${API_BASE_URL}/checkout/pedidos`,
  },
  customer: {
    lastOrder: `${API_BASE_URL}/customer/last-order`,
  },
  checkout: {
    create: `${API_BASE_URL}/checkout`,
  },
  cart: {
    add: `${API_BASE_URL}/cart/add`,
    remove: `${API_BASE_URL}/cart/remove`,
    update: `${API_BASE_URL}/cart/update`,
    get: (sessionId: string) => `${API_BASE_URL}/cart/session/${sessionId}`,
    clear: (sessionId: string) => `${API_BASE_URL}/cart/session/${sessionId}`,
  },
  payments: {
    notify: `${API_BASE_URL}/payment/notify`,
  }
};

// Headers básicos sem autenticação
const getPublicHeaders = () => ({
  'Accept': 'application/json',
});

// Função genérica de requisição pública
export const apiRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const defaultOptions: RequestInit = { 
      headers: { ...getPublicHeaders(), ...options.headers }, 
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
    throw error;
  }
};

// API pública
export const api = {
  // === PRODUTOS PÚBLICOS ===
  getPublicProducts: () => apiRequest(API_ENDPOINTS.products.listPublic),
  
  getPublicProduct: (id: string) => apiRequest(API_ENDPOINTS.products.showPublic(id)),

  getProductsWithStock: () => apiRequest(API_ENDPOINTS.products.withStock),

  getProductStock: (productId: string) => apiRequest(API_ENDPOINTS.products.stock(productId)),

  getAllProductsStock: () => apiRequest(API_ENDPOINTS.products.allStock),

  // === CHECKOUT E PEDIDOS PÚBLICOS ===
  createOrder: (data: any) => {
    // Monta payload conforme backend espera
    const payload = {
      customer_name: data.customer_name || data.customer?.name || data.clientName || '',
      customer_email: data.customer_email || data.customer?.email || data.clientEmail || '',
      customer_phone: data.customer_phone || data.customer?.phone || data.clientPhone || '',
      address_street: data.address_street || data.customer?.address || data.clientAddress || '',
      address_neighborhood: data.address_neighborhood || data.customer?.neighborhood || data.clientNeighborhood || '',
      observations: data.observations || data.additionalInfo || '',
      items: Array.isArray(data.items)
        ? data.items.map((item: any) => ({
            product_id: item.product_id || item.product?.id,
            quantity: item.quantity
          }))
        : [],
      session_id: data.session_id || '',
    };
    return apiRequest(API_ENDPOINTS.checkout.create, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  getOrder: (id: string) => apiRequest(API_ENDPOINTS.orders.show(id)),

  getOrdersByContact: async (email?: string, phone?: string) => {
    const params = new URLSearchParams();
    if (email) params.append('email', email);
    if (phone) params.append('phone', phone);
    const url = `${API_ENDPOINTS.orders.byContact}?${params.toString()}`;
    
    console.log('🔍 Buscando pedidos:', { email, phone, url });
    
    const response = await apiRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('📋 Resposta da busca de pedidos:', response);
    return response;
  },

  getCustomerLastOrder: async (contact: string) => {
    const params = new URLSearchParams();
    // Backend só aceita telefone por enquanto
    params.append('phone', contact);
    const url = `${API_ENDPOINTS.customer.lastOrder}?${params.toString()}`;
    return apiRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
  },

  // === CARRINHO ===
  generateSessionId: () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  addToCart: (sessionId: string, productId: string, quantity: number) => {
    return apiRequest(API_ENDPOINTS.cart.add, {
      method: 'POST',
      body: JSON.stringify({ 
        session_id: sessionId,
        product_id: productId,
        quantity 
      }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  removeFromCart: (sessionId: string, productId: string, quantity?: number) => {
    const body: any = { 
      session_id: sessionId,
      product_id: productId
    };
    if (quantity) body.quantity = quantity;

    return apiRequest(API_ENDPOINTS.cart.remove, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  updateCartQuantity: (sessionId: string, productId: string, quantity: number) => {
    return apiRequest(API_ENDPOINTS.cart.update, {
      method: 'POST',
      body: JSON.stringify({ 
        session_id: sessionId,
        product_id: productId,
        quantity 
      }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  getCart: (sessionId: string) => {
    return apiRequest(API_ENDPOINTS.cart.get(sessionId), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  clearCart: (sessionId: string) => {
    return apiRequest(API_ENDPOINTS.cart.clear(sessionId), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  // === PAGAMENTOS ===
  notifyPaymentWebhook: (providerPaymentId: string, status: string) => {
    return apiRequest(API_ENDPOINTS.payments.notify, {
      method: 'POST',
      body: JSON.stringify({
        provider_payment_id: providerPaymentId,
        status,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },

  // === FUNÇÕES LEGACY (DEPRECATED) ===
  decrementStock: (productId: string, quantity: number) => {
    return apiRequest(`${API_BASE_URL}/products/${productId}/decrement-stock`, {
      method: 'POST',
      body: JSON.stringify({ quantity }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  },
};

export { API_BASE_URL, getPublicHeaders };
export default api;