import React, { useEffect, useState } from 'react';
import { fetchAndSetActiveAddress, getProductImageUrl, api, apiRequest } from '../../api';
import { useRealTime } from '../../hooks/useRealTime';
import { useStoreConfig } from '../../hooks/useStoreConfig';
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
  
  // Hook para gerenciar configurações da loja
  const { storeSettings } = useStoreConfig();

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
    const product = formatProducts.find((p: any) => p.id === idToSearch);
    if (!product) {
      return 0;
    }
    
    // Primeiro tenta pegar available_stock da API
    const availableStock = product.available_stock;
    
    // Se disponível, valida e retorna
    if (availableStock !== undefined && availableStock !== null) {
      const stock = Number(availableStock);
      if (!isNaN(stock)) {
        return stock;
      }
    }
    
    // Caso não tenha available_stock, tenta usar total_stock - reserved_stock
    if (product.total_stock !== undefined && product.reserved_stock !== undefined) {
      const total = Number(product.total_stock);
      const reserved = Number(product.reserved_stock);
      if (!isNaN(total) && !isNaN(reserved)) {
        const available = Math.max(0, total - reserved);
        return available;
      }
    }

    return 0;
  };

  // Efeito para buscar produtos (inicial e em atualização de estoque)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Importa a publicApi para garantir uso do endpoint correto
        const { publicApi } = await import('../../api');
        const products = await publicApi.getPublicProducts();
        setPublicProducts(products);
      } catch (error) {
        console.error('Erro ao buscar produtos (with-stock):', error);
      }
    };

    fetchProducts(); // Busca inicial

    if (lastEvent && lastEvent.type === 'stock_update') {
      fetchProducts(); // Atualiza no evento de estoque
    }
  }, [lastEvent, setPublicProducts]);

  // Efeito para atualizar o status da loja (aberto/fechado)
  useEffect(() => {
    const updateStoreStatus = async () => {
      const address = await fetchAndSetActiveAddress(apiRequest);
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
    const interval = setInterval(updateStoreStatus, 5000);
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
    const handleCartExpired = async (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('[cart-expired] Evento recebido:', customEvent);
      toast.error(customEvent.detail?.message || 'Carrinho expirado!', {
        duration: 6000,
      });
      // Atualiza o localStorage para sincronizar entre abas, só se não foi disparado agora
      if (window.localStorage) {
        const last = window.localStorage.getItem('bruno_cart_expired');
        const now = Date.now().toString();
        if (last !== now) {
          window.localStorage.setItem('bruno_cart_expired', now);
        }
      }
      // Força atualização dos produtos ao expirar o carrinho
      try {
        const { publicApi } = await import('../../api');
        const products = await publicApi.getPublicProducts();
        setPublicProducts(products);
      } catch (error) {
        console.error('Erro ao atualizar produtos após expiração do carrinho:', error);
      }
    };
    window.addEventListener('cart-expired', handleCartExpired);
    return () => {
      window.removeEventListener('cart-expired', handleCartExpired);
    };
  }, [setPublicProducts]);

  // Disparo manual do evento cart-expired para teste/debug (remova depois de validar)
  useEffect(() => {
    // Exemplo: se houver alguma flag de expiração do carrinho, dispare o evento
    // Substitua por sua lógica real de expiração do carrinho!
    const checkCartExpired = () => {
      // Exemplo: checar se existe uma flag no localStorage
      const expired = window.localStorage.getItem('bruno_cart_force_expired');
      if (expired === '1') {
        const event = new CustomEvent('cart-expired', { detail: { message: 'Carrinho expirado (debug manual)' } });
        window.dispatchEvent(event);
        window.localStorage.removeItem('bruno_cart_force_expired');
      }
    };
    const interval = setInterval(checkCartExpired, 2000);
    return () => clearInterval(interval);
  }, []);

  // Listener para atualização via localStorage (garante atualização em todas as abas)
  useEffect(() => {
    const handleStorage = async (event: StorageEvent) => {
      if (event.key === 'bruno_cart_expired') {
        try {
          const { publicApi } = await import('../../api');
          const products = await publicApi.getPublicProducts();
          setPublicProducts(products);
        } catch (error) {
          console.error('Erro ao atualizar produtos via storage:', error);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [setPublicProducts]);

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
  
  // Remover duplicatas baseado no nome + categoria (mesmo padrão do ProductsPage)
  const uniqueProducts = formatProducts.filter((product, index, self) => 
    index === self.findIndex(p => p.name === product.name && p.category === product.category)
  );
  
  const categories = ['all', ...Array.from(new Set(safeProducts.map((p: any) => p.category)))];

  // Filtra produtos únicos com base na busca e categoria
  const filteredProducts = uniqueProducts.filter((product: any) => {
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
        {storeSettings?.store_name && (
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {storeSettings.store_name}
          </h1>
        )}
        {storeSettings?.store_slogan && (
          <p className="text-xl text-gray-600">
            {storeSettings.store_slogan}
          </p>
        )}
        {footerData.workingHours && (
          <div className="mt-2 text-base font-medium">
            <span className="mr-2">{footerData.workingHours}</span>
            {footerData.isOpen ? (
              <span className="text-primary font-bold">(Aberto)</span>
            ) : (
              <span className="text-red-700 font-bold">(Fechado)</span>
            )}
          </div>
        )}
        {!footerData.isOpen && (
            <Alert className="mb-6 border-2 border-red-500 bg-red-50 flex justify-center">
            <AlertDescription className="font-medium text-red-800 text-center">
              <strong>Loja Fechada:</strong> Não é possível comprar no momento.
            </AlertDescription>
            </Alert>
        )}
      </div>

      {/* Alerta sobre tempo limite do carrinho */}
      <Alert className="mb-6 border-2 border-orange-500 bg-orange-50">
       
        <AlertDescription className="font-medium text-orange-800">
          ⏰ <strong>Lembre-se:</strong> Após adicionar produtos ao carrinho, você tem apenas <strong>3 minutos</strong> para finalizar sua compra.
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
                    <Badge 
                      className="product-badge-novo force-green-bg bg-green-500! text-white! border-green-500!"
                      data-badge="novo"
                      style={{ 
                        backgroundColor: '#22c55e !important', 
                        color: 'white !important', 
                        borderColor: '#22c55e !important',
                        border: '1px solid #22c55e !important'
                      }}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Novo
                    </Badge>
                  )}
                  {product.isPromotion && (
                    <Badge 
                      className="product-badge-promocao force-red-bg bg-red-500! text-white! border-red-500!"
                      data-badge="promocao"
                      style={{ 
                        backgroundColor: '#ef4444 !important', 
                        color: 'white !important', 
                        borderColor: '#ef4444 !important',
                        border: '1px solid #ef4444 !important'
                      }}
                    >
                      <Percent className="w-3 h-3 mr-1" />
                      Promoção
                    </Badge>
                  )}
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {lojaFechada && (
                    <Badge className="bg-orange-500 text-white border-none">
                      Loja Fechada
                    </Badge>
                  )}
                  <Badge
                    className={isIndisponivel
                      ? "bg-destructive text-destructive-foreground border-none"
                      : isLowStock
                        ? "bg-yellow-400 text-black border-none"
                        : "bg-primary text-primary-foreground border-none"
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
                              <Badge 
                                className={isIndisponivel 
                                  ? "bg-destructive text-destructive-foreground" 
                                  : "bg-primary text-primary-foreground"
                                }
                              >
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
                              className={`w-full ${lojaFechada || isIndisponivel ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-70' : 'bg-primary hover:bg-primary/90 text-white text-white!'}`}
                              onClick={() => !lojaFechada && !isIndisponivel && handleAddToCart(product, getLocalQuantity(product.id))}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2 text-white" />
                              {lojaFechada ? 'Loja Fechada' : isIndisponivel ? 'Indisponível' : 'Adicionar ao carrinho'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        disabled={lojaFechada || isIndisponivel}
                        size="sm"
                        className={lojaFechada || isIndisponivel ? "opacity-50 cursor-not-allowed" : "bg-primary hover:bg-primary/90 text-white text-white!"}
                        onClick={() => !lojaFechada && !isIndisponivel && handleAddToCart(product, getLocalQuantity(product.id))}
                      >
                        <span className="w-4 h-4 mr-1">
                          {lojaFechada ? '🔒' : isIndisponivel ? '❌' : <ShoppingCart className="w-4 h-4 text-white" />}
                        </span>
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