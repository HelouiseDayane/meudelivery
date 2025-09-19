import { Client } from '../../../types/index';

const API_BASE_URL = '/api';

export class ClientController {
  /**
   * Get all clients
   */
  static async index(): Promise<Client[]> {
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch clients');
    }

    return response.json();
  }

  /**
   * Store a new client
   */
  static async store(data: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const response = await fetch(`${API_BASE_URL}/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create client');
    }

    return response.json();
  }

  /**
   * Get a specific client
   */
  static async show(id: number): Promise<Client> {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch client');
    }

    return response.json();
  }

  /**
   * Update a client
   */
  static async update(id: number, data: Partial<Client>): Promise<Client> {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update client');
    }

    return response.json();
  }

  /**
   * Delete a client
   */
  static async destroy(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete client');
    }
  }
}