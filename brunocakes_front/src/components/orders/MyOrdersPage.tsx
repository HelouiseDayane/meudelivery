import { useState, useEffect } from 'react';
import api from '../../api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle,
  Package,
  Star,
  RotateCcw,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Busca email/telefone do cliente do localStorage
const clientEmail = localStorage.getItem('client_email') || '';
const clientPhone = localStorage.getItem('client_phone') || '';

const statusConfig = {
  pending: { label: 'Aguardando Confirmação', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  preparing: { label: 'Preparando seu Pedido', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipping: { label: 'A Caminho', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle }
};


export function MyOrdersPage() {
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        // Busca todos os pedidos e filtra por email/telefone do cliente
        const allOrders = await api.getOrders();
        const filtered = allOrders.filter((order: any) => {
          const emailMatch = clientEmail && order.customer?.email === clientEmail;
          const phoneMatch = clientPhone && order.customer?.phone === clientPhone;
          return emailMatch || phoneMatch;
        });
        setOrders(filtered);
      } catch (err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const activeOrders = orders.filter(order => ['pending', 'preparing', 'shipping'].includes(order.status));
  const completedOrders = orders.filter(order => order.status === 'delivered');

  const handleReorder = (order: any) => {
    // Add items to cart
    order.items.forEach((item: any) => {
      // addToCart logic here
    });
    toast.success('Itens adicionados ao carrinho!');
  };

  const handleReview = (orderId: string) => {
    toast.success('Obrigado pela sua avaliação!');
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getProgressSteps = (status: string) => {
    const steps = [
      { key: 'pending', label: 'Pedido Realizado', completed: true },
      { key: 'preparing', label: 'Preparando', completed: ['preparing', 'shipping', 'delivered'].includes(status) },
      { key: 'shipping', label: 'A Caminho', completed: ['shipping', 'delivered'].includes(status) },
      { key: 'delivered', label: 'Entregue', completed: status === 'delivered' }
    ];
    return steps;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl">Meus Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhe o status de todos os seus pedidos
        </p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <Button
          variant={selectedTab === 'active' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('active')}
          className={selectedTab === 'active' ? 'bg-white shadow-sm' : ''}
        >
          Pedidos Ativos ({activeOrders.length})
        </Button>
        <Button
          variant={selectedTab === 'completed' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setSelectedTab('completed')}
          className={selectedTab === 'completed' ? 'bg-white shadow-sm' : ''}
        >
          Histórico ({completedOrders.length})
        </Button>
      </div>

      {/* Orders Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg mb-2">Carregando pedidos...</h3>
          </div>
        ) : selectedTab === 'active' ? (
          <>
            {activeOrders.map(order => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Pedido realizado em {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Progress Tracker */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progresso do Pedido</span>
                      <span>{order.progress}%</span>
                    </div>
                    <Progress value={order.progress} className="h-2" />
                    
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {getProgressSteps(order.status).map((step, index) => (
                        <div key={step.key} className={`text-center ${step.completed ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span>{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((item: any, index: any) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
                        </div>
                        <p className="text-sm">R$ {(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Order Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p>R$ {order.total.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Previsão de Entrega</p>
                      <p>{new Date(order.estimatedDelivery).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Tracking */}
                  {order.trackingCode && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Código de Rastreamento:</strong> {order.trackingCode}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Contatar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReorder(order)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Pedir Novamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {selectedTab === 'completed' && (
          <>
            {completedOrders.map(order => (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Entregue em {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('pt-BR') : 'Data não disponível'}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-2">
                    {order.items.map((item: any, index: any) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
                        </div>
                        <p className="text-sm">R$ {(item.quantity * item.price).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="text-right">
                    <p className="text-lg">Total: R$ {order.total.toFixed(2)}</p>
                  </div>

                  {/* Rating */}
                  {order.reviewed && order.rating && (
                    <div className="flex items-center gap-1 p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-green-800">Sua avaliação:</span>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < order.rating! ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {order.canReview && !order.reviewed && (
                      <Button 
                        size="sm"
                        onClick={() => handleReview(order.id)}
                        className="bg-orange-500 hover:bg-orange-600"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Avaliar Pedido
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReorder(order)}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Pedir Novamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
  )}
      </div>

      {/* Empty States */}
      {!loading && selectedTab === 'active' && activeOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg mb-2">Nenhum pedido ativo</h3>
          <p className="text-muted-foreground">
            Que tal fazer um novo pedido? Temos doces deliciosos esperando por você!
          </p>
        </div>
      )}

      {!loading && selectedTab === 'completed' && completedOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg mb-2">Nenhum pedido entregue ainda</h3>
          <p className="text-muted-foreground">
            Seus pedidos entregues aparecerão aqui
          </p>
        </div>
      )}
    </div>
  );
}