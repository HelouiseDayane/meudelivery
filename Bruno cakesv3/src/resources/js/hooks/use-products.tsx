import { useState, useEffect } from 'react';
import { ProductController } from '../actions/App/Http/Controllers/ProductController';
import { Product } from '../types/Product';

export const useProducts = (filters?: { search?: string; category?: string }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ProductController.index(filters);
      setProducts(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters?.search, filters?.category]);

  const createProduct = async (productData: Omit<Product, 'id' | 'rating' | 'reviews'>) => {
    try {
      const response = await ProductController.store(productData);
      await fetchProducts(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const response = await ProductController.update(id, productData);
      await fetchProducts(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await ProductController.destroy(id);
      await fetchProducts(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  const toggleStock = async (id: string) => {
    try {
      const response = await ProductController.toggleStock(id);
      await fetchProducts(); // Refresh list
      return response;
    } catch (err) {
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStock
  };
};

export const useProduct = (id: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await ProductController.show(id);
        setProduct(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return {
    product,
    loading,
    error
  };
};