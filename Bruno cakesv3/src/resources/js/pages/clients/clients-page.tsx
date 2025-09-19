import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit3, 
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Star,
  MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from 'sonner@2.0.3';

// Mock clients data
const mockClients = [
  {
    id: 'CLI-001',
    name: 'Maria Silva',
    email: 'maria.silva@email.com',
    phone: '(11) 99999-1234',
    address: 'Rua das Flores, 123 - Vila Madalena, São Paulo',
    avatar: '',
    status: 'active',
    createdAt: '2023-12-15T10:00:00',
    lastOrder: '2024-01-15T14:30:00',
    totalOrders: 15,
    totalSpent: 890.50,
    averageOrderValue: 59.37,
    favoriteProducts: ['Brigadeiro Premium', 'Bolo Red Velvet'],
    rating: 4.8,
    notes: 'Cliente fiel, sempre muito educada'
  },
  {
    id: 'CLI-002',
    name: 'João Santos',
    email: 'joao.santos@email.com',
    phone: '(11) 98888-5678',
    address: 'Av. Paulista, 1500 - Bela Vista, São Paulo',
    avatar: '',
    status: 'active',
    createdAt: '2024-01-10T16:20:00',
    lastOrder: '2024-01-15T11:15:00',
    totalOrders: 3,
    totalSpent: 215.70,
    averageOrderValue: 71.90,
    favoriteProducts: ['Cupcakes Coloridos'],
    rating: 4.9,
    notes: ''
  },
  {
    id: 'CLI-003',
    name: 'Ana Costa',
    email: 'ana.costa@email.com',
    phone: '(11) 97777-9012',
    address: 'Rua Oscar Freire, 789 - Jardins, São Paulo',
    avatar: '',
    status: 'vip',
    createdAt: '2023-08-22T09:30:00',
    lastOrder: '2024-01-14T20:00:00',
    totalOrders: 42,
    totalSpent: 2150.30,
    averageOrderValue: 51.20,
    favoriteProducts: ['Cheesecake de Morango', 'Trufa de Maracujá', 'Bolo Red Velvet'],
    rating: 5.0,
    notes: 'Cliente VIP - sempre pede para eventos especiais'
  },
  {
    id: 'CLI-004',
    name: 'Carlos Mendes',
    email: 'carlos.mendes@email.com',
    phone: '(11) 96666-3456',
    address: 'Rua Augusta, 456 - Consolação, São Paulo',
    avatar: '',
    status: 'inactive',
    createdAt: '2023-10-05T14:15:00',
    lastOrder: '2023-12-20T18:30:00',
    totalOrders: 8,
    totalSpent: 456.80,
    averageOrderValue: 57.10,
    favoriteProducts: ['Brigadeiro Premium'],
    rating: 4.2,
    notes: 'Não faz pedidos há mais de 30 dias'
  }
];

const statusConfig = {
  active: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  vip: { label: 'VIP', color: 'bg-purple-100 text-purple-800' },
  inactive: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
  blocked: { label: 'Bloqueado', color: 'bg-red-100 text-red-800' }
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const deleteClient = (clientId: string) => {
    toast.success('Cliente removido com sucesso!');
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getClientTypeIcon = (client: any) => {
    if (client.status === 'vip') {
      return <Star className="h-4 w-4 text-purple-600 fill-current" />;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl">Gerenciar Clientes</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie informações dos seus clientes
          </p>
        </div>
        
        <Button 
          onClick={() => navigate('/clients/new')}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl">{mockClients.length}</p>
              </div>
              <div className="text-green-600">
                +{mockClients.filter(c => c.status === 'active').length} ativos
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes VIP</p>
                <p className="text-2xl">{mockClients.filter(c => c.status === 'vip').length}</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl">
                  R$ {(mockClients.reduce((sum, c) => sum + c.averageOrderValue, 0) / mockClients.length).toFixed(0)}
                </p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Total</p>
                <p className="text-2xl">
                  R$ {(mockClients.reduce((sum, c) => sum + c.totalSpent, 0) / 1000).toFixed(1)}K
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
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
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
            <SelectItem value="blocked">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={client.avatar} />
                    <AvatarFallback>
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {client.name}
                      {getClientTypeIcon(client)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{client.id}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(client.status)}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/clients/${client.id}/edit`)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteClient(client.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="line-clamp-2">{client.address}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-lg">{client.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Pedidos</p>
                </div>
                <div className="text-center">
                  <p className="text-lg">R$ {client.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Total Gasto</p>
                </div>
              </div>

              {/* Rating and Last Order */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span>{client.rating}</span>
                  <span className="text-muted-foreground">avaliação</span>
                </div>
                <div className="text-muted-foreground">
                  Último pedido: {new Date(client.lastOrder).toLocaleDateString('pt-BR')}
                </div>
              </div>

              {/* Favorite Products */}
              {client.favoriteProducts.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Produtos Favoritos:</p>
                  <div className="flex flex-wrap gap-1">
                    {client.favoriteProducts.slice(0, 2).map((product, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                    {client.favoriteProducts.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{client.favoriteProducts.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {client.notes && (
                <div className="p-2 bg-blue-50 rounded text-sm text-blue-800">
                  {client.notes}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => navigate(`/clients/${client.id}/edit`)}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Editar
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
      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg mb-2">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou termos de busca
          </p>
        </div>
      )}
    </div>
  );
}