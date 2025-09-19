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
import { ShoppingCart, MapPin, Phone, Mail, User, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { STORE_CONFIG, getProductImageUrl } from '../../api';

export function Checkout() {
  const { cart, user, createOrder, clearCart } = useApp();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    neighborhood: user?.neighborhood || '',
    additionalInfo: ''
  });

  const total = cart.reduce((sum, item) => {
    const price = item.product.isPromotion && item.product.promotionPrice 
      ? item.product.promotionPrice 
      : item.product.price;
    return sum + (price * item.quantity);
  }, 0);

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
      const orderData = {
        clientId: user!.id,
        clientName: formData.name,
        clientPhone: formData.phone,
        clientEmail: formData.email,
        clientAddress: formData.address,
        clientNeighborhood: formData.neighborhood,
        items: cart,
        total: total
      };

      const orderId = await createOrder(orderData);
      toast.success('Pedido criado com sucesso!');
      
      // Redirect to payment page
      navigate(`/payment/${orderId}`);
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
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium">Seu carrinho está vazio</h3>
        <p className="text-muted-foreground mb-6">
          Adicione alguns doces deliciosos antes de finalizar o pedido
        </p>
        <Button onClick={() => navigate('/menu')}>
          Ver Cardápio
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/cart')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Carrinho
        </Button>
        <div>
          <h1>Finalizar Pedido</h1>
          <p className="text-muted-foreground">
            Confirme seus dados e finalize seu pedido
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>
                Informações para contato e identificação do pedido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Seu nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço para Contato
              </CardTitle>
              <CardDescription>
                Endereço para envio de informações sobre o pedido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Rua, número, complemento"
                  required
                />
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
                <Label htmlFor="additionalInfo">Informações Adicionais</Label>
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  placeholder="Observações sobre o pedido, preferências, etc."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Store Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <MapPin className="h-5 w-5" />
                Local de Retirada
              </CardTitle>
            </CardHeader>
            <CardContent className="text-blue-700">
              <div className="space-y-2">
                <p className="font-medium">{STORE_CONFIG.name}</p>
                <p>{STORE_CONFIG.address}</p>
                <p>{STORE_CONFIG.workingHours}</p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {STORE_CONFIG.phone}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Items */}
              <div className="space-y-3">
                {cart.map(item => {
                  const price = item.product.isPromotion && item.product.promotionPrice 
                    ? item.product.promotionPrice 
                    : item.product.price;
                  const itemTotal = price * item.quantity;
                  
                  return (
                    <div key={item.product.id} className="flex gap-3">
                      <ImageWithFallback
                        src={getProductImageUrl(item.product.image) || item.product.imageUrl || item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.product.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{item.quantity}x</span>
                          <span>{formatPrice(price)}</span>
                          {item.product.isPromotion && (
                            <Badge variant="secondary" className="text-xs">
                              Promoção
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="font-medium">
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
                  <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} itens)</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <Separator />

              {/* Payment Info */}
              <div className="bg-muted/50 p-3 rounded text-sm">
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
                className="w-full"
                size="lg"
              >
                {loading ? 'Processando...' : 'Finalizar Pedido'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Ao finalizar o pedido, você será direcionado para a tela de pagamento PIX
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}