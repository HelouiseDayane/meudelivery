import React, { useEffect, useState } from 'react';
import { fetchAndSetActiveAddress, getProductImageUrl, api } from '../../api';
import { useRealTime } from '../../hooks/useRealTime';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Plus, Minus, Search, Clock, Percent, Sparkles, ShoppingCart } from 'lucide-react';
import { useApp } from '../../App';
import { usePWA } from '../../hooks/usePWA';
import { toast } from 'sonner';

const PublicMenu = () => {
  const { publicProducts, setPublicProducts, addToCart } = useApp();
  const { lastEvent } = useRealTime();
  const { isMobile } = usePWA();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [footerData, setFooterData] = useState({
    workingHours: '',
    isOpen: true, // assume aberto por padrão até carregar
  });

  // Padroniza os campos de badge e converte price/promotionPrice para número
  const formatProducts = (Array.isArray(publicProducts) ? publicProducts : []).map((product: any) => {
    let imageUrl;
    if (product.image && typeof product.image === 'string' && product.image.startsWith('http')) {
      imageUrl = product.image;
    } else if (product.image_url && typeof product.image_url === 'string' && product.image_url.startsWith('http')) {
      imageUrl = product.image_url;
    } else if (product.image_url) {
      imageUrl = getProductImageUrl(product.image_url);
    } else if (product.image) {
      imageUrl = getProductImageUrl(product.image);
    } else {
      imageUrl = undefined;
    }
    return {
      ...product,
      id: String(product.id), // Garante que o ID seja string
      price: Number(product.price),
      promotionPrice: product.promotion_price !== undefined && product.promotion_price !== null ? Number(product.promotion_price) : (product.promotionPrice !== undefined && product.promotionPrice !== null ? Number(product.promotionPrice) : undefined),
      imageUrl,
      isNew: Boolean(product.isNew ?? product.is_new),
      isPromotion: Boolean(product.isPromotion ?? product.isPromo ?? product.is_promo),
    };
  });

  // Função para obter o estoque disponível corretamente do produto
  const getProductAvailableStock = (productId: string | number) => {
    const idToSearch = String(productId);
    console.log('[DEBUG] Buscando produto com id:', idToSearch);
    const product = formatProducts.find((p: any) => p.id === idToSearch);
    if (!product) {
      console.warn(`[DEBUG] Produto não encontrado para id: ${idToSearch}`);
      return 0;
    }
    
    // Primeiro tenta pegar available_stock da API
    const availableStock = product.available_stock;
    
    // Se disponível, valida e retorna
    if (availableStock !== undefined && availableStock !== null) {
      const stock = Number(availableStock);
      if (!isNaN(stock)) {
        console.log(`[DEBUG] Usando estoque (${typeof availableStock}):`, stock);
        return stock;
      }
    }
    
    // Caso não tenha available_stock, tenta usar total_stock - reserved_stock
    if (product.total_stock !== undefined && product.reserved_stock !== undefined) {
      const total = Number(product.total_stock);
      const reserved = Number(product.reserved_stock);
      if (!isNaN(total) && !isNaN(reserved)) {
        const available = Math.max(0, total - reserved);
        console.log('[DEBUG] Calculando estoque:', { total, reserved, available });
        return available;
      }
    }

    console.log('[DEBUG] Nenhum campo de estoque válido encontrado para o produto:', product);
    return 0;
  };

  // Efeito para buscar produtos (inicial e em atualização de estoque)
  useEffect(() => {
    const fetchProducts = () => {
      import('../../api').then(({ api }) => {
        console.log('[DEBUG] Buscando produtos da API...');
        api.getPublicProducts().then((products) => {
          console.log('[DEBUG] Produtos recebidos da API:', JSON.stringify(products, null, 2));
          if (Array.isArray(products)) {
            const firstProduct = products[0];
            console.log('[DEBUG] Primeiro produto (detalhado):', {
              id: firstProduct?.id,
              name: firstProduct?.name,
              available_stock: firstProduct?.available_stock,
              total_stock: firstProduct?.total_stock,
              reserved_stock: firstProduct?.reserved_stock,
              stock: firstProduct?.stock,
              quantity: firstProduct?.quantity,
              types: {
                available_stock: typeof firstProduct?.available_stock,
                total_stock: typeof firstProduct?.total_stock,
                reserved_stock: typeof firstProduct?.reserved_stock,
                stock: typeof firstProduct?.stock,
                quantity: typeof firstProduct?.quantity
              }
            });
          }
          setPublicProducts(products);
        }).catch(error => {
          console.error('[DEBUG] Erro ao buscar produtos:', error);
        });
      });
    };

    fetchProducts(); // Busca inicial

    if (lastEvent && lastEvent.type === 'stock_update') {
      console.log('[DEBUG] Atualizando produtos devido a evento de estoque');
      fetchProducts(); // Atualiza no evento de estoque
    }
  }, [lastEvent, setPublicProducts]);

  // Efeito para atualizar o status da loja (aberto/fechado)
  useEffect(() => {
    const updateStoreStatus = async () => {
      const address = await fetchAndSetActiveAddress();
      const apiModule = await import('../../api');
      const { STORE_CONFIG } = apiModule;
      let isOpen = STORE_CONFIG.isOpen;
      if (!address || address === '') {
        isOpen = false;
        STORE_CONFIG.isOpen = false;
      }
      if (typeof isOpen !== 'boolean') {
        isOpen = String(isOpen).toLowerCase() === 'true';
      }
      setFooterData({
        workingHours: STORE_CONFIG.workingHours,
        isOpen,
      });
    };
    updateStoreStatus();
    const interval = setInterval(updateStoreStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sincroniza a quantidade local com o estoque disponível
  useEffect(() => {
    setQuantities(prev => {
      const updated: { [key: string]: number } = { ...prev };
      formatProducts.forEach((product: any) => {
        const availableStock = getProductAvailableStock(product.id);
        if (availableStock === 0) {
          updated[product.id] = 1;
        } else if ((updated[product.id] || 1) > availableStock) {
          updated[product.id] = availableStock;
        }
      });
      return updated;
    });
  }, [publicProducts]);

  // Listener para eventos de carrinho expirado
  useEffect(() => {
    const handleCartExpired = (event: CustomEvent) => {
      toast.error(event.detail.message, {
        duration: 6000,
      });
    };
    window.addEventListener('cart-expired', handleCartExpired as EventListener);
    return () => {
      window.removeEventListener('cart-expired', handleCartExpired as EventListener);
    };
  }, []);

  // Função para obter quantidade local para um produto
  const getLocalQuantity = (productId: string | number) => {
    const availableStock = getProductAvailableStock(productId);
    const local = quantities[String(productId)] || 1;
    return Math.min(local, availableStock);
  };

  // Função para definir quantidade local para um produto
  const setLocalQuantity = (productId: string | number, quantity: number) => {
    const availableStock = getProductAvailableStock(productId);
    setQuantities(prev => ({
      ...prev,
      [String(productId)]: Math.max(1, Math.min(quantity, availableStock))
    }));
  };

  const safeProducts = Array.isArray(publicProducts) ? publicProducts : [];
  const categories = ['all', ...Array.from(new Set(safeProducts.map((p: any) => p.category)))];

  // Filtra produtos com base na busca e categoria
  const filteredProducts = formatProducts.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

    const handleAddToCart = async (product: any, quantity: number = 1) => {
    setIsLoading(true);
    try {
      // Deixa o App.tsx fazer as verificações de estoque
      await addToCart(product, quantity);
      setLocalQuantity(product.id, 1);
      
      // Força a re-busca dos produtos para atualizar o estoque na UI
      import('../../api').then(({ api }) => {
        api.getPublicProducts().then((products) => {
          console.log('[DEBUG] Produtos atualizados após addToCart:', products);
          setPublicProducts(products);
        });
      });
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      toast.error('Erro ao adicionar ao carrinho. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null) return 'R$ 0,00';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  if (publicProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Bruno Cake</h1>
        <p className="text-xl text-gray-600">Aqui não é fatia nem pedaço, aqui é tora!</p>
        {footerData.workingHours && (
          <div className="mt-2 text-base font-medium">
            <span className="mr-2">{footerData.workingHours}</span>
            {footerData.isOpen ? (
              <span className="text-green-700 font-bold">(Aberto)</span>
            ) : (
              <span className="text-red-700 font-bold">(Fechado)</span>
            )}
          </div>
        )}
        {!footerData.isOpen && (
          <Alert className="mb-6 border-2 border-red-500 bg-red-50">
            <AlertDescription className="font-medium text-red-800">
              <strong>Loja Fechada:</strong> Não é possível comprar no momento.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Alerta sobre tempo limite do carrinho */}
      <Alert className="mb-6 border-2 border-orange-500 bg-orange-50">
        <Clock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="font-medium text-orange-800">
          ⏰ <strong>Lembre-se:</strong> Após adicionar produtos ao carrinho, você tem apenas <strong>10 minutos</strong> para finalizar sua compra.
          Depois desse tempo, o carrinho será limpo automaticamente.
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.filter(cat => cat !== 'all' && cat && cat.trim() !== '').map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product: any) => {
          const availableStock = getProductAvailableStock(product.id);
          console.log('[DEBUG] Renderizando produto:', product.id, 'com estoque:', availableStock);
          const isLowStock = availableStock <= 5 && availableStock > 0;
          // Um produto está indisponível apenas se não tiver estoque
          const isIndisponivel = availableStock <= 0;
          const lojaFechada = !footerData.isOpen;
          return (
            <Card key={product.id} className={`overflow-hidden transition-shadow ${isIndisponivel || lojaFechada ? 'opacity-80 grayscale' : 'hover:shadow-lg'}`}>
              <div className="relative">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="absolute top-2 left-2 flex gap-2">
                  {product.isNew && (
                    <Badge style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none' }}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Novo
                    </Badge>
                  )}
                  {product.isPromotion && (
                    <Badge style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none' }}>
                      <Percent className="w-3 h-3 mr-1" />
                      Promoção
                    </Badge>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {lojaFechada && (
                    <Badge style={{ backgroundColor: '#f97316', color: '#fff', border: 'none' }}>
                      Loja Fechada
                    </Badge>
                  )}
                  <Badge
                    style={isIndisponivel
                      ? { backgroundColor: '#dc2626', color: '#fff', border: 'none' }
                      : isLowStock
                        ? { backgroundColor: '#facc15', color: '#000', border: 'none' }
                        : { backgroundColor: '#16a34a', color: '#fff', border: 'none' }
                    }
                  >
                    {isIndisponivel ? "Sem Estoque" : `Estoque: ${availableStock}`}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    {product.promotionPrice ? (
                      <>
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(product.price)}
                        </span>
                        <span className="text-xl font-bold text-red-600">
                          {formatPrice(product.promotionPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quantidade:</span>
                      <div className="flex items-center border rounded">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLocalQuantity(product.id, getLocalQuantity(product.id) - 1)}
                          disabled={lojaFechada || isIndisponivel || getLocalQuantity(product.id) <= 1}
                          className={(lojaFechada || isIndisponivel || getLocalQuantity(product.id) <= 1) ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-3 py-1 min-w-[40px] text-center">{getLocalQuantity(product.id)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLocalQuantity(product.id, getLocalQuantity(product.id) + 1)}
                          disabled={lojaFechada || isIndisponivel || getLocalQuantity(product.id) >= availableStock}
                          className={(lojaFechada || isIndisponivel || getLocalQuantity(product.id) >= availableStock) ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className={`flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md ${lojaFechada || isIndisponivel ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                            disabled={lojaFechada || isIndisponivel}
                          >
                            Ver detalhes
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{product.name}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4">
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-64 object-cover rounded-lg"
                              />
                            )}
                            <p className="text-gray-700">{product.description}</p>
                            <div className="flex justify-between items-center">
                              <div>
                                {product.promotionPrice ? (
                                  <div className="flex gap-2 items-center">
                                    <span className="text-lg text-gray-500 line-through">
                                      {formatPrice(product.price)}
                                    </span>
                                    <span className="text-2xl font-bold text-red-600">
                                      {formatPrice(product.promotionPrice)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-2xl font-bold text-gray-900">
                                    {formatPrice(product.price)}
                                  </span>
                                )}
                              </div>
                              <Badge className={isIndisponivel ? "bg-red-600 text-white" : "bg-green-600 text-white"}>
                                {isIndisponivel ? "Indisponível" : `Estoque: ${availableStock}`}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-sm font-medium">Quantidade:</span>
                              <div className="flex items-center border rounded">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={lojaFechada || isIndisponivel || getLocalQuantity(product.id) <= 1}
                                  className={lojaFechada || isIndisponivel || getLocalQuantity(product.id) <= 1 ? "opacity-50 cursor-not-allowed" : ""}
                                  onClick={() => setLocalQuantity(product.id, getLocalQuantity(product.id) - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="px-3 py-1 min-w-[40px] text-center">{getLocalQuantity(product.id)}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={lojaFechada || isIndisponivel || getLocalQuantity(product.id) >= availableStock}
                                  className={lojaFechada || isIndisponivel || getLocalQuantity(product.id) >= availableStock ? "opacity-50 cursor-not-allowed" : ""}
                                  onClick={() => setLocalQuantity(product.id, getLocalQuantity(product.id) + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <Button
                              disabled={lojaFechada || isIndisponivel}
                              className={`w-full ${lojaFechada || isIndisponivel ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-70' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                              onClick={() => !lojaFechada && !isIndisponivel && handleAddToCart(product, getLocalQuantity(product.id))}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              {lojaFechada ? 'Loja Fechada' : isIndisponivel ? 'Indisponível' : 'Adicionar ao carrinho'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        disabled={lojaFechada || isIndisponivel}
                        size="sm"
                        variant="secondary"
                        className={lojaFechada || isIndisponivel ? "opacity-50 cursor-not-allowed" : ""}
                        onClick={() => !lojaFechada && !isIndisponivel && handleAddToCart(product, getLocalQuantity(product.id))}
                      >
                        <span className="w-4 h-4 mr-1">{lojaFechada ? '🔒' : isIndisponivel ? '❌' : <ShoppingCart className="w-4 h-4" />}</span>
                        {lojaFechada ? 'Loja Fechada' : isIndisponivel ? 'Indisponível' : 'Adicionar'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros ou buscar por outros termos.
          </p>
        </div>
      )}
    </div>
  );
};

export { PublicMenu };