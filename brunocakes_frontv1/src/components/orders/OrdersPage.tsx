import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  User,
  Phone,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Mock orders data
const mockOrders = [
  {
    id: 'ORD-001',
    customer: {
      name: 'Maria Silva',
      email: 'maria@email.com',
      phone: '(11) 99999-1234',
      avatar: '',
      address: 'Rua das Flores, 123 - Vila Madalena, São Paulo'
    },
    items: [
      { name: 'Brigadeiro Premium', quantity: 6, price: 15.00 },
      { name: 'Trufa de Maracujá', quantity: 3, price: 18.00 }
    ],
    total: 144.00,
    status: 'pending',
    createdAt: '2024-01-15T10:30:00',
    estimatedDelivery: '2024-01-15T16:00:00',
    paymentMethod: 'PIX',
    notes: 'Entregar na portaria'
  },
  {
    id: 'ORD-002',
    customer: {
      name: 'João Santos',
      email: 'joao@email.com',
      phone: '(11) 98888-5678',
      avatar: '',
      address: 'Av. Paulista, 1500 - Bela Vista, São Paulo'
    },
    items: [
      { name: 'Bolo Red Velvet', quantity: 1, price: 89.90 }
    ],
    total: 89.90,
    status: 'preparing',
    createdAt: '2024-01-15T11:15:00',
    estimatedDelivery: '2024-01-15T17:30:00',
    paymentMethod: 'Cartão de Crédito',
    notes: ''
  },
  {
    id: 'ORD-003',
    customer: {
      name: 'Ana Costa',
      email: 'ana@email.com',
      phone: '(11) 97777-9012',
      avatar: '',
      address: 'Rua Oscar Freire, 789 - Jardins, São Paulo'
    },
    items: [
      { name: 'Cupcakes Coloridos', quantity: 2, price: 48.00 },
      { name: 'Cheesecake de Morango', quantity: 1, price: 65.00 }
    ],
    total: 161.00,
    status: 'shipping',
    createdAt: '2024-01-15T09:00:00',
    estimatedDelivery: '2024-01-15T14:00:00',
    paymentMethod: 'PIX',
    notes: 'Aniversário - favor caprichar na apresentação'
  },
  {
    id: 'ORD-004',
    customer: {
      name: 'Carlos Mendes',
      email: 'carlos@email.com',
      phone: '(11) 96666-3456',
      avatar: '',
      address: 'Rua Augusta, 456 - Consolação, São Paulo'
    },
    items: [
      { name: 'Brigadeiro Premium', quantity: 12, price: 15.00 }
    ],
    total: 180.00,
    status: 'delivered',
    createdAt: '2024-01-14T16:20:00',
    estimatedDelivery: '2024-01-14T20:00:00',
    paymentMethod: 'Dinheiro',
    notes: ''
  }
];

const statusConfig = {
  pending: { label: 'Aguardando', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  preparing: { label: 'Preparando', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  shipping: { label: 'A Caminho', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle }
};

export function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    toast.success('Status do pedido atualizado!');
    // Here you would update the order status in your state/API
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl">Gerenciar Pedidos</h1>
        <p className="text-muted-foreground">
          Acompanhe e gerencie todos os pedidos da loja
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Aguardando</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="shipping">A Caminho</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map(order => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle className="text-lg">{order.id}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  {getStatusBadge(order.status)}
                </div>
                
                <div className="text-right">
                  <p className="text-lg">R$ {order.total.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">{order.paymentMethod}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar>
                  <AvatarImage src={order.customer.avatar} />
                  <AvatarFallback>
                    {order.customer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.customer.address}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm mb-2">Itens do Pedido:</h4>
                <div className="space-y-1">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span>R$ {(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {order.notes && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Observações:</strong> {order.notes}
                  </p>
                </div>
              )}

              {/* Delivery Time */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Entrega prevista: {new Date(order.estimatedDelivery).toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedOrder(order)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Detalhes
                </Button>
                
                {order.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Confirmar Pedido
                  </Button>
                )}
                
                {order.status === 'preparing' && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'shipping')}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    Enviar
                  </Button>
                )}
                
                {order.status === 'shipping' && (
                  <Button
                    size="sm"
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Marcar Entregue
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg mb-2">Nenhum pedido encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou termos de busca
          </p>
        </div>
      )}
    </div>
  );
}