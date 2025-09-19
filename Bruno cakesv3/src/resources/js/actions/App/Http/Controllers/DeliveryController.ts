import { Delivery } from '../../../types/index';

const API_BASE_URL = '/api';

export class DeliveryController {
  /**
   * Get all deliveries
   */
  static async index(): Promise<Delivery[]> {
    const response = await fetch(`${API_BASE_URL}/deliveries`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch deliveries');
    }

    return response.json();
  }

  /**
   * Store a new delivery
   */
  static async store(data: Omit<Delivery, 'id' | 'created_at' | 'updated_at'>): Promise<Delivery> {
    const response = await fetch(`${API_BASE_URL}/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create delivery');
    }

    return response.json();
  }

  /**
   * Get a specific delivery
   */
  static async show(id: number): Promise<Delivery> {
    const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch delivery');
    }

    return response.json();
  }

  /**
   * Update a delivery
   */
  static async update(id: number, data: Partial<Delivery>): Promise<Delivery> {
    const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update delivery');
    }

    return response.json();
  }

  /**
   * Delete a delivery
   */
  static async destroy(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/deliveries/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete delivery');
    }
  }
}