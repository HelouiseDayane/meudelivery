import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  Trash2, 
  MapPin, 
  Clock, 
  CreditCard,
  Smartphone,
  Banknote,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, addToCart, clearCart } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const [orderData, setOrderData] = useState({
    deliveryAddress: '',
    deliveryTime: 'asap',
    scheduledTime: '',
    paymentMethod: 'pix',
    notes: '',
    customerInfo: {
      name: '',
      phone: '',
      email: ''
    }
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = subtotal >= 50 ? 0 : 8.90;
  const total = subtotal + deliveryFee;

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      const item = cart.find(i => i.id === productId);
      if (item && newQuantity < item.quantity) {
        removeFromCart(productId);
        if (newQuantity > 0) {
          addToCart({ ...item, quantity: newQuantity - 1 });
        }
      } else if (item) {
        addToCart(item);
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('customerInfo.')) {
      const subField = field.split('.')[1];
      setOrderData(prev => ({
        ...prev,
        customerInfo: {
          ...prev.customerInfo,
          [subField]: value
        }
      }));
    } else {
      setOrderData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields
    if (!orderData.deliveryAddress || !orderData.customerInfo.name || 
        !orderData.customerInfo.phone || cart.length === 0) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create order
    const order = {
      id: `ORD-${Date.now()}`,
      items: cart,
      total,
      subtotal,
      deliveryFee,
      ...orderData,
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedDelivery: orderData.deliveryTime === 'asap' 
        ? new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
        : orderData.scheduledTime
    };

    clearCart();
    toast.success('Pedido realizado com sucesso!');
    navigate('/my-orders');
    setIsLoading(false);
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/products')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl">Carrinho</h1>
          </div>
        </div>

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg mb-2">Seu carrinho está vazio</h3>
          <p className="text-muted-foreground mb-4">
            Adicione alguns doces deliciosos ao seu carrinho!
          </p>
          <Button 
            onClick={() => navigate('/products')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Ver Produtos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/products')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continuar Comprando
        </Button>
        <div>
          <h1 className="text-2xl">Finalizar Pedido</h1>
          <p className="text-muted-foreground">
            Revise seu pedido e confirme a entrega
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Nome Completo *</Label>
                  <Input
                    id="customerName"
                    type="text"
                    placeholder="Seu nome"
                    value={orderData.customerInfo.name}
                    onChange={(e) => handleInputChange('customerInfo.name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Telefone *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={orderData.customerInfo.phone}
                    onChange={(e) => handleInputChange('customerInfo.phone', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="seu@email.com"
                  value={orderData.customerInfo.email}
                  onChange={(e) => handleInputChange('customerInfo.email', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Informações de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Endereço de Entrega *</Label>
                <Textarea
                  id="deliveryAddress"
                  placeholder="Rua, número, complemento, bairro, cidade, CEP"
                  value={orderData.deliveryAddress}
                  onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Horário de Entrega</Label>
                <RadioGroup 
                  value={orderData.deliveryTime} 
                  onValueChange={(value) => handleInputChange('deliveryTime', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="asap" id="asap" />
                    <Label htmlFor="asap" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      O mais rápido possível (aprox. 1 hora)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="scheduled" id="scheduled" />
                    <Label htmlFor="scheduled">Agendar entrega</Label>
                  </div>
                </RadioGroup>

                {orderData.deliveryTime === 'scheduled' && (
                  <div className="ml-6">
                    <Input
                      type="datetime-local"
                      value={orderData.scheduledTime}
                      onChange={(e) => handleInputChange('scheduledTime', e.target.value)}
                      min={new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Forma de Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={orderData.paymentMethod} 
                onValueChange={(value) => handleInputChange('paymentMethod', value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    PIX (5% de desconto)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Cartão de Crédito
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2">
                    <Banknote className="h-4 w-4" />
                    Dinheiro na entrega
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Observações do Pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Alguma observação especial? Ex: Entregar na portaria, é para presente, etc."
                value={orderData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {item.price.toFixed(2)} cada
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Totals */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de entrega</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <Badge variant="secondary" className="text-xs">Grátis</Badge>
                    ) : (
                      `R$ ${deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                {orderData.paymentMethod === 'pix' && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto PIX (5%)</span>
                    <span>-R$ {(total * 0.05).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg">
                  <span>Total</span>
                  <span>
                    R$ {orderData.paymentMethod === 'pix' 
                      ? (total * 0.95).toFixed(2) 
                      : total.toFixed(2)
                    }
                  </span>
                </div>
              </div>

              {subtotal < 50 && (
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  Adicione mais R$ {(50 - subtotal).toFixed(2)} para ganhar frete grátis!
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={isLoading}
              >
                {isLoading ? 'Processando...' : 'Confirmar Pedido'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}