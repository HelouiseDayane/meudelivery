import { Product } from '../../../types/Product';

export class ProductController {
  // Mock data - in real app this would come from API
  private static mockProducts: Product[] = [
    {
      id: '1',
      name: 'Brigadeiro Premium',
      description: 'Brigadeiro artesanal com chocolate belga e granulado especial',
      price: 15.00,
      originalPrice: 18.00,
      image: 'https://images.unsplash.com/photo-1729875751095-71c051759eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmF6aWxpYW4lMjBicmlnYWRlaXJvJTIwY2hvY29sYXRlJTIwdHJ1ZmZsZXN8ZW58MXx8fHwxNzU3NjE2MjQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      category: 'trufas',
      inStock: true,
      rating: 4.9,
      reviews: 127,
      isNew: false,
      isPromotion: true
    },
    {
      id: '2',
      name: 'Bolo Red Velvet',
      description: 'Bolo aveludado com cream cheese e cobertura especial',
      price: 89.90,
      image: 'https://images.unsplash.com/photo-1607257882338-70f7dd2ae344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpY2lvdXMlMjBjaG9jb2xhdGUlMjBkZXNzZXJ0JTIwY2FrZXxlbnwxfHx8fDE3NTc2MTYyMzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      category: 'bolos',
      inStock: true,
      rating: 4.8,
      reviews: 89,
      isNew: true,
      isPromotion: false
    },
    {
      id: '3',
      name: 'Cupcakes Coloridos',
      description: 'Kit com 6 cupcakes de sabores variados e decoração especial',
      price: 48.00,
      image: 'https://images.unsplash.com/photo-1615557509870-98972c5e1396?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2VldCUyMGNvbG9yZnVsJTIwY3VwY2FrZXMlMjBkZXNzZXJ0fGVufDF8fHx8MTc1NzYxNjIzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      category: 'cupcakes',
      inStock: true,
      rating: 4.7,
      reviews: 203,
      isNew: false,
      isPromotion: false
    },
    {
      id: '4',
      name: 'Cheesecake de Morango',
      description: 'Cheesecake cremoso com calda de morango e base de biscoito',
      price: 65.00,
      image: 'https://images.unsplash.com/photo-1641424795123-9f12d697219d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2hlZXNlY2FrZSUyMGRlc3NlcnR8ZW58MXx8fHwxNzU3NjE2MjQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      category: 'tortas',
      inStock: false,
      rating: 4.9,
      reviews: 156,
      isNew: true,
      isPromotion: false
    }
  ];

  static async index(filters?: { 
    search?: string; 
    category?: string; 
    page?: number; 
    perPage?: number; 
  }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    let products = [...this.mockProducts];

    // Apply filters
    if (filters?.search) {
      products = products.filter(product => 
        product.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.search!.toLowerCase())
      );
    }

    if (filters?.category && filters.category !== 'all') {
      products = products.filter(product => product.category === filters.category);
    }

    // Simulate pagination
    const page = filters?.page || 1;
    const perPage = filters?.perPage || 10;
    const start = (page - 1) * perPage;
    const end = start + perPage;

    return {
      data: products.slice(start, end),
      meta: {
        current_page: page,
        per_page: perPage,
        total: products.length,
        last_page: Math.ceil(products.length / perPage)
      }
    };
  }

  static async show(id: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const product = this.mockProducts.find(p => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }

    return { data: product };
  }

  static async store(productData: Omit<Product, 'id' | 'rating' | 'reviews'>) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newProduct: Product = {
      ...productData,
      id: (this.mockProducts.length + 1).toString(),
      rating: 0,
      reviews: 0
    };

    this.mockProducts.push(newProduct);

    return { 
      data: newProduct,
      message: 'Produto criado com sucesso!'
    };
  }

  static async update(id: string, productData: Partial<Product>) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const index = this.mockProducts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }

    this.mockProducts[index] = { ...this.mockProducts[index], ...productData };

    return { 
      data: this.mockProducts[index],
      message: 'Produto atualizado com sucesso!'
    };
  }

  static async destroy(id: string) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const index = this.mockProducts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }

    this.mockProducts.splice(index, 1);

    return { 
      message: 'Produto removido com sucesso!'
    };
  }

  static async toggleStock(id: string) {
    const product = this.mockProducts.find(p => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }

    product.inStock = !product.inStock;

    return { 
      data: product,
      message: `Produto ${product.inStock ? 'disponibilizado' : 'indisponibilizado'} com sucesso!`
    };
  }
}