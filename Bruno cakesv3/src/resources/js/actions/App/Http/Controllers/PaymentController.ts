import { Payment } from '../../../types/index';

const API_BASE_URL = '/api';

export class PaymentController {
  /**
   * Get all payments
   */
  static async index(): Promise<Payment[]> {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payments');
    }

    return response.json();
  }

  /**
   * Store a new payment
   */
  static async store(data: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment');
    }

    return response.json();
  }

  /**
   * Get a specific payment
   */
  static async show(id: number): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment');
    }

    return response.json();
  }

  /**
   * Update a payment
   */
  static async update(id: number, data: Partial<Payment>): Promise<Payment> {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update payment');
    }

    return response.json();
  }

  /**
   * Delete a payment
   */
  static async destroy(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/payments/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete payment');
    }
  }
}