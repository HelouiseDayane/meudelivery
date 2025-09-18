import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { QrCode, Copy, Clock, CheckCircle, AlertCircle, CreditCard, ArrowLeft } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { STORE_CONFIG } from '../../api';

export function PixPayment() {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, updateOrderStatus } = useApp();
  const navigate = useNavigate();
  
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired' | 'cancelled'>('pending');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [pixCode, setPixCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const order = orders.find(o => o.id === orderId);

  // Generate mock PIX code and QR code
  useEffect(() => {
    if (order) {
      // Generate a mock PIX code (in production, this would come from payment API)
      const mockPixCode = `00020126580014BR.GOV.BCB.PIX0136${STORE_CONFIG.pixKey}0208${order.id}5204000053039865802BR5925${STORE_CONFIG.name}6009SAO PAULO62070503***6304`;
      setPixCode(mockPixCode);
      
      // Generate QR code URL (mock - in production use real QR code generator)
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mockPixCode)}`);
    }
  }, [order]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setPaymentStatus('expired');
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Mock payment verification (in production, this would check payment status via API)
  useEffect(() => {
    const checkPayment = () => {
      // Simulate random payment success for demo purposes
      // In production, this would be replaced with real payment status checking
      if (Math.random() > 0.98 && paymentStatus === 'pending') { // Very low chance for demo
        setPaymentStatus('paid');
        if (order) {
          updateOrderStatus(order.id, 'confirmed');
        }
        toast.success('Pagamento confirmado! Seu pedido foi enviado para preparação.');
      }
    };

    if (paymentStatus === 'pending') {
      const interval = setInterval(checkPayment, 5000); // Check every 5 seconds
      return () => clearInterval(interval);
    }
  }, [paymentStatus, order, updateOrderStatus]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast.success('Código PIX copiado!');
  };

  const handleManualConfirmation = () => {
    // For demo purposes - simula pagamento confirmado apenas no frontend
    setPaymentStatus('paid');
    toast.success('Pagamento confirmado! Seu pedido foi enviado para preparação.');
  };

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium">Pedido não encontrado</h3>
        <p className="text-muted-foreground mb-6">
          O pedido solicitado não foi encontrado ou não existe
        </p>
        <Button onClick={() => navigate('/menu')}>
          Voltar ao Menu
        </Button>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Aguardando Pagamento</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-green-600 border-green-600">Pago</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expirado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  if (paymentStatus === 'paid') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1>Pagamento Confirmado!</h1>
          <p className="text-muted-foreground">
            Seu pedido foi recebido e está sendo preparado
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 p-4 rounded">
              <h4 className="font-medium text-green-800 mb-2">Seu pedido #{order.id}</h4>
              <p className="text-green-700 text-sm">
                Aguarde a confirmação do vendedor. Você será notificado quando o pedido estiver pronto para retirada.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded">
              <h4 className="font-medium text-blue-800 mb-2">Local de Retirada</h4>
              <div className="text-blue-700 text-sm space-y-1">
                <p className="font-medium">{STORE_CONFIG.name}</p>
                <p>{STORE_CONFIG.address}</p>
                <p>{STORE_CONFIG.workingHours}</p>
                <p>{STORE_CONFIG.phone}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (order?.customer?.email) params.append('email', order.customer.email);
                  if (order?.customer?.phone) params.append('phone', order.customer.phone);
                  navigate(`/orders-lookup?${params.toString()}`);
                }}
                className="flex-1"
              >
                Acompanhar Pedido
              </Button>
              <Button variant="outline" onClick={() => navigate('/menu')} className="flex-1">
                Fazer Novo Pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentStatus === 'expired') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Clock className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1>Pagamento Expirado</h1>
          <p className="text-muted-foreground">
            O tempo para pagamento do pedido #{order.id} expirou
          </p>
        </div>

        <Card>
          <CardContent className="text-center py-6">
            <p className="mb-4">O código PIX expirou. Você pode gerar um novo pedido.</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/cart')}>
                Voltar ao Carrinho
              </Button>
              <Button variant="outline" onClick={() => navigate('/menu')}>
                Novo Pedido
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/checkout')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1>Pagamento PIX</h1>
          <p className="text-muted-foreground">
            Finalize seu pagamento para confirmar o pedido
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pagamento PIX
                </CardTitle>
                {getStatusBadge()}
              </div>
              <CardDescription>
                Escaneie o QR Code ou copie o código PIX
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timer */}
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tempo restante para pagamento
                </p>
              </div>

              {/* QR Code */}
              <div className="text-center">
                <div className="inline-block p-4 bg-white border rounded-lg">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Escaneie com o app do seu banco
                </p>
              </div>

              {/* PIX Code */}
              <div className="space-y-2">
                <Label>Código PIX (Copia e Cola)</Label>
                <div className="flex gap-2">
                  <Input
                    value={pixCode}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button onClick={copyPixCode} size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-muted/50 p-4 rounded text-sm space-y-2">
                <h4 className="font-medium">Como pagar:</h4>
                <ol className="space-y-1 text-muted-foreground">
                  <li>1. Abra o aplicativo do seu banco</li>
                  <li>2. Escolha a opção PIX</li>
                  <li>3. Escaneie o QR Code ou cole o código PIX</li>
                  <li>4. Confirme o pagamento</li>
                </ol>
              </div>

              {/* Demo Button - Remove in production */}
              <div className="border-t pt-4">
                <Button 
                  onClick={handleManualConfirmation}
                  variant="outline" 
                  className="w-full"
                  size="sm"
                >
                  [DEMO] Simular Pagamento Confirmado
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Botão apenas para demonstração
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Resumo do Pedido #{order.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <h4 className="font-medium">Dados do Cliente</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{order.customer.name}</p>
                  <p>{order.customer.phone}</p>
                  <p>{order.customer.email}</p>
                  <p>{order.customer.address}</p>
                  <p>{order.customer.neighborhood}</p>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div className="space-y-3">
                <h4 className="font-medium">Itens do Pedido</h4>
                {order.items.map(item => {
                  const price = item.product.isPromotion && item.product.promotionPrice 
                    ? item.product.promotionPrice 
                    : item.product.price;
                  const itemTotal = price * item.quantity;
                  
                  return (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-muted-foreground">
                          {item.quantity}x {formatPrice(price)}
                        </p>
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
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>

              <Separator />

              {/* Store Info */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                <h4 className="font-medium text-blue-800 mb-2">Retirada na Loja</h4>
                <div className="text-blue-700 text-sm space-y-1">
                  <p className="font-medium">{STORE_CONFIG.name}</p>
                  <p>{STORE_CONFIG.address}</p>
                  <p>{STORE_CONFIG.workingHours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}