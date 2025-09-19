export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  client_id: number;
  delivery_address?: string;
  delivery_time?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total: number;
  created_at: string;
  updated_at: string;
  client?: Client;
  items?: OrderItem[];
  payment?: Payment;
  delivery?: Delivery;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Delivery {
  id: number;
  order_id: number;
  user_id?: number;
  status: 'waiting' | 'on_the_way' | 'delivered';
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  order?: Order;
  user?: User;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  method: 'cash' | 'pix' | 'credit_card' | 'debit_card';
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
  updated_at: string;
  order?: Order;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}