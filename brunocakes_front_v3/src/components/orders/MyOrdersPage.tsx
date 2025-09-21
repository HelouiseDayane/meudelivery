import { useState } from 'react';
import { getProductImageUrl } from '../../api';
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
import { toast } from 'sonner@2.0.3';

// Mock client orders data
const mockClientOrders = [
  {
    id: 'ORD-105',
    items: [
      { name: 'Brigadeiro Premium', quantity: 6, price: 15.00, image: 'https://images.unsplash.com/photo-1729875751095-71c051759eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmF6aWxpYW4lMjBicmlnYWRlaXJvJTIwY2hvY29sYXRlJTIwdHJ1ZmZsZXN8ZW58MXx8fHwxNzU3NjE2MjQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' },
      { name: 'Trufa de Maracujá', quantity: 3, price: 18.00, image: 'https://images.unsplash.com/photo-1729875751095-71c051759eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmF6aWxpYW4lMjBicmlnYWRlaXJvJTIwY2hvY29sYXRlJTIwdHJ1ZmZsZXN8ZW58MXx8fHwxNzU3NjE2MjQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' }
    ],
    total: 144.00,
    status: 'shipping',
    createdAt: '2024-01-15T10:30:00',
    estimatedDelivery: '2024-01-15T16:00:00',
    trackingCode: 'SW123456789BR',
    paymentMethod: 'PIX',
    deliveryAddress: 'Rua das Flores, 123 - Vila Madalena, São Paulo',
    progress: 75
  },
  {
    id: 'ORD-104',
    items: [
      { name: 'Bolo Red Velvet', quantity: 1, price: 89.90, image: 'https://images.unsplash.com/photo-1607257882338-70f7dd2ae344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpY2lvdXMlMjBjaG9jb2xhdGUlMjBkZXNzZXJ0JTIwY2FrZXxlbnwxfHx8fDE3NTc2MTYyMzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' }
    ],
    total: 89.90,
    status: 'preparing',
    createdAt: '2024-01-15T11:15:00',
    estimatedDelivery: '2024-01-15T17:30:00',
    trackingCode: 'SW123456790BR',
    paymentMethod: 'Cartão de Crédito',
    deliveryAddress: 'Rua das Flores, 123 - Vila Madalena, São Paulo',
    progress: 50
  },
  {
    id: 'ORD-103',
    items: [
      { name: 'Cupcakes Coloridos', quantity: 2, price: 48.00, image: 'https://images.unsplash.com/photo-1615557509870-98972c5e1396?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2VldCUyMGNvbG9yZnVsJTIwY3VwY2FrZXMlMjBkZXNzZXJ0fGVufDF8fHx8MTc1NzYxNjIzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' }
    ],
    total: 96.00,
    status: 'delivered',
    createdAt: '2024-01-13T09:00:00',
    estimatedDelivery: '2024-01-13T14:00:00',
    deliveredAt: '2024-01-13T13:45:00',
    trackingCode: 'SW123456791BR',
    paymentMethod: 'PIX',
    deliveryAddress: 'Rua das Flores, 123 - Vila Madalena, São Paulo',
    progress: 100,
    canReview: true
  },
  {
    id: 'ORD-102',
    items: [
      { name: 'Cheesecake de Morango', quantity: 1, price: 65.00, image: 'https://images.unsplash.com/photo-1641424795123-9f12d697219d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2hlZXNlY2FrZSUyMGRlc3NlcnR8ZW58MXx8fHwxNzU3NjE2MjQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral' }
    ],
    total: 65.00,
    status: 'delivered',
    createdAt: '2024-01-10T15:20:00',
    estimatedDelivery: '2024-01-10T19:00:00',
    deliveredAt: '2024-01-10T18:30:00',
    trackingCode: 'SW123456792BR',
    paymentMethod: 'Dinheiro',
    deliveryAddress: 'Rua das Flores, 123 - Vila Madalena, São Paulo',
    progress: 100,
    reviewed: true,
    rating: 5
  }
];

const statusConfig = {
  pending: { label: 'Aguardando Confirmação', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  preparing: { label: 'Preparando seu Pedido', color: 'bg-blue-100 text-blue-800', icon: Package },
  shipping: { label: 'A Caminho', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle }
};

export function MyOrdersPage() {
  const [selectedTab, setSelectedTab] = useState<'active' | 'completed'>('active');

  const activeOrders = mockClientOrders.filter(order => ['pending', 'preparing', 'shipping'].includes(order.status));
  const completedOrders = mockClientOrders.filter(order => order.status === 'delivered');

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
        {selectedTab === 'active' && (
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
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <img 
                          src={getProductImageUrl(item.image)} 
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
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                        <img 
                          src={getProductImageUrl(item.image)} 
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
      {selectedTab === 'active' && activeOrders.length === 0 && (
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

      {selectedTab === 'completed' && completedOrders.length === 0 && (
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