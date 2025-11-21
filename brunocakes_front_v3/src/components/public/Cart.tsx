import { Link } from 'react-router-dom';
import { useApp } from '../../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ArrowRight, Package, MapPin, Clock, AlertCircle } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { STORE_CONFIG, getProductImageUrl } from '../../api';
import { useCartExpiration } from '../../hooks/useCartExpiration';
import { useEffect } from 'react';

export function Cart() {
  const { cart, updateCartQuantity, removeFromCart, clearCart } = useApp();
  const { currentStatus, clearAllExpirationItems, CART_EXPIRATION_MINUTES } = useCartExpiration();

  // Limpar expiração quando o carrinho for limpo
  useEffect(() => {
    if (cart.length === 0) {
      clearAllExpirationItems();
    }
  }, [cart.length, clearAllExpirationItems]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.isPromotion && item.product.promotionPrice 
      ? item.product.promotionPrice 
      : item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (cart.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Cardápio
            </Button>
          </Link>
          <div>
            <h1>Seu Carrinho</h1>
            <p className="text-muted-foreground">Gerencie suas tortas selecionadas</p>
          </div>
        </div>

        <div className="text-center py-16">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">Seu carrinho está vazio</h3>
          <p className="text-muted-foreground mb-8">
            Que tal adicionar algumas tortas deliciosas?
          </p>
          <Link to="/">
            <Button className="bruno-gradient hover:opacity-90">
              <Package className="h-4 w-4 mr-2" />
              Ver Cardápio
            </Button>
          </Link>
        </div>

        {/* Store Info */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <MapPin className="h-5 w-5" />
              Local de Retirada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{STORE_CONFIG.name}</p>
            <p className="text-sm text-muted-foreground">{STORE_CONFIG.address}</p>
            <p className="text-sm text-muted-foreground">{STORE_CONFIG.workingHours}</p>
            <p className="text-sm text-muted-foreground">{STORE_CONFIG.phone}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continuar Comprando
          </Button>
        </Link>
        <div className="flex-1">
          <h1>Seu Carrinho</h1>
          <p className="text-muted-foreground">
            {totalItems} {totalItems === 1 ? 'tora selecionada' : 'toras selecionadas'}
          </p>
        </div>
      </div>

      {/* Alerta de Tempo Limite do Carrinho */}
      <Alert className="border-2 border-blue-500 bg-blue-50">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="font-medium text-blue-800">
          ⏰ <strong>Importante:</strong> Você tem apenas <strong>3 minutos</strong> para finalizar sua compra após adicionar itens ao carrinho. 
          Depois desse tempo, o carrinho será limpo automaticamente e você precisará selecionar os produtos novamente.
        </AlertDescription>
      </Alert>

      {/* Cart Expiration Timer */}
      {currentStatus && cart.length > 0 && (
        <Alert className={`border-2 ${
          currentStatus.isCritical ? 'border-red-500 bg-red-50' :
          currentStatus.isWarning ? 'border-yellow-500 bg-yellow-50' :
          'border-blue-500 bg-blue-50'
        }`}>
          <div className="flex items-center gap-2">
            {currentStatus.isCritical ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Clock className="h-4 w-4 text-blue-600" />
            )}
            <AlertDescription className={`font-medium ${
              currentStatus.isCritical ? 'text-red-800' :
              currentStatus.isWarning ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              {currentStatus.isCritical ? (
                <>🚨 Seu carrinho expira em {currentStatus.formattedTime}! Complete sua compra agora.</>
              ) : currentStatus.isWarning ? (
                <>⚠️ Seu carrinho expira em {currentStatus.formattedTime}. Finalize logo sua compra!</>
              ) : (
                <>⏰ Tempo restante no carrinho: {currentStatus.formattedTime} (Total: {CART_EXPIRATION_MINUTES} min)</>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Itens do Carrinho</CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearCart}
                className="text-destructive hover:text-destructive"
              >
                Limpar Carrinho
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map(item => {
                const price = item.product.isPromotion && item.product.promotionPrice 
                  ? item.product.promotionPrice 
                  : item.product.price;
                const itemTotal = price * item.quantity;

                return (
                  <div key={item.product.id} className="flex gap-4 p-4 border rounded-lg">
                    <ImageWithFallback
                      src={getProductImageUrl(item.product.image) || item.product.imageUrl || item.product.image}
                      alt={item.product.name}
                      className="w-20 h-20 rounded object-cover"
                    />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{item.product.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.product.category}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {item.product.isPromotion && (
                              <Badge variant="destructive" className="text-xs">
                                Promoção
                              </Badge>
                            )}
                            {item.product.isNew && (
                              <Badge variant="secondary" className="text-xs">
                                Novidade
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold">{formatPrice(itemTotal)}</div>
                          {item.product.isPromotion && item.product.promotionPrice && (
                            <div className="text-xs text-muted-foreground">
                              {formatPrice(price)} cada
                            </div>
                          )}
                          {!item.product.isPromotion && (
                            <div className="text-xs text-muted-foreground">
                              {formatPrice(price)} cada
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stock warning */}
                      {item.quantity >= item.product.stock && (
                        <p className="text-xs text-destructive">
                          Quantidade máxima disponível: {item.product.stock}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'tora' : 'toras'})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>

              <Link to="/checkout" className="block">
                <Button className="w-full bruno-gradient hover:opacity-90" size="lg">
                  Finalizar Pedido
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>

              <div className="text-xs text-muted-foreground text-center">
                Você será direcionado para inserir seus dados e escolher a forma de pagamento
              </div>
            </CardContent>
          </Card>

          {/* Store Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
                Retirada na Loja
              </CardTitle>
              <CardDescription>
                Suas tortas ficarão prontas para retirada no endereço abaixo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium text-primary">{STORE_CONFIG.name}</p>
              <p className="text-muted-foreground">{STORE_CONFIG.address}</p>
              <p className="text-muted-foreground">{STORE_CONFIG.workingHours}</p>
              <p className="text-muted-foreground">{STORE_CONFIG.phone}</p>
            </CardContent>
          </Card>

          {/* Delivery Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">Sistema de Retirada</p>
                  <p className="text-blue-700">
                    Trabalhamos apenas com retirada na loja. Após confirmar o pagamento, 
                    você receberá um aviso quando seu pedido estiver pronto!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}