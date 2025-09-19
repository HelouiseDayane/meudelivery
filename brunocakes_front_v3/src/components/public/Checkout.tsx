import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { ArrowLeft, MessageCircle, User, Mail, Phone, MapPin } from 'lucide-react';
import { useApp } from '../../App';
import { toast } from 'sonner';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  additionalInfo?: string;
}

export const Checkout = () => {
  const navigate = useNavigate();
  const { cart, createOrder, clearCart } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    neighborhood: '',
    additionalInfo: '',
  });

  const total = cart.reduce((sum, item) => {
    const price = item.product.isPromotion ? item.product.promotionPrice || item.product.price : item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const generateWhatsAppMessage = () => {
    const phoneNumber = '5511999999999'; // Número do WhatsApp da loja
    
    let message = `🎂 *Novo Pedido - Bruno Cakes* 🎂\n\n`;
    message += `*Cliente:* ${customerData.name}\n`;
    message += `*Email:* ${customerData.email}\n`;
    message += `*Telefone:* ${customerData.phone}\n`;
    message += `*Endereço:* ${customerData.address}\n`;
    message += `*Bairro:* ${customerData.neighborhood}\n`;
    
    if (customerData.additionalInfo) {
      message += `*Observações:* ${customerData.additionalInfo}\n`;
    }
    
    message += `\n*🛒 ITENS DO PEDIDO:*\n`;
    
    cart.forEach((item, index) => {
      const price = item.product.isPromotion ? item.product.promotionPrice || item.product.price : item.product.price;
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   Quantidade: ${item.quantity}x\n`;
      message += `   Valor unitário: R$ ${price.toFixed(2)}\n`;
      message += `   Subtotal: R$ ${(price * item.quantity).toFixed(2)}\n\n`;
    });
    
    message += `*💰 VALOR TOTAL: R$ ${total.toFixed(2)}*\n\n`;
    message += `*Forma de Pagamento:* PIX (será enviado após confirmação)\n`;
    message += `*Retirada na loja:* Rua das Tortas, 123 - Centro\n\n`;
    message += `_Aqui não é fatia nem pedaço, aqui é tora!_ 🍰`;
    
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    // Validação básica
    if (!customerData.name || !customerData.email || !customerData.phone || !customerData.address || !customerData.neighborhood) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);
    
    try {
      // Criar pedido no sistema
      const orderId = await createOrder(customerData, cart, total);
      
      // Gerar link do WhatsApp
      const whatsappUrl = generateWhatsAppMessage();
      
      // Limpar carrinho
      clearCart();
      
      // Redirecionar para WhatsApp
      window.open(whatsappUrl, '_blank');
      
      toast.success('Pedido criado! Redirecionando para WhatsApp...');
      
      // Redirecionar para página de acompanhamento
      setTimeout(() => {
        navigate('/tracking');
      }, 2000);
      
    } catch (error) {
      toast.error('Erro ao processar pedido');
    } finally {
      setIsLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">
          <h1 className="bruno-text-gradient mb-4">Carrinho Vazio</h1>
          <p className="text-muted-foreground mb-6">
            Adicione alguns produtos deliciosos ao seu carrinho antes de finalizar o pedido.
          </p>
          <Button onClick={() => navigate('/')} className="bruno-gradient text-white">
            Ir para o Cardápio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/cart')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Carrinho
        </Button>
        <h1 className="bruno-text-gradient">Finalizar Pedido</h1>
        <p className="text-muted-foreground">
          Preencha seus dados para confirmar o pedido
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome Completo *</label>
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  value={customerData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email *</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={customerData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Telefone *</label>
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={customerData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Endereço Completo *</label>
                <Input
                  type="text"
                  placeholder="Rua, número, complemento"
                  value={customerData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Bairro *</label>
                <Input
                  type="text"
                  placeholder="Nome do bairro"
                  value={customerData.neighborhood}
                  onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Observações</label>
                <Textarea
                  placeholder="Informações adicionais (opcional)"
                  value={customerData.additionalInfo}
                  onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bruno-gradient text-white hover:opacity-90"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {isLoading ? 'Processando...' : 'Enviar Pedido via WhatsApp'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resumo do Pedido */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.map((item) => {
              const price = item.product.isPromotion ? item.product.promotionPrice || item.product.price : item.product.price;
              return (
                <div key={item.product.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity}x R$ {price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-medium">
                    R$ {(price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
            
            <Separator />
            
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">R$ {total.toFixed(2)}</span>
            </div>

            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Como funciona?
              </h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>1. Preencha seus dados</p>
                <p>2. Clique em "Enviar via WhatsApp"</p>
                <p>3. Confirme o pedido no WhatsApp</p>
                <p>4. Pague via PIX quando confirmado</p>
                <p>5. Retire na loja quando estiver pronto</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};