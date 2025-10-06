import { useEffect, useState } from 'react';
import { fetchAndSetActiveAddress, STORE_CONFIG } from '../../api';
import { useRealTime } from '../../hooks/useRealTime';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Plus, Minus, Search, Star, Clock, Percent, Sparkles, ShoppingCart, RefreshCw } from 'lucide-react';
import { useApp } from '../../App';
import { usePWA } from '../../hooks/usePWA';
import { toast } from 'sonner';

export const PublicMenu = () => {
  // Dados do footer para horário/status
  const [footerData, setFooterData] = useState({
    workingHours: '',
    isOpen: true,
  });
  // Não usar mais isStoreOpen, usar sempre footerData.isOpen para garantir alinhamento com o footer
  useEffect(() => {
    const updateStoreStatus = async () => {
      await fetchAndSetActiveAddress();
      const apiModule = await import('../../api');
      const { STORE_CONFIG } = apiModule;
      // Garante que isOpen seja sempre booleano
      let isOpen = STORE_CONFIG.isOpen;
      if (typeof isOpen !== 'boolean') {
        isOpen = String(isOpen).toLowerCase() === 'true';
      }
      // Log para depuração
      console.log('[DEBUG] STORE_CONFIG.isOpen:', STORE_CONFIG.isOpen, '| workingHours:', STORE_CONFIG.workingHours);
      setFooterData({
        workingHours: STORE_CONFIG.workingHours,
        isOpen,
      });
    };
    updateStoreStatus();
    const interval = setInterval(updateStoreStatus, 30000);
    return () => clearInterval(interval);
  }, []);
  const { products, addToCart, getAvailableStock, hasStock, refreshProducts } = useApp();
  const { isMobile } = usePWA();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});


  // Atualização em tempo real do estoque
  const { lastEvent } = useRealTime();
  useEffect(() => {
    if (lastEvent && lastEvent.type === 'stock_update') {
      refreshProducts();
    }
  }, [lastEvent, refreshProducts]);

  // Sempre sincroniza a quantidade local máxima com o estoque disponível
  useEffect(() => {
    setQuantities(prev => {
      const updated: {[key: string]: number} = { ...prev };
      normalizedProducts.forEach(product => {
        const availableStock = getAvailableStock(product.id);
        // Se estoque zerou, zera quantidade local
        if (availableStock === 0) {
          updated[product.id] = 1;
        } else if ((updated[product.id] || 1) > availableStock) {
          updated[product.id] = availableStock;
        }
      });
      return updated;
    });
  }, [products, getAvailableStock]);

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


  // Função para obter quantidade local para um produto (máximo: estoque disponível)
  const getLocalQuantity = (productId: string) => {
    const availableStock = getAvailableStock(productId);
    const local = quantities[productId] || 1;
    return Math.min(local, availableStock);
  };


  // Função para definir quantidade local para um produto (respeita estoque)
  const setLocalQuantity = (productId: string, quantity: number) => {
    const availableStock = getAvailableStock(productId);
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(quantity, availableStock))
    }));
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];


  // Padroniza os campos de badge para evitar bugs de exibição
  const normalizedProducts = products.map((product) => ({
    ...product,
    isNew: product.isNew ?? product.is_new ?? false,
    isPromotion: product.isPromotion ?? product.is_promo ?? false,
  }));

  // Se a loja estiver fechada, todos os produtos ficam indisponíveis para adicionar ao carrinho
  const filteredProducts = normalizedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });


  const handleAddToCart = async (product: any, quantity: number = 1) => {
    const availableStock = getAvailableStock(product.id);
    if (availableStock === 0) {
      toast.error('Produto indisponível! Estoque esgotado.');
      setLocalQuantity(product.id, 1);
      return;
    }
    if (availableStock < quantity) {
      toast.error(`Estoque insuficiente! Disponível: ${availableStock} unidades`);
      setLocalQuantity(product.id, availableStock);
      return;
    }
    setIsLoading(true);
    try {
      await addToCart(product, quantity);
      // Atualiza quantidade local e força atualização do estoque exibido
      setLocalQuantity(product.id, 1);
      refreshProducts();
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null) return 'R$ 0,00';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  // Se não há produtos, mostra loading
  if (products.length === 0) {
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
        {/* Horário de funcionamento e status igual ao footer */}
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
      </div>
      {/* Aviso de disponibilidade geral da loja */}
    

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
        {filteredProducts.map(product => {
          const availableStock = getAvailableStock(product.id);
          const isLowStock = availableStock <= 5 && availableStock > 0;
          // Produto só está disponível se loja aberta E estoque > 0
          const isIndisponivel = !footerData.isOpen || availableStock === 0;
          return (
            <Card key={product.id} className={`overflow-hidden transition-shadow ${isIndisponivel ? 'opacity-80 grayscale' : 'hover:shadow-lg'}`}>
              <div className="relative">
                {product.imageUrl && (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-2">
                  {product.isNew && (
                    <Badge className="bg-blue-500 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Novo
                    </Badge>
                  )}
                  {product.isPromotion && (
                    <Badge className="bg-red-500 text-white">
                      <Percent className="w-3 h-3 mr-1" />
                      Promoção
                    </Badge>
                  )}
                </div>
                {/* Stock Badge */}
                <div className="absolute top-2 right-2">
                  <Badge 
                    variant="destructive"
                    className={isIndisponivel ? "bg-red-600 text-white" : (isLowStock ? "bg-yellow-500 text-black" : "bg-green-600 text-white")}
                  >
                    {isIndisponivel ? "Indisponível" : `Estoque: ${availableStock}`}
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
                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Quantidade:</span>
                      <div className="flex items-center border rounded">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLocalQuantity(product.id, getLocalQuantity(product.id) - 1)}
                          disabled={isIndisponivel || getLocalQuantity(product.id) <= 1}
                          className={isIndisponivel || getLocalQuantity(product.id) <= 1 ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-3 py-1 min-w-[40px] text-center">{getLocalQuantity(product.id)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLocalQuantity(product.id, getLocalQuantity(product.id) + 1)}
                          disabled={isIndisponivel || getLocalQuantity(product.id) >= availableStock}
                          className={isIndisponivel || getLocalQuantity(product.id) >= availableStock ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className={`flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md ${isIndisponivel ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                            disabled={isIndisponivel}
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
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-sm font-medium">Quantidade:</span>
                              <div className="flex items-center border rounded">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isIndisponivel || getLocalQuantity(product.id) <= 1}
                                  className={isIndisponivel || getLocalQuantity(product.id) <= 1 ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="px-3 py-1 min-w-[40px] text-center">{getLocalQuantity(product.id)}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={isIndisponivel || getLocalQuantity(product.id) >= availableStock}
                                  className={isIndisponivel || getLocalQuantity(product.id) >= availableStock ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <Button
                              disabled={isIndisponivel}
                              className={`w-full ${isIndisponivel ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed opacity-70' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              {isIndisponivel ? 'Indisponível' : 'Adicionar ao carrinho'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        disabled={isIndisponivel}
                        size="sm"
                        variant="secondary"
                        className={isIndisponivel ? "opacity-50 cursor-not-allowed" : ""}
                        onClick={() => !isIndisponivel && handleAddToCart(product, getLocalQuantity(product.id))}
                      >
                        <span className="w-4 h-4 mr-1">{isIndisponivel ? '❌' : <ShoppingCart className="w-4 h-4" />}</span>
                        {isIndisponivel ? 'Indisponível' : 'Adicionar'}
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