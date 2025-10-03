import { useState, useEffect } from 'react';
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
  const getLocalQuantity = (productId: string) => {
    return quantities[productId] || 1;
  };

  // Função para definir quantidade local para um produto
  const setLocalQuantity = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity)
    }));
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    // SEMPRE MOSTRAR PRODUTOS - apenas filtrar por busca e categoria
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = async (product: any, quantity: number = 1) => {
    const availableStock = getAvailableStock(product.id);
    
    if (availableStock < quantity) {
      alert(`Estoque insuficiente! Disponível: ${availableStock} unidades`);
      return;
    }
    
    setIsLoading(true);
    try {
      await addToCart(product, quantity);
      // Reset local quantity after successful add
      setLocalQuantity(product.id, 1);
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Bruno Cakes</h1>
        <p className="text-xl text-gray-600">Deliciosos bolos artesanais feitos com amor</p>
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
        {filteredProducts.map(product => {
          const availableStock = getAvailableStock(product.id);
          const isLowStock = availableStock <= 5 && availableStock > 0;
          
          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                    variant={availableStock === 0 ? "destructive" : isLowStock ? "destructive" : "secondary"}
                    className={availableStock === 0 ? "bg-red-500 text-white" : isLowStock ? "bg-yellow-500 text-black" : ""}
                  >
                    {availableStock === 0 ? "Indisponível" : `Estoque: ${availableStock}`}
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
                          disabled={getLocalQuantity(product.id) <= 1 || availableStock === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="px-3 py-1 min-w-[40px] text-center">{getLocalQuantity(product.id)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setLocalQuantity(product.id, getLocalQuantity(product.id) + 1)}
                          disabled={getLocalQuantity(product.id) >= availableStock || availableStock === 0}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
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
                              <Badge className={availableStock === 0 ? "bg-red-500 text-white" : ""}>
                                {availableStock === 0 ? "Indisponível" : `Estoque: ${availableStock}`}
                              </Badge>
                            </div>
                            
                            {/* Quantity Selector */}
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-sm font-medium">Quantidade:</span>
                              <div className="flex items-center border rounded">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setLocalQuantity(product.id, getLocalQuantity(product.id) - 1)}
                                  disabled={getLocalQuantity(product.id) <= 1 || availableStock === 0}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="px-3 py-1 min-w-[40px] text-center">{getLocalQuantity(product.id)}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setLocalQuantity(product.id, getLocalQuantity(product.id) + 1)}
                                  disabled={getLocalQuantity(product.id) >= availableStock || availableStock === 0}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => handleAddToCart(product, getLocalQuantity(product.id))}
                              disabled={availableStock === 0 || isLoading}
                              className={`w-full ${availableStock === 0 ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : ''}`}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              {availableStock === 0 ? 'Indisponível' : 'Adicionar ao Carrinho'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <Button
                        onClick={() => handleAddToCart(product, getLocalQuantity(product.id))}
                        disabled={availableStock === 0 || isLoading}
                        size="sm"
                        variant={availableStock === 0 ? "secondary" : "default"}
                        className={availableStock === 0 ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        {availableStock === 0 ? (
                          <>
                            <span className="w-4 h-4 mr-1">❌</span>
                            Indisponível
                          </>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
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