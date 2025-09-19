import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  Truck, 
  CheckCircle,
  Phone,
  Navigation,
  Calendar,
  Package
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Mock delivery data
const mockDeliveries = [
  {
    id: 'DEL-001',
    orderId: 'ORD-001',
    customer: {
      name: 'Maria Silva',
      phone: '(11) 99999-1234',
      address: 'Rua das Flores, 123 - Vila Madalena, São Paulo',
      coordinates: { lat: -23.5505, lng: -46.6333 }
    },
    deliveryPerson: {
      name: 'Carlos Entregador',
      phone: '(11) 98888-1111',
      avatar: '',
      vehicle: 'Moto Honda CG 160'
    },
    items: [
      { name: 'Brigadeiro Premium', quantity: 6 },
      { name: 'Trufa de Maracujá', quantity: 3 }
    ],
    status: 'assigned',
    priority: 'normal',
    estimatedTime: '45 min',
    distance: '5.2 km',
    createdAt: '2024-01-15T14:30:00',
    scheduledFor: '2024-01-15T16:00:00',
    notes: 'Entregar na portaria'
  },
  {
    id: 'DEL-002',
    orderId: 'ORD-002',
    customer: {
      name: 'João Santos',
      phone: '(11) 98888-5678',
      address: 'Av. Paulista, 1500 - Bela Vista, São Paulo',
      coordinates: { lat: -23.5616, lng: -46.6562 }
    },
    deliveryPerson: {
      name: 'Ana Delivery',
      phone: '(11) 97777-2222',
      avatar: '',
      vehicle: 'Bicicleta Elétrica'
    },
    items: [
      { name: 'Bolo Red Velvet', quantity: 1 }
    ],
    status: 'in_transit',
    priority: 'high',
    estimatedTime: '20 min',
    distance: '2.8 km',
    createdAt: '2024-01-15T15:00:00',
    scheduledFor: '2024-01-15T17:30:00',
    notes: ''
  },
  {
    id: 'DEL-003',
    orderId: 'ORD-003',
    customer: {
      name: 'Ana Costa',
      phone: '(11) 97777-9012',
      address: 'Rua Oscar Freire, 789 - Jardins, São Paulo',
      coordinates: { lat: -23.5629, lng: -46.6694 }
    },
    deliveryPerson: {
      name: 'Pedro Moto',
      phone: '(11) 96666-3333',
      avatar: '',
      vehicle: 'Moto Yamaha Fazer'
    },
    items: [
      { name: 'Cupcakes Coloridos', quantity: 2 },
      { name: 'Cheesecake de Morango', quantity: 1 }
    ],
    status: 'delivered',
    priority: 'normal',
    estimatedTime: '0 min',
    distance: '3.5 km',
    createdAt: '2024-01-15T13:00:00',
    scheduledFor: '2024-01-15T14:00:00',
    deliveredAt: '2024-01-15T13:55:00',
    notes: 'Aniversário - favor caprichar na apresentação'
  }
];

const mockDeliveryPersons = [
  { id: '1', name: 'Carlos Entregador', available: true, deliveries: 2, rating: 4.8 },
  { id: '2', name: 'Ana Delivery', available: false, deliveries: 1, rating: 4.9 },
  { id: '3', name: 'Pedro Moto', available: true, deliveries: 0, rating: 4.7 },
  { id: '4', name: 'Lucia Bike', available: true, deliveries: 1, rating: 4.6 }
];

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  assigned: { label: 'Atribuída', color: 'bg-blue-100 text-blue-800' },
  in_transit: { label: 'Em Trânsito', color: 'bg-orange-100 text-orange-800' },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-800' }
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-red-100 text-red-800' }
};

export default function DeliveriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  const filteredDeliveries = mockDeliveries.filter(delivery => {
    const matchesSearch = delivery.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         delivery.deliveryPerson?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const assignDeliveryPerson = (deliveryId: string, personId: string) => {
    toast.success('Entregador atribuído com sucesso!');
  };

  const updateDeliveryStatus = (deliveryId: string, newStatus: string) => {
    toast.success('Status da entrega atualizado!');
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <Badge variant="outline" className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl">Gerenciar Entregas</h1>
          <p className="text-muted-foreground">
            Controle e acompanhe todas as entregas em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <MapPin className="h-4 w-4 mr-1" />
            Mapa
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Navigation className="h-4 w-4 mr-1" />
            Otimizar Rotas
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl">
                  {mockDeliveries.filter(d => d.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Trânsito</p>
                <p className="text-2xl">
                  {mockDeliveries.filter(d => d.status === 'in_transit').length}
                </p>
              </div>
              <Truck className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregues Hoje</p>
                <p className="text-2xl">
                  {mockDeliveries.filter(d => d.status === 'delivered').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregadores Ativos</p>
                <p className="text-2xl">
                  {mockDeliveryPersons.filter(d => d.available).length}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por entrega, cliente ou entregador..."
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
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="assigned">Atribuída</SelectItem>
            <SelectItem value="in_transit">Em Trânsito</SelectItem>
            <SelectItem value="delivered">Entregue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Deliveries List */}
      <div className="space-y-4">
        {filteredDeliveries.map(delivery => (
          <Card key={delivery.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {delivery.id}
                      {getPriorityBadge(delivery.priority)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Pedido: {delivery.orderId}
                    </p>
                  </div>
                  {getStatusBadge(delivery.status)}
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Distância</p>
                  <p className="text-lg">{delivery.distance}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm">Cliente</h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{delivery.estimatedTime}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm">{delivery.customer.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{delivery.customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{delivery.customer.address}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Person Info */}
              {delivery.deliveryPerson && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm mb-2">Entregador</h4>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={delivery.deliveryPerson.avatar} />
                      <AvatarFallback>
                        {delivery.deliveryPerson.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm">{delivery.deliveryPerson.name}</p>
                      <p className="text-xs text-muted-foreground">{delivery.deliveryPerson.vehicle}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="text-sm mb-2">Itens</h4>
                <div className="space-y-1">
                  {delivery.items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Agendado para: {new Date(delivery.scheduledFor).toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Notes */}
              {delivery.notes && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Observações:</strong> {delivery.notes}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                {delivery.status === 'pending' && (
                  <Select onValueChange={(value) => assignDeliveryPerson(delivery.id, value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Atribuir entregador" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockDeliveryPersons.filter(p => p.available).map(person => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name} ({person.deliveries} entregas)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {delivery.status === 'assigned' && (
                  <Button
                    size="sm"
                    onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    Iniciar Entrega
                  </Button>
                )}
                
                {delivery.status === 'in_transit' && (
                  <Button
                    size="sm"
                    onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmar Entrega
                  </Button>
                )}

                <Button variant="outline" size="sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  Ver no Mapa
                </Button>
                
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-1" />
                  Contatar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDeliveries.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg mb-2">Nenhuma entrega encontrada</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou termos de busca
          </p>
        </div>
      )}
    </div>
  );
}