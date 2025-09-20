import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { ArrowLeft, MessageCircle, User, Mail, Phone, MapPin, Users, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../App';
import { toast } from 'sonner';
import api from '../../api';
import { useCartExpiration } from '../../hooks/useCartExpiration';

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
  const { cart, clearCart, refreshProducts } = useApp();
  const { currentStatus, startCheckoutExpiration, clearAllExpirationItems, CHECKOUT_EXPIRATION_MINUTES } = useCartExpiration();
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingCustomerModalOpen, setIsExistingCustomerModalOpen] = useState(false);
  const [customerContact, setCustomerContact] = useState('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [searchByPhone, setSearchByPhone] = useState(false); // true = telefone, false = email
  const [foundCustomerData, setFoundCustomerData] = useState<any>(null);
  const [isConfirmCustomerModalOpen, setIsConfirmCustomerModalOpen] = useState(false);
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);
  
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    neighborhood: '',
    additionalInfo: ''
  });

  // Função para criar pedido
  const createOrder = async (customerData: CustomerData, cart: any[], total: number) => {
    try {
      // Obter session ID do localStorage
      const sessionId = localStorage.getItem('bruno_session_id') || '';
      
      const orderData = {
        session_id: sessionId,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        customer_address: `${customerData.address}, ${customerData.neighborhood}`,
        address_street: customerData.address,
        address_neighborhood: customerData.neighborhood,
        observations: customerData.additionalInfo || '',
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity
        }))
      };

      const response = await api.createOrder(orderData);
      
      // Iniciar timer de expiração do checkout
      if (response?.id) {
        startCheckoutExpiration(response.id.toString(), sessionId);
      }
      
      return response?.id || Date.now().toString();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  };

  // Função para atualizar estoque
  const handleRefreshStock = async () => {
    setIsRefreshingStock(true);
    try {
      await refreshProducts();
      toast.success('Estoque atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar estoque');
    } finally {
      setIsRefreshingStock(false);
    }
  };

  // Limpar expiração quando sair do checkout
  useEffect(() => {
    return () => {
      if (cart.length === 0) {
        clearAllExpirationItems();
      }
    };
  }, [cart.length, clearAllExpirationItems]);

  // Debug - mostra se o botão deve estar habilitado
  useEffect(() => {
    console.log('isSearchingCustomer:', isSearchingCustomer);
    console.log('customerContact:', customerContact);
    console.log('customerContact.trim():', customerContact.trim());
    console.log('Botão habilitado:', !isSearchingCustomer && customerContact.trim());
  }, [isSearchingCustomer, customerContact]);

  const total = cart.reduce((sum, item) => {
    const price = item.product.isPromotion ? item.product.promotionPrice || item.product.price : item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  // Função para formatar telefone
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

  // Função para lidar com mudança no campo de contato
  const handleContactChange = (value: string) => {
    // Aplicar máscara de telefone sempre
    const formatted = formatPhoneInput(value);
    setCustomerContact(formatted);
  };

  const handleSearchExistingCustomer = async () => {
    if (!customerContact.trim()) {
      toast.error('Por favor, digite um telefone.');
      return;
    }

    // Validação básica para telefone
    const digits = customerContact.replace(/\D/g, '');
    if (digits.length < 10) {
      toast.error('Por favor, digite um telefone válido com pelo menos 10 dígitos.');
      return;
    }

    setIsSearchingCustomer(true);
    try {
      // Enviar apenas os dígitos do telefone
      const contactToSend = customerContact.replace(/\D/g, '');
      
      console.log('Enviando para API:', contactToSend);
      console.log('Tipo de busca: telefone');
      
      const response = await api.getCustomerLastOrder(contactToSend);
      console.log('Resposta da API:', response);
      
      if (response && response.customer_name) {
        // Salva os dados encontrados para confirmação
        setFoundCustomerData(response);
        setIsConfirmCustomerModalOpen(true);
        setIsExistingCustomerModalOpen(false);
      } else {
        // Cliente não encontrado - mantém o modal aberto para nova tentativa
        toast.error('❌ Cliente não encontrado. Verifique o telefone informado e tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao buscar dados do cliente:', error);
      toast.error('Cliente não encontrado ou erro no servidor. Tente novamente.');
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  const handleConfirmCustomer = () => {
    console.log('handleConfirmCustomer chamado');
    console.log('foundCustomerData:', foundCustomerData);
    
    if (foundCustomerData) {
      console.log('Preenchendo dados do formulário...');
      
      // Formatar telefone com máscara antes de setar
      const phoneNumber = foundCustomerData.customer_phone || '';
      const formattedPhone = formatPhoneInput(phoneNumber);
      
      // Preenche os dados do formulário
      setCustomerData((prev: CustomerData) => {
        const newData = {
          ...prev,
          name: foundCustomerData.customer_name || '',
          email: foundCustomerData.customer_email || '',
          phone: formattedPhone, // Usar telefone formatado
          address: foundCustomerData.address_street 
            ? `${foundCustomerData.address_street}${foundCustomerData.address_number ? ', ' + foundCustomerData.address_number : ''}`
            : '',
          neighborhood: foundCustomerData.address_neighborhood || ''
        };
        
        console.log('Dados que serão setados:', newData);
        return newData;
      });
      
      toast.success('✅ Dados do cliente preenchidos com sucesso! Verifique os campos abaixo.');
      setIsConfirmCustomerModalOpen(false);
      setFoundCustomerData(null);
      setCustomerContact('');
      // Resetar para telefone sempre, já que só suportamos telefone
    } else {
      console.log('foundCustomerData é null ou undefined');
    }
  };

  const handleRejectCustomer = () => {
    setIsConfirmCustomerModalOpen(false);
    setFoundCustomerData(null);
    setIsExistingCustomerModalOpen(true); // Volta para o modal de busca
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

      {/* Checkout Expiration Timer */}
      {currentStatus && (
        <Alert className={`mb-6 border-2 ${
          currentStatus.isCritical ? 'border-red-500 bg-red-50' :
          currentStatus.isWarning ? 'border-yellow-500 bg-yellow-50' :
          'border-orange-500 bg-orange-50'
        }`}>
          <div className="flex items-center gap-2">
            {currentStatus.isCritical ? (
              <AlertCircle className="h-4 w-4 text-red-600" />
            ) : (
              <Clock className="h-4 w-4 text-orange-600" />
            )}
            <AlertDescription className={`font-medium ${
              currentStatus.isCritical ? 'text-red-800' :
              currentStatus.isWarning ? 'text-yellow-800' :
              'text-orange-800'
            }`}>
              {currentStatus.isCritical ? (
                <>🚨 Checkout expira em {currentStatus.formattedTime}! Complete agora ou seus produtos voltarão ao estoque.</>
              ) : currentStatus.isWarning ? (
                <>⚠️ Checkout expira em {currentStatus.formattedTime}. Complete sua compra!</>
              ) : (
                <>⏰ Tempo restante para finalizar: {currentStatus.formattedTime} (Total: {CHECKOUT_EXPIRATION_MINUTES} min)</>
              )}
            </AlertDescription>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStock}
              disabled={isRefreshingStock}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingStock ? 'animate-spin' : ''}`} />
              {isRefreshingStock ? 'Atualizando...' : 'Atualizar Estoque'}
            </Button>
          </div>
        </Alert>
      )}

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
            {/* Botão Já sou cliente */}
            <div className="flex justify-center mb-6">
              <Button 
                type="button" 
                variant="outline" 
                className="flex items-center gap-2 bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => setIsExistingCustomerModalOpen(true)}
              >
                <Users className="h-4 w-4" />
                👤 Já sou cliente
              </Button>
            </div>
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
                    onChange={(e) => handleInputChange('phone', formatPhoneInput(e.target.value))}
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

      {/* Modal para buscar cliente existente */}
      <Dialog open={isExistingCustomerModalOpen} onOpenChange={setIsExistingCustomerModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto w-full">
          <DialogHeader>
            <DialogTitle>Buscar dados do cliente</DialogTitle>
            <DialogDescription>
              Digite o telefone do cliente para buscar os dados de pedidos anteriores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="customer-contact"
                type="tel"
                placeholder="(84) 99999-9999"
                value={customerContact}
                onChange={(e) => handleContactChange(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Digite o telefone no formato (84) 99999-9999. A máscara será aplicada automaticamente.
              </p>
            </div>
          </div>
          
          {/* Footer com botões */}
          <div className="w-full flex justify-between gap-3 pt-4 border-t bg-gray-50 p-4 -mx-6 -mb-6 mt-4">
            <button 
              type="button" 
              className="flex-1 px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50"
              onClick={() => {
                setIsExistingCustomerModalOpen(false);
                setCustomerContact('');
                setSearchByPhone(false);
              }}
            >
              ❌ Cancelar
            </button>
            <button 
              type="button" 
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
              onClick={handleSearchExistingCustomer}
              disabled={isSearchingCustomer || !customerContact.trim()}
            >
              {isSearchingCustomer ? '⏳ Buscando...' : '🔍 Buscar Dados'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação dos Dados do Cliente */}
      <Dialog open={isConfirmCustomerModalOpen} onOpenChange={setIsConfirmCustomerModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              ✅ Cliente encontrado!
            </DialogTitle>
            <DialogDescription>
              Encontramos os dados deste cliente. Deseja preencher o formulário automaticamente com essas informações?
            </DialogDescription>
          </DialogHeader>
          
          {foundCustomerData && (
            <div className="space-y-4 py-4 border rounded-lg p-4 bg-green-50">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-sm font-medium text-green-800">Nome:</Label>
                  <p className="text-sm font-semibold text-green-900">{foundCustomerData.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-green-800">Email:</Label>
                  <p className="text-sm text-green-700">{foundCustomerData.customer_email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-green-800">Telefone:</Label>
                  <p className="text-sm text-green-700">{foundCustomerData.customer_phone}</p>
                </div>
                {foundCustomerData.address_street && (
                  <div>
                    <Label className="text-sm font-medium text-green-800">Endereço:</Label>
                    <p className="text-sm text-green-700">
                      {foundCustomerData.address_street}
                      {foundCustomerData.address_number && `, ${foundCustomerData.address_number}`}
                    </p>
                  </div>
                )}
                {foundCustomerData.address_neighborhood && (
                  <div>
                    <Label className="text-sm font-medium text-green-800">Bairro:</Label>
                    <p className="text-sm text-green-700">{foundCustomerData.address_neighborhood}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleRejectCustomer}
              className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50"
            >
              ❌ Não, buscar novamente
            </Button>
            <Button 
              onClick={handleConfirmCustomer}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              ✅ Sim, preencher formulário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};