// Busca todos os endereços públicos
export const fetchAllAddresses = async () => {
  try {
    const res = await apiRequest(`${API_BASE_URL}/addresses`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    return Array.isArray(res) ? res : [];
  } catch (e) {
    return [];
  }
};
// Configuração da API pública para Bruno Cake
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DOMAIN_BASE_URL = import.meta.env.VITE_DOMAIN_BASE_URL;

// Configuração da loja Bruno Cake
// STORE_CONFIG agora é dinâmico: endereço será atualizado conforme o endereço ativo do backend
export const STORE_CONFIG = {
  name: 'Bruno Cake',
  slogan: 'Aqui não é fatia nem pedaço, aqui é tora!',
  address: '', // será preenchido dinamicamente
  phone: '(84) 99127-7973',
  instagram: '@brunocakee',
  workingHours: '', // será preenchido dinamicamente
  isOpen: false, // status aberto/fechado
};

// Função para buscar o endereço ativo do backend e atualizar STORE_CONFIG.address
export const fetchAndSetActiveAddress = async () => {
  try {
    // Busca apenas o endereço ativo
    const active = await apiRequest(`${API_BASE_URL}/addresses/active`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (active && active.rua) {
      const fullAddress = `${active.rua}, ${active.numero} - ${active.bairro}, ${active.cidade} - ${active.estado}`;
      STORE_CONFIG.address = fullAddress;
      let horarios = active.horarios || '';
      STORE_CONFIG.workingHours = horarios;
      STORE_CONFIG.isOpen = horarios ? isOpenNow(horarios) : false;
      return fullAddress;
    }
    STORE_CONFIG.address = '';
    STORE_CONFIG.workingHours = '';
    STORE_CONFIG.isOpen = false;
    return '';
  } catch (e) {
    STORE_CONFIG.address = '';
    STORE_CONFIG.workingHours = '';
    STORE_CONFIG.isOpen = false;
    return '';
  }
};

// Função para verificar se está aberto agora, dado o texto de horários
function isOpenNow(horarios: string): boolean {
  // Suporta formatos:
  // "Sábado: 05:00h às 14:00h" ou "05:00 até 14:00" (sem dia e sem 'h')
  const now = new Date();
  const nowBrasilia = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const dias = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];
  const diaAtual = dias[nowBrasilia.getDay()];

  // 1. Tenta encontrar formato com dia da semana
  let regex = new RegExp(`${diaAtual}[^:]*: ?([0-9]{1,2})[:h]?([0-9]{2})? ?[h]? ?(?:às|ate|até) ?([0-9]{1,2})[:h]?([0-9]{2})?`, 'i');
  let match = horarios.match(regex);
  if (!match) {
    // 2. Tenta formato sem dia da semana: "05:00 até 14:00" ou "05:00h às 14:00h"
    regex = /([0-9]{1,2}):?([0-9]{2})? ?[h]? ?(?:às|ate|até) ?([0-9]{1,2}):?([0-9]{2})?/i;
    match = horarios.match(regex);
  }
  if (match) {
    // match[1]=horaIni, match[2]=minIni, match[3]=horaFim, match[4]=minFim
    const hA = parseInt(match[1], 10);
    const mA = match[2] ? parseInt(match[2], 10) : 0;
    const hF = parseInt(match[3], 10);
    const mF = match[4] ? parseInt(match[4], 10) : 0;
    const abertura = new Date(nowBrasilia);
    abertura.setHours(hA, mA, 0, 0);
    const fechamento = new Date(nowBrasilia);
    fechamento.setHours(hF, mF, 0, 0);
    // Aberto se: nowBrasilia >= abertura && nowBrasilia < fechamento
    return nowBrasilia >= abertura && nowBrasilia < fechamento;
  }
  // Se não encontrar, assume fechado
  return false;
}

// Função utilitária para montar a URL da imagem do produto
export const getProductImageUrl = (image: string | undefined | null) => {
  if (!image) return undefined;
  // Remove barras iniciais
  const cleanPath = image.replace(/^\/+/, '');
  // Se já começa com http, retorna direto
  if (cleanPath.startsWith('http')) return cleanPath;
  // Se já começa com storage, retorna com domínio
  if (cleanPath.startsWith('storage/')) return `${DOMAIN_BASE_URL}/${cleanPath}`;
  // Se começa com products/, retorna storage/products
  if (cleanPath.startsWith('products/')) return `${DOMAIN_BASE_URL}/storage/products/${cleanPath.replace('products/', '')}`;
  // Caso contrário, assume storage/products
  return `${DOMAIN_BASE_URL}/storage/products/${cleanPath}`;
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
    
  // ...
    
    const response = await apiRequest(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
  // ...
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