import { API_BASE_URL } from './config';

// Endpoints públicos
export const PUBLIC_API_ENDPOINTS = {
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
  },
  addresses: {
  },
  store: {
    publicSettings: `${API_BASE_URL}/store/settings`,
  },
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
    markDelivered: (id: string) => `${API_BASE_URL}/admin/orders/${id}/mark-delivered`,
    cancelPayment: `${API_BASE_URL}/admin/orders/cancel-payment`,
    finish: `${API_BASE_URL}/admin/orders/finish`,
    approvePayment: `${API_BASE_URL}/admin/orders/finish`,
    confirmMany: `${API_BASE_URL}/admin/orders/confirm-many`,
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
    customers: `${API_BASE_URL}/admin/customers/analytics`,
  },
  store: {
    settings: `${API_BASE_URL}/admin/settings`,
    publicSettings: `${API_BASE_URL}/store/settings`,
  },
  admin: {
    profile: `${API_BASE_URL}/admin/profile`,
    testQueue: `${API_BASE_URL}/admin/test-queue`,
  }
};