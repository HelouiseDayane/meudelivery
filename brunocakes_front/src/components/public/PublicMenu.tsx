import { useState } from 'react';
import { useApp } from '../../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ShoppingCart, Plus, Minus, Search, Star, Clock, Package, Heart, Instagram } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Separator } from '../ui/separator';
import { STORE_CONFIG } from '../../api';

export function PublicMenu() {
  const { products, cart, addToCart, updateCartQuantity } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  // Get available categories
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const isAvailable = product.available && product.stock > 0;
    
    return matchesSearch && matchesCategory && isAvailable;
  });

  const getProductQuantityInCart = (productId: string) => {
    const cartItem = cart.find(item => item.product.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const getLocalQuantity = (productId: string) => {
    return quantities[productId] || 1;
  };

  const setLocalQuantity = (productId: string, quantity: number) => {
    setQuantities(prev => ({ ...prev, [productId]: Math.max(1, quantity) }));
  };

  const handleAddToCart = (product: any) => {
    const quantity = getLocalQuantity(product.id);
    const currentInCart = getProductQuantityInCart(product.id);
    
    if (currentInCart + quantity > product.stock) {
      toast.error(`Disponível apenas ${product.stock - currentInCart} unidades`);
      return;
    }
    
    addToCart(product, quantity);
    setQuantities(prev => ({ ...prev, [product.id]: 1 })); // Reset to 1
  };

  const handleUpdateCartQuantity = (productId: string, newQuantity: number) => {
    updateCartQuantity(productId, newQuantity);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getDisplayPrice = (product: any) => {
    if (product.isPromotion && product.promotionPrice) {
      return {
        current: product.promotionPrice,
        original: product.price,
        isPromotion: true
      };
    }
    return {
      current: product.price,
      original: null,
      isPromotion: false
    };
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <div className="w-16 h-16 bruno-gradient rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bruno-text-gradient">{STORE_CONFIG.name}</h1>
            <p className="text-xl text-primary font-medium">{STORE_CONFIG.slogan}</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Descubra nossas tortas artesanais únicas, feitas com ingredientes selecionados e muito amor. 
          Cada tora é uma experiência gastronômica inesquecível!
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>{STORE_CONFIG.workingHours}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Instagram className="w-4 h-4 text-primary" />
            <span>{STORE_CONFIG.instagram}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar tortas deliciosas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.filter(cat => cat !== 'all').map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cart Summary (when has items) */}
      {cartItemsCount > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {cartItemsCount} {cartItemsCount === 1 ? 'tora' : 'toras'} no carrinho
                </span>
              </div>
              <div className="text-lg font-semibold text-primary">
                {formatPrice(cart.reduce((sum, item) => {
                  const price = item.product.isPromotion && item.product.promotionPrice 
                    ? item.product.promotionPrice 
                    : item.product.price;
                  return sum + (price * item.quantity);
                }, 0))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map(product => {
          const priceInfo = getDisplayPrice(product);
          const quantityInCart = getProductQuantityInCart(product.id);
          const localQuantity = getLocalQuantity(product.id);
          
          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
              <div className="relative">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isNew && (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      <Star className="h-3 w-3 mr-1" />
                      Novidade
                    </Badge>
                  )}
                  {product.isPromotion && (
                    <Badge variant="destructive">
                      Promoção
                    </Badge>
                  )}
                </div>

                {/* Stock indicator */}
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="bg-white/90">
                    <Package className="h-3 w-3 mr-1" />
                    {product.stock}
                  </Badge>
                </div>

                {/* Low stock warning */}
                {product.stock <= 3 && (
                  <div className="absolute bottom-3 right-3">
                    <Badge variant="destructive" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Últimas unidades!
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">{product.name}</CardTitle>
                  <div className="text-right">
                    {priceInfo.isPromotion ? (
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(priceInfo.current)}
                        </div>
                        <div className="text-sm text-muted-foreground line-through">
                          {formatPrice(priceInfo.original!)}
                        </div>
                      </div>
                    ) : (
                      <div className="text-lg font-bold">
                        {formatPrice(priceInfo.current)}
                      </div>
                    )}
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {product.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Product details */}
                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  <div className="flex justify-between">
                    <span>Peso:</span>
                    <span>{product.weight}g</span>
                  </div>
                  {product.expiryDate && (
                    <div className="flex justify-between">
                      <span>Validade:</span>
                      <span>{new Date(product.expiryDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {product.allergens && product.allergens.length > 0 && (
                    <div>
                      <span className="font-medium">Alérgenos:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {product.allergens.map(allergen => (
                          <Badge key={allergen} variant="outline" className="text-xs">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Add to cart section */}
                <div className="space-y-3">
                  {quantityInCart > 0 && (
                    <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <span className="text-sm">No carrinho:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateCartQuantity(product.id, quantityInCart - 1)}
                          disabled={quantityInCart <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium">{quantityInCart}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateCartQuantity(product.id, quantityInCart + 1)}
                          disabled={quantityInCart >= product.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setLocalQuantity(product.id, localQuantity - 1)}
                        disabled={localQuantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="px-3 py-1 min-w-[40px] text-center">{localQuantity}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setLocalQuantity(product.id, localQuantity + 1)}
                        disabled={localQuantity + quantityInCart >= product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <Button
                      className="flex-1 bruno-gradient hover:opacity-90"
                      onClick={() => handleAddToCart(product)}
                      disabled={quantityInCart + localQuantity > product.stock}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>

                  {quantityInCart + localQuantity > product.stock && (
                    <p className="text-xs text-destructive">
                      Quantidade excede estoque disponível
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Nenhuma tora encontrada</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou buscar por outros termos
          </p>
        </div>
      )}

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-8 text-center">
          <h3 className="text-xl font-bold mb-2">Não encontrou o que procurava?</h3>
          <p className="text-muted-foreground mb-4">
            Entre em contato conosco! Fazemos tortas personalizadas sob encomenda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" asChild>
              <a href={`tel:${STORE_CONFIG.phone}`}>
                Ligar: {STORE_CONFIG.phone}
              </a>
            </Button>
            <Button asChild>
              <a 
                href={`https://wa.me/${STORE_CONFIG.whatsapp}?text=Olá! Gostaria de fazer uma encomenda personalizada.`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}