// Route configuration for the Sweet Delivery app

export const routes = {
  // Public routes
  public: {
    login: '/login',
    register: '/register',
    forgotPassword: '/forgot-password',
  },
  
  // Protected routes
  protected: {
    dashboard: '/dashboard',
    
    // Products
    products: {
      index: '/products',
      create: '/products/new',
      edit: (id: string) => `/products/${id}/edit`,
      show: (id: string) => `/products/${id}`,
    },
    
    // Orders
    orders: {
      index: '/orders',
      show: (id: string) => `/orders/${id}`,
      myOrders: '/my-orders',
    },
    
    // Deliveries
    deliveries: {
      index: '/deliveries',
      show: (id: string) => `/deliveries/${id}`,
    },
    
    // Clients
    clients: {
      index: '/clients',
      create: '/clients/new',
      edit: (id: string) => `/clients/${id}/edit`,
      show: (id: string) => `/clients/${id}`,
    },
    
    // Checkout
    checkout: '/checkout',
  }
};

// Navigation helpers
export const navigate = {
  to: {
    login: () => routes.public.login,
    register: () => routes.public.register,
    dashboard: () => routes.protected.dashboard,
    products: () => routes.protected.products.index,
    createProduct: () => routes.protected.products.create,
    editProduct: (id: string) => routes.protected.products.edit(id),
    orders: () => routes.protected.orders.index,
    myOrders: () => routes.protected.orders.myOrders,
    deliveries: () => routes.protected.deliveries.index,
    clients: () => routes.protected.clients.index,
    createClient: () => routes.protected.clients.create,
    editClient: (id: string) => routes.protected.clients.edit(id),
    checkout: () => routes.protected.checkout,
  }
};

// Route guards
export const routeGuards = {
  adminOnly: [
    routes.protected.orders.index,
    routes.protected.deliveries.index,
    routes.protected.clients.index,
    routes.protected.clients.create,
  ],
  clientOnly: [
    routes.protected.orders.myOrders,
    routes.protected.checkout,
  ],
  authenticated: [
    routes.protected.dashboard,
    routes.protected.products.index,
  ]
};