import { authApi } from './auth';
import { productsApi } from './products';
import { ordersApi } from './orders';
import { clientsApi } from './clients';
import { analyticsApi } from './analytics';
import { adminUtilsApi } from './utils';

// API administrativa consolidada
export const adminApi = {
  // === AUTENTICAÇÃO ===
  ...authApi,

  // === PRODUTOS ===
  ...productsApi,

  // === PEDIDOS ===
  ...ordersApi,

  // === CLIENTES ===
  ...clientsApi,

  // === ANALYTICS ===
  ...analyticsApi,

  // === PERFIL ADMIN E UTILITÁRIOS ===
  ...adminUtilsApi,
};

export default adminApi;