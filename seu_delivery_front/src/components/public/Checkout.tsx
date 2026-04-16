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
import { ArrowLeft, MessageCircle, User, Mail, Phone, MapPin, Users, Clock, AlertCircle, RefreshCw, Copy, CheckCheck } from 'lucide-react';
import { useApp } from '../../App';
import { toast } from 'sonner';
import { api } from '../../api';
import { useCartExpiration } from '../../hooks/useCartExpiration';

interface CustomerData {
  id: number
  name: string;
  email: string;
  phone: string;
  address: string;
  order_number: string;
  neighborhood: string;
  additionalInfo?: string;
}

export const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart, refreshProducts, getAvailableStock } = useApp();
  const hasOutOfStock = cart.some(item => {
    const stock = getAvailableStock(item.product.id);
    return stock === 0;
  });
  const { currentStatus, startCheckoutExpiration, clearAllExpirationItems, CHECKOUT_EXPIRATION_MINUTES } = useCartExpiration();
  const [isLoading, setIsLoading] = useState(false);
  const [isExistingCustomerModalOpen, setIsExistingCustomerModalOpen] = useState(false);
  const [customerContact, setCustomerContact] = useState('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [searchByPhone, setSearchByPhone] = useState(false); // true = telefone, false = email
  const [foundCustomerData, setFoundCustomerData] = useState<any>(null);
  const [isConfirmCustomerModalOpen, setIsConfirmCustomerModalOpen] = useState(false);
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [deliveryFeeAvailable, setDeliveryFeeAvailable] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixData, setPixData] = useState<{ pix_key: string; pix_copy_paste: string; total_amount: number; order_id: number } | null>(null);
  const [pixKeyCopied, setPixKeyCopied] = useState(false);

  // Buscar taxa de entrega do motociclista ativo com menor preço
  useEffect(() => {
    const fetchDeliveryFee = async () => {
      try {
        const res = await fetch('/api/motorcyclists/active-delivery-fee');
        if (res.ok) {
          const data = await res.json();
          setDeliveryFeeAvailable(data.available);
          setDeliveryFee(data.available ? data.fee : null);
        }
      } catch {
        // sem motociclista ativo, não exibir taxa
      }
    };
    fetchDeliveryFee();
  }, []);

  const [customerData, setCustomerData] = useState<CustomerData>({
    id: 0,  
    name: '',
    email: '',
    phone: '',
    address: '',
    order_number: '',
    neighborhood: '',
    additionalInfo: ''
  });

  // Estado para modal de confirmação do pedido
  const [showOrderConfirmationModal, setShowOrderConfirmationModal] = useState(false);

  // Escolhas de calda vindas do Cart (salvas no localStorage)
  const [syrupChoices] = useState<{ [productId: string]: string }>(() => {
    try { return JSON.parse(localStorage.getItem('syrup_choices') || '{}'); } catch { return {}; }
  });

  // Função para criar pedido
  const createOrder = async (customerData: CustomerData, cart: any[], total: number) => {
    try {
      // Obter session ID do localStorage
      const sessionId = localStorage.getItem('bruno_session_id') || '';
      
      // Obter filial selecionada
      const savedBranch = localStorage.getItem('selected_branch');
      if (!savedBranch) {
        toast.error('Por favor, selecione uma filial antes de finalizar o pedido');
        navigate('/');
        return;
      }
      
      const selectedBranch = JSON.parse(savedBranch);
      
      // Validar se tem ID da filial
      if (!selectedBranch?.id) {
        toast.error('Filial inválida. Por favor, selecione novamente.');
        navigate('/');
        return;
      }
      
      console.log('📍 Filial selecionada para checkout:', selectedBranch);
      
      // Validar estrutura do carrinho
      const validatedItems = cart.filter(item => item?.product?.id).map(item => {
        const price = item.product.isPromotion ? item.product.promotionPrice || item.product.price : item.product.price;
        return {
          product_id: item.product.id,
          product_name: item.product.name,
          unit_price: price,
          quantity: item.quantity,
          total_price: price * item.quantity
        };
      });

      if (validatedItems.length === 0) {
        throw new Error('Carrinho vazio ou itens inválidos');
      }

      // Montar nota de caldas escolhidas pelo cliente
      const syrupNotes: string[] = [];

      // Calda do combo (chave 'combo')
      const comboEligibleInCart = cart.filter(item => item.quantity >= 1);
      const comboPairsInCheckout = Math.floor(comboEligibleInCart.length / 2);
      if (comboPairsInCheckout > 0) {
        const comboChoice = syrupChoices['combo'];
        const comboNames = comboEligibleInCart.slice(0, comboPairsInCheckout * 2).map(i => i.product.name).join(' + ');
        if (comboChoice && comboChoice !== 'Sem calda') {
          syrupNotes.push(`Combo (${comboNames}): calda de ${comboChoice}`);
        } else if (comboChoice === 'Sem calda') {
          syrupNotes.push(`Combo (${comboNames}): sem calda`);
        } else {
          syrupNotes.push(`Combo (${comboNames}): calda não informada`);
        }
      }

      // Calda dos produtos individuais (fora do combo)
      const comboProductIdsInCheckout = new Set(
        comboEligibleInCart.slice(0, comboPairsInCheckout * 2).map(i => i.product.id)
      );
      cart
        .filter(item => !comboProductIdsInCheckout.has(item.product.id))
        .forEach(item => {
          const choice = syrupChoices[item.product.id];
          if (choice && choice !== 'Sem calda') {
            syrupNotes.push(`${item.product.name}: calda de ${choice}`);
          } else if (choice === 'Sem calda') {
            syrupNotes.push(`${item.product.name}: sem calda`);
          } else {
            syrupNotes.push(`${item.product.name}: calda não informada`);
          }
        });

      const syrupObservation = syrupNotes.length > 0
        ? `\n\nCaldas disponíveis:\n${syrupNotes.join('\n')}`
        : '';

      const orderData = {
        session_id: sessionId,
        branch_id: selectedBranch.id,
        customer_name: customerData.name,
        customer_email: customerData.email,
        customer_phone: customerData.phone,
        customer_address: `${customerData.address}, ${customerData.neighborhood}`,
        address_street: customerData.address,
        address_neighborhood: customerData.neighborhood,
        observations: (customerData.additionalInfo || '') + syrupObservation,
        items: validatedItems
      };

      const response = await api.createOrderPixSimples(orderData);

      if (response?.order_id) {
        setCustomerData(prev => ({ ...prev, id: response.order_id }));
        // Exibir modal do QR Code PIX
        setPixData({
          pix_key: response.pix_key,
          pix_copy_paste: response.pix_copy_paste || response.pix_key,
          total_amount: response.total_amount,
          order_id: response.order_id,
        });
        setPixModalOpen(true);
        // clearCart() é chamado ao fechar/confirmar o modal
      }

      return response?.order_id || Date.now().toString();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      // Tratar erro de estoque insuficiente ou carrinho expirado
      if (error instanceof Error) {
        if (error.message.includes('Carrinho vazio ou expirado')) {
          clearCart();
          await refreshProducts();
          toast.error('⏰ Seu carrinho expirou ou algum produto ficou sem estoque. Revise seu pedido!', {
            duration: 6000,
          });
          setTimeout(() => {
            navigate('/');
          }, 2000);
          throw new Error('Carrinho expirado - redirecionando para o cardápio');
        }
        if (error.message.includes('Estoque insuficiente')) {
          clearCart();
          await refreshProducts();
          toast.error('❌ Um ou mais produtos do seu carrinho ficaram sem estoque. Seu carrinho foi limpo.', {
            duration: 6000,
          });
          setTimeout(() => {
            navigate('/');
          }, 2000);
          throw new Error('Estoque insuficiente - redirecionando para o cardápio');
        }
      }
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

  // Mesma lógica de combo do Cart
  const _distinctProducts = cart.filter(item => item.quantity >= 1);
  const _comboPairs = Math.floor(_distinctProducts.length / 2);
  const _comboProductIds = new Set(_distinctProducts.slice(0, _comboPairs * 2).map(item => item.product.id));

  const total = cart.reduce((sum, item) => {
    const isComboItem = _comboProductIds.has(item.product.id);
    const price = isComboItem && item.product.two_flavor_price
      ? Number(item.product.two_flavor_price)
      : item.product.isPromotion && item.product.promotionPrice
        ? item.product.promotionPrice
        : item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const totalWithDelivery = total + (deliveryFeeAvailable && deliveryFee !== null ? deliveryFee : 0);

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
      const contactToSend = customerContact; // já está formatado
      const response = await api.getCustomerLastOrder(contactToSend);
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
    if (foundCustomerData) {
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
        
        return newData;
      });
      
      toast.success('✅ Dados do cliente preenchidos com sucesso! Verifique os campos abaixo.');
      setIsConfirmCustomerModalOpen(false);
      setFoundCustomerData(null);
      setCustomerContact('');
      // Resetar para telefone sempre, já que só suportamos telefone
    }
  };

  const handleRejectCustomer = () => {
    setIsConfirmCustomerModalOpen(false);
    setFoundCustomerData(null);
    setIsExistingCustomerModalOpen(true); // Volta para o modal de busca
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    if (cart.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    // Validação: impedir finalizar se algum item está sem estoque
    if (hasOutOfStock) {
      toast.error('Um ou mais itens do seu carrinho estão sem estoque. Remova-os para finalizar o pedido.');
      return;
    }

    // Validação básica
    if (!customerData.name || !customerData.phone || !customerData.address || !customerData.neighborhood) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      await createOrder(customerData, cart, totalWithDelivery);
      // Modal PIX é aberto dentro de createOrder
    } catch (error) {
      if (error instanceof Error && error.message.includes('Carrinho expirado')) {
        // Erro já tratado na função createOrder
        return;
      }
      toast.error('Erro ao processar pedido. Verifique seus dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Modal PIX renderizado ANTES do guard de carrinho vazio para não ser desmontado
  const pixModal = (
    <Dialog open={pixModalOpen} onOpenChange={(open: boolean) => { if (!open) { clearCart(); setPixModalOpen(false); navigate('/tracking'); } }}>
      <DialogContent
        className="w-[92vw] max-w-[340px] rounded-2xl overflow-hidden"
        style={{ padding: '16px', gap: '12px', maxHeight: '90dvh', overflowY: 'auto' }}
      >
        <DialogHeader style={{ gap: '2px' }}>
          <DialogTitle className="text-center text-base font-bold">Pague via PIX 🎉</DialogTitle>
          <DialogDescription className="text-center text-xs">
            Pedido #{pixData?.order_id} — escaneie ou copie a chave.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center" style={{ gap: '10px' }}>
          {/* QR Code */}
          {pixData && (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pixData.pix_copy_paste)}&size=160x160`}
              alt="QR Code PIX"
              className="rounded-lg border p-1"
              style={{ width: 'min(150px, 40vw)', height: 'min(150px, 40vw)' }}
            />
          )}

          {/* Valor */}
          <p className="text-xl font-bold text-orange-600 leading-none">
            R$ {pixData?.total_amount.toFixed(2).replace('.', ',')}
          </p>

          {/* Botão copiar */}
          <Button
            variant={pixKeyCopied ? 'default' : 'outline'}
            className={`w-full h-11 text-sm font-semibold transition-all ${pixKeyCopied ? 'bg-green-600 text-white' : 'border-orange-400 text-orange-600 hover:bg-orange-50'}`}
            onClick={() => {
              if (pixData) {
                navigator.clipboard.writeText(pixData.pix_copy_paste);
                setPixKeyCopied(true);
                setTimeout(() => {
                  const msg = encodeURIComponent(
                    `Olá! Efetuei o pagamento do pedido #${pixData.order_id} no valor de R$ ${pixData.total_amount.toFixed(2).replace('.', ',')}. Segue o comprovante.`
                  );
                  window.open(`https://wa.me/5573991033655?text=${msg}`, '_blank');
                  clearCart();
                  setPixModalOpen(false);
                  navigate('/tracking');
                }, 2000);
              }
            }}
          >
            {pixKeyCopied
              ? <><CheckCheck className="h-4 w-4 mr-2" />Copiado! Abrindo WhatsApp...</>
              : <><Copy className="h-4 w-4 mr-2" />Copiar código PIX</>
            }
          </Button>

          {/* Chave resumida */}
          <p className="text-[10px] text-muted-foreground text-center w-full" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Chave: {pixData?.pix_key}
          </p>

          <p className="text-[10px] text-muted-foreground text-center">
            Após copiar, abriremos o WhatsApp para enviar o comprovante.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (cart.length === 0 && !pixModalOpen) {
    return (
      <>
        {pixModal}
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
      </>
    );
  }

  return (
    <div className="checkout-container">
      {pixModal}

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

      {/* Alerta de Tempo Limite do Carrinho */}
      <Alert className="mb-6 border-2 border-blue-500 bg-blue-50">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertDescription className="font-medium text-blue-800">
          ⏰ <strong>Atenção:</strong> Você tem apenas <strong>5 minutos</strong> para finalizar sua compra após adicionar itens ao carrinho. 
          Depois desse tempo, o carrinho será limpo automaticamente e você precisará selecionar os produtos novamente.
        </AlertDescription>
      </Alert>

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
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={customerData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    
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
                {isLoading ? 'Processando...' : 'Pague seu pedido aqui'}
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
            {(() => {
              // Mesma lógica de combo do Cart
              const distinctProducts = cart.filter(item => item.quantity >= 1);
              const comboPairs = Math.floor(distinctProducts.length / 2);
              const hasCombo = comboPairs > 0;
              const comboProductIds = new Set(
                distinctProducts.slice(0, comboPairs * 2).map(item => item.product.id)
              );
              return (
                <>
                  {hasCombo && (
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                      <span>🎉</span>
                      <p className="text-sm font-semibold text-orange-800">Combo 2 Sabores ativo!</p>
                    </div>
                  )}
                  {cart.map((item) => {
                    const isComboItem = comboProductIds.has(item.product.id);
                    const price = isComboItem && item.product.two_flavor_price
                      ? Number(item.product.two_flavor_price)
                      : item.product.isPromotion && item.product.promotionPrice
                        ? item.product.promotionPrice
                        : item.product.price;
                    return (
                      <div key={item.product.id} className="space-y-1">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium flex items-center gap-2">
                              {item.product.name}
                              {isComboItem && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">🎉 Combo</span>}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity}x R$ {price.toFixed(2)}
                              {isComboItem && item.product.two_flavor_price && (
                                <span className="line-through text-gray-400 ml-2">R$ {item.product.price.toFixed(2)}</span>
                              )}
                            </p>
                          </div>
                          <span className="font-medium">
                            R$ {(price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                  {/* Calda escolhida no carrinho — somente leitura */}
                  {isComboItem ? (
                    // Combo: mostra calda única apenas no 1º item do combo
                    distinctProducts.indexOf(item) === 0 ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-amber-700 font-medium">🍫 Calda do combo:</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          syrupChoices['combo'] ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {syrupChoices['combo'] || 'Não informada'}
                        </span>
                      </div>
                    ) : null
                  ) : (
                    // Produto avulso
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-amber-700 font-medium">🍫 Calda:</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        syrupChoices[item.product.id] ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {syrupChoices[item.product.id] || 'Não informada'}
                      </span>
                    </div>
                  )}
                      </div>
                    );
                  })}
                </>
              );
            })()}
            <Separator />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>
            {deliveryFeeAvailable && deliveryFee !== null && (
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>Taxa de entrega (motoboy)</span>
                <span className="text-orange-600 font-medium">+ R$ {deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">R$ {totalWithDelivery.toFixed(2)}</span>
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
                Digite apenas números. A máscara será aplicada automaticamente.
              </p>
            </div>
          </div>
          <div className="w-full flex justify-between gap-3 pt-4 border-t bg-gray-50 p-4 -mx-6 -mb-6 mt-4">
            <button 
              type="button" 
              className="flex-1 px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 font-semibold"
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
              className={`flex-1 min-w-[140px] px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 font-semibold transition-all ${isSearchingCustomer || !customerContact.trim() ? 'opacity-60 cursor-not-allowed text-gray-500' : 'text-gray-700'}`}
              onClick={handleSearchExistingCustomer}
              disabled={isSearchingCustomer || !customerContact.trim()}
            >
              <span className="whitespace-nowrap">
                {isSearchingCustomer ? '⏳ Buscando...' : '🔍 Buscar Dados'}
              </span>
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
          <DialogFooter className="flex-col gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleRejectCustomer}
              className="w-full sm:w-auto border-red-200 text-red-700 hover:bg-red-50"
            >
              ❌ buscar novamente
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirmCustomer}
              className="w-full border-green-200 text-green-700 hover:bg-green-50 flex items-center justify-center gap-2 min-w-[200px] px-4 py-2 text-base font-semibold"
              style={{ whiteSpace: 'normal', wordBreak: 'keep-all' }}
            >
              <span className="text-lg">✅</span>
              <span>Sim, preencher formulário</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
