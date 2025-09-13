import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { ArrowLeft, User, Phone, Mail, MapPin, CreditCard, Package } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { STORE_CONFIG } from '../../api';
import { Link } from 'react-router-dom';

export function Checkout() {
  const { cart, createOrder, clearCart } = useApp();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    neighborhood: '',
    additionalInfo: ''
  });

  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.isPromotion && item.product.promotionPrice 
      ? item.product.promotionPrice 
      : item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email é obrigatório');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Telefone é obrigatório');
      return false;
    }
    if (!formData.address.trim()) {
      toast.error('Endereço é obrigatório');
      return false;
    }
    if (!formData.neighborhood.trim()) {
      toast.error('Bairro é obrigatório');
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Email inválido');
      return false;
    }

    // Validate phone format (basic)
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!phoneRegex.test(formData.phone)) {
      toast.error('Telefone deve estar no formato (11) 99999-9999');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast.error('Carrinho está vazio');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const customerData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        neighborhood: formData.neighborhood,
        additionalInfo: formData.additionalInfo
      };

      const orderId = await createOrder(customerData, cart, subtotal);
      
      // Clear cart and redirect to payment
      clearCart();
      navigate(`/payment/${orderId}`);
      
      toast.success('Pedido criado com sucesso! Redirecionando para pagamento...');
    } catch (error) {
      toast.error('Erro ao criar pedido. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneInput = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Apply mask: (11) 99999-9999
    if (digits.length <= 2) {
      return `(${digits}`;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value);
    handleInputChange('phone', formatted);
  };

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
            <h1>Finalizar Pedido</h1>
            <p className="text-muted-foreground">Complete seus dados para continuar</p>
          </div>
        </div>

        <div className="text-center py-16">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
          <h3 className="text-xl font-medium mb-2">Seu carrinho está vazio</h3>
          <p className="text-muted-foreground mb-8">
            Adicione algumas tortas antes de finalizar o pedido
          </p>
          <Link to="/">
            <Button className="bruno-gradient hover:opacity-90">
              Ver Cardápio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/cart">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Carrinho
          </Button>
        </Link>
        <div>
          <h1>Finalizar Pedido</h1>
          <p className="text-muted-foreground">
            Preencha seus dados para continuar
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Customer Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seus Dados
              </CardTitle>
              <CardDescription>
                Precisamos dessas informações para entrar em contato sobre seu pedido
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Seu nome completo"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                        maxLength={15}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="seu@email.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Rua, número, complemento"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood}
                    onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                    placeholder="Nome do bairro"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">Observações (Opcional)</Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                    placeholder="Alguma observação especial sobre seu pedido..."
                    rows={3}
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Store Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <MapPin className="h-5 w-5" />
                Local de Retirada
              </CardTitle>
              <CardDescription>
                Após a confirmação do pagamento, você poderá retirar seu pedido em:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium text-primary">{STORE_CONFIG.name}</p>
              <p className="text-muted-foreground">{STORE_CONFIG.address}</p>
              <p className="text-muted-foreground">{STORE_CONFIG.workingHours}</p>
              <p className="text-muted-foreground">{STORE_CONFIG.phone}</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
              <CardDescription>
                Confira seus itens antes de finalizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Items */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {cart.map(item => {
                  const price = item.product.isPromotion && item.product.promotionPrice 
                    ? item.product.promotionPrice 
                    : item.product.price;
                  const itemTotal = price * item.quantity;
                  
                  return (
                    <div key={item.product.id} className="flex gap-3 pb-3 border-b last:border-b-0">
                      <ImageWithFallback
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-14 h-14 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.product.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{item.quantity}x</span>
                          <span>{formatPrice(price)}</span>
                          {item.product.isPromotion && (
                            <Badge variant="destructive" className="text-xs">
                              Promoção
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="font-medium text-sm">
                        {formatPrice(itemTotal)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator />

              {/* Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({totalItems} {totalItems === 1 ? 'tora' : 'toras'})</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>

              <Separator />

              {/* Payment Info */}
              <div className="bg-muted/50 p-4 rounded text-sm">
                <div className="flex items-center gap-2 font-medium mb-2">
                  <CreditCard className="h-4 w-4" />
                  Forma de Pagamento
                </div>
                <p className="text-muted-foreground">
                  Pagamento via PIX - Você receberá o código PIX na próxima tela
                </p>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="w-full bruno-gradient hover:opacity-90"
                size="lg"
              >
                {loading ? 'Processando...' : 'Ir para Pagamento'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Ao finalizar, você será direcionado para a tela de pagamento PIX
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}