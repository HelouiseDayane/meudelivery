import { useApp } from '../../App';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import { getProductImageUrl } from '../../api';

export function Cart() {
  const { cart, updateCartQuantity, removeFromCart, clearCart } = useApp();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      toast.success('Item removido do carrinho');
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    removeFromCart(productId);
    toast.success(`${productName} removido do carrinho`);
  };

  const handleClearCart = () => {
    clearCart();
    toast.success('Carrinho limpo');
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Adicione itens ao carrinho antes de finalizar o pedido');
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Seu carrinho está vazio</h2>
        <p className="text-gray-500 mb-6">Adicione alguns itens deliciosos do nosso cardápio!</p>
        <Button 
          onClick={() => navigate('/menu')}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Ver Cardápio
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-orange-900">Meu Carrinho</h1>
        <Button
          variant="outline"
          onClick={handleClearCart}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Limpar Carrinho
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item.product.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                    <ImageWithFallback
                      src={getProductImageUrl(item.product.image) || item.product.imageUrl || item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{item.product.description}</p>
                    <div className="text-lg font-bold text-orange-600">
                      R$ {item.product.price.toFixed(2).replace('.', ',')}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="h-8 w-8"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="h-8 w-8"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Remove button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveItem(item.product.id, item.product.name)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Item total */}
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-lg">
                    R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de entrega:</span>
                  <span>R$ 5,00</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span className="text-orange-600">
                    R$ {(total + 5).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Button 
                  onClick={handleCheckout}
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  size="lg"
                >
                  Finalizar Pedido
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/menu')}
                  className="w-full"
                >
                  Continuar Comprando
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center pt-2">
                <p>Tempo estimado de entrega: 30-45 minutos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}