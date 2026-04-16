import { adminApiRequest } from '../common/request';

export const whatsappApi = {
  connect: (branchId: number | string) =>
    adminApiRequest('/admin/whatsapp/connect', {
      method: 'POST',
      body: JSON.stringify({ branch_id: branchId }),
    }),

  status: (branchId: number | string) =>
    adminApiRequest(`/admin/whatsapp/${branchId}/status`),

  getQrCode: (branchId: number | string) =>
    adminApiRequest(`/admin/whatsapp/${branchId}/qrcode`),

  disconnect: (branchId: number | string) =>
    adminApiRequest(`/admin/whatsapp/${branchId}/disconnect`, { method: 'POST' }),

  refreshQrCode: (branchId: number | string) =>
    adminApiRequest(`/admin/whatsapp/${branchId}/refresh-qrcode`, { method: 'POST' }),
};
