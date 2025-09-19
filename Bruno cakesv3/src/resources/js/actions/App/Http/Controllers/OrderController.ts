import { Order, OrderItem } from '../../types';

export class OrderController {
  // Mock orders data
  private static mockOrders: Order[] = [
    {
      id: 'ORD-001',
      customer: {
        name: 'Maria Silva',
        email: 'maria@email.com',
        phone: '(11) 99999-1234',
        avatar: '',
        address: 'Rua das Flores, 123 - Vila Madalena, São Paulo'
      },
      items: [
        { name: 'Brigadeiro Premium', quantity: 6, price: 15.00 },
        { name: 'Trufa de Maracujá', quantity: 3, price: 18.00 }
      ],
      total: 144.00,
      status: 'pending',
      createdAt: '2024-01-15T10:30:00',
      estimatedDelivery: '2024-01-15T16:00:00',
      paymentMethod: 'PIX',
      notes: 'Entregar na portaria'
    },
    {
      id: 'ORD-002',
      customer: {
        name: 'João Santos',
        email: 'joao@email.com',
        phone: '(11) 98888-5678',
        avatar: '',
        address: 'Av. Paulista, 1500 - Bela Vista, São Paulo'
      },
      items: [
        { name: 'Bolo Red Velvet', quantity: 1, price: 89.90 }
      ],
      total: 89.90,
      status: 'preparing',
      createdAt: '2024-01-15T11:15:00',
      estimatedDelivery: '2024-01-15T17:30:00',
      paymentMethod: 'Cartão de Crédito',
      notes: ''
    }
  ];

  static async index(filters?: { 
    status?: string; 
    search?: string;
    page?: number; 
    perPage?: number; 
  }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let orders = [...this.mockOrders];

    // Apply filters
    if (filters?.status && filters.status !== 'all') {
      orders = orders.filter(order => order.status === filters.status);
    }

    if (filters?.search) {
      orders = orders.filter(order => 
        order.id.toLowerCase().includes(filters.search!.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    // Simulate pagination
    const page = filters?.page || 1;
    const perPage = filters?.perPage || 10;
    const start = (page - 1) * perPage;
    const end = start + perPage;

    return {
      data: orders.slice(start, end),
      meta: {
        current_page: page,
        per_page: perPage,
        total: orders.length,
        last_page: Math.ceil(orders.length / perPage)
      }
    };
  }

  static async show(id: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const order = this.mockOrders.find(o => o.id === id);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    return { data: order };
  }

  static async store(orderData: {
    items: OrderItem[];
    customer: Order['customer'];
    deliveryAddress: string;
    paymentMethod: string;
    notes?: string;
    scheduledDelivery?: string;
  }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newOrder: Order = {
      id: `ORD-${(this.mockOrders.length + 1).toString().padStart(3, '0')}`,
      customer: orderData.customer,
      items: orderData.items,
      total: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDelivery: orderData.scheduledDelivery || 
        new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
      paymentMethod: orderData.paymentMethod,
      notes: orderData.notes || ''
    };

    this.mockOrders.push(newOrder);

    return { 
      data: newOrder,
      message: 'Pedido criado com sucesso!'
    };
  }

  static async updateStatus(id: string, status: Order['status']) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const order = this.mockOrders.find(o => o.id === id);
    if (!order) {
      throw new Error('Pedido não encontrado');
    }

    order.status = status;
    
    if (status === 'delivered') {
      order.deliveredAt = new Date().toISOString();
    }

    return { 
      data: order,
      message: 'Status do pedido atualizado com sucesso!'
    };
  }

  static async getClientOrders(clientId: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock client orders - in real app this would filter by client ID
    const clientOrders = this.mockOrders.filter(order => 
      order.customer.email === 'cliente@email.com'
    );

    return {
      data: clientOrders
    };
  }
}