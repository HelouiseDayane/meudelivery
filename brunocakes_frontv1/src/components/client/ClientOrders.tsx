import { useApp } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  Package,
  Receipt,
  MapPin,
  Phone
} from 'lucide-react';

export function ClientOrders() {
  const { orders } = useApp();
    // Simulação: pegar email do cliente logado do localStorage (ajuste conforme seu fluxo real)
    const clientEmail = localStorage.getItem('client_email');

  // Filter orders for current user
  const userOrders = orders
  .filter(order => order.customer.email === clientEmail)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pedido Recebido';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto para Entrega';
      case 'delivered': return 'Entregue';
    case 'completed': return 'Entregue';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Receipt className="w-4 h-4" />;
      case 'preparing': return <Clock className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'delivered': return <Truck className="w-4 h-4" />;
    case 'completed': return <Truck className="w-4 h-4" />;
      case 'cancelled': return <Package className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Seu pedido foi recebido e está sendo processado';
      case 'preparing': return 'Nossa equipe está preparando seus itens';
      case 'ready': return 'Seu pedido está pronto e será entregue em breve';
      case 'delivered': return 'Pedido entregue com sucesso';
    case 'completed': return 'Pedido entregue com sucesso';
      case 'cancelled': return 'Este pedido foi cancelado';
      default: return '';
    }
  };

  const getEstimatedTime = (status: string, createdAt: string) => {
    const orderTime = new Date(createdAt);
    const now = new Date();
    const elapsedMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));

    switch (status) {
      case 'pending':
        return 'Tempo estimado: 30-45 minutos';
      case 'preparing':
        const remainingTime = Math.max(0, 45 - elapsedMinutes);
        return `Tempo estimado: ${remainingTime} minutos`;
      case 'ready':
        return 'Saindo para entrega';
      case 'delivered':
    case 'completed':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return '';
    }
  };

  if (userOrders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Você ainda não fez nenhum pedido</h2>
        <p className="text-gray-500 mb-6">Que tal dar uma olhada no nosso cardápio?</p>
        <Button 
          onClick={() => window.location.href = '/menu'}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Ver Cardápio
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-orange-900">Meus Pedidos</h1>
        <p className="text-orange-600">Acompanhe o status dos seus pedidos</p>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {userOrders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            {/* Order Header */}
            <CardHeader className="bg-orange-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span>Pedido #{order.id}</span>
                    <Badge className={getStatusColor(order.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </div>
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-orange-600 mt-1">
                    Feito em {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-xl font-bold text-orange-600">
                    R$ {order.total.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Status Progress */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(order.status)}
                  <div>
                    <p className="font-semibold text-orange-800">{getStatusText(order.status)}</p>
                    <p className="text-sm text-orange-600">{getStatusDescription(order.status)}</p>
                  </div>
                </div>
                {order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'confirmed' && (
                  <p className="text-sm font-medium text-orange-700 mt-2">
                    ⏱️ {getEstimatedTime(order.status, order.createdAt)}
                  </p>
                )}
              </div>

              {/* Order Items */}
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-900">Itens do Pedido</h4>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={item.product.id + '-' + index} className="flex gap-4 p-3 bg-gray-50 rounded-md">
                      <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium">{item.product.name}</h5>
                        <p className="text-sm text-gray-600 mb-1">{item.product.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Quantidade: {item.quantity}</span>
                          <span className="font-semibold">
                            R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão acompanhar pedido */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (order.customer?.email) params.append('email', order.customer.email);
                    if (order.customer?.phone) params.append('phone', order.customer.phone);
                    window.location.href = `/orders-lookup?${params.toString()}`;
                  }}
                >
                  Acompanhar pedido
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}