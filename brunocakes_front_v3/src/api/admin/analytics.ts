import { adminApiRequest } from '../common/request';
import { ADMIN_API_ENDPOINTS } from '../common/endpoints';

export const analyticsApi = {
  getAnalytics: () => adminApiRequest(ADMIN_API_ENDPOINTS.analytics.dashboard),
  
  getGeneralAnalytics: () => adminApiRequest(ADMIN_API_ENDPOINTS.analytics.general),

  getCustomerAnalytics: () => adminApiRequest(ADMIN_API_ENDPOINTS.analytics.customers),
};

// Função para buscar analytics de clientes (compatibilidade)
export const getCustomerAnalytics = () => adminApiRequest(ADMIN_API_ENDPOINTS.analytics.customers);