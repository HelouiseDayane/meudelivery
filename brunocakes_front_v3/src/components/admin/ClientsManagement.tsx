import { useState, useEffect } from 'react';
import { useApp } from '../../App';
import { api } from '../../api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Search, Users, ShoppingBag, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UniqueClient {
  name: string;
  email: string;
  phone: string;
  address: string;
  neighborhood: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export function ClientsManagement() {
  const { orders } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<UniqueClient[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar clientes únicos da API
  useEffect(() => {
    const loadUniqueClients = async () => {
      try {
        setLoading(true);
        const uniqueClients = await api.getUniqueClients();
        setClients(uniqueClients || []);
      } catch (error) {
        console.error('Erro ao carregar clientes únicos:', error);
        toast.error('Erro ao carregar clientes');
        // Fallback: extrair clientes dos pedidos locais
        extractClientsFromOrders();
      } finally {
        setLoading(false);
      }
    };

    loadUniqueClients();
  }, []);

  // Função de fallback para extrair clientes dos pedidos locais
  const extractClientsFromOrders = () => {
    const clientsMap = new Map<string, UniqueClient>();

    orders.forEach(order => {
      const key = order.customer.phone || order.customer.email;
      if (!key) return;

      if (clientsMap.has(key)) {
        const existing = clientsMap.get(key)!;
        existing.totalOrders += 1;
        existing.totalSpent += order.total;
        existing.lastOrderDate = new Date(order.createdAt) > new Date(existing.lastOrderDate) 
          ? order.createdAt 
          : existing.lastOrderDate;
      } else {
        clientsMap.set(key, {
          name: order.customer.name || 'Nome não informado',
          email: order.customer.email || '',
          phone: order.customer.phone || '',
          address: order.customer.address || '',
          neighborhood: order.customer.neighborhood || '',
          totalOrders: 1,
          totalSpent: order.total,
          lastOrderDate: order.createdAt,
        });
      }
    });

    setClients(Array.from(clientsMap.values()));
  };

  const filteredClients = clients.filter(client => {
    const name = (client.name || '').toLowerCase();
    const phone = (client.phone || '');
    const email = (client.email || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return name.includes(searchLower) || 
           phone.includes(searchTerm) ||
           email.includes(searchLower);
  });

  const getClientStatus = (lastOrderDate: string) => {
    const daysSinceLastOrder = Math.floor(
      (new Date().getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastOrder <= 7) return { text: 'Ativo', color: 'bg-green-100 text-green-800' };
    if (daysSinceLastOrder <= 30) return { text: 'Regular', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Inativo', color: 'bg-gray-100 text-gray-800' };
  };

  const totalClients = clients.length;
  const activeClients = clients.filter(client => {
    const daysSinceLastOrder = Math.floor(
      (new Date().getTime() - new Date(client.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceLastOrder <= 30;
  }).length;

  const totalRevenue = clients.reduce((sum, client) => sum + client.totalSpent, 0);
  const totalOrdersCount = clients.reduce((sum, client) => sum + client.totalOrders, 0);
  const averageOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Carregando informações dos clientes...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
        <p className="text-gray-600">Visualize informações sobre seus clientes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-xl font-bold">{totalClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Clientes Ativos</p>
                <p className="text-xl font-bold">{activeClients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Receita Total</p>
                <p className="text-xl font-bold">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Ticket Médio</p>
                <p className="text-xl font-bold">R$ {averageOrderValue.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar clientes por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum pedido foi feito ainda'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total de Pedidos</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Último Pedido</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client, index) => {
                  const status = getClientStatus(client.lastOrderDate);
                  return (
                    <TableRow key={`${client.phone || client.email || index}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.phone && (
                            <p className="text-sm text-gray-600">{client.phone}</p>
                          )}
                          {client.email && (
                            <p className="text-sm text-gray-500">{client.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-4 h-4 text-gray-500" />
                          <span className="font-semibold">{client.totalOrders}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        R$ {client.totalSpent.toFixed(2).replace('.', ',')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(client.lastOrderDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          {status.text}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {clients
                .sort((a: UniqueClient, b: UniqueClient) => b.totalSpent - a.totalSpent)
                .slice(0, 5)
                .map((client: UniqueClient, index: number) => (
                  <div key={`${client.phone || client.email || index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{client.name}</p>
                        <p className="text-sm text-gray-600">{client.totalOrders} pedidos</p>
                      </div>
                    </div>
                    <p className="font-semibold text-green-600">
                      R$ {client.totalSpent.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cliente mais frequente:</span>
              <span className="font-semibold">
                {clients.sort((a: UniqueClient, b: UniqueClient) => b.totalOrders - a.totalOrders)[0]?.name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Cliente que mais gastou:</span>
              <span className="font-semibold">
                {clients.sort((a: UniqueClient, b: UniqueClient) => b.totalSpent - a.totalSpent)[0]?.name || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pedidos por cliente (média):</span>
              <span className="font-semibold">
                {totalClients > 0 ? (totalOrdersCount / totalClients).toFixed(1) : '0'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Taxa de retenção:</span>
              <span className="font-semibold text-green-600">
                {totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : '0'}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}