import { useState } from 'react';
import { useApp, Order } from '../../App';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import { Eye, Clock, CheckCircle, MapPin, X, CreditCard, Phone, Mail, User, Package } from 'lucide-react';
import { STORE_CONFIG } from '../../api';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuItem } from '../ui/dropdown-menu';
import { api } from '../../api';

export function OrdersManagement() {
  const { orders, setOrders, updateOrderStatus } = useApp();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isConfirmingMany, setIsConfirmingMany] = useState(false);
  const [isApprovingPayments, setIsApprovingPayments] = useState(false);
  const [isCancellingPayments, setIsCancellingPayments] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const filteredOrders = orders.filter(order => {
    // Verifica se os dados essenciais estão presentes
    if (!order.id || !order.status || !order.createdAt) {
      console.error('Dados do pedido ausentes ou inválidos:', order);
      return false;
    }

    return selectedStatus === 'all' || order.status === selectedStatus;
  }).sort((a, b) => {
    // Ordena apenas se createdAt for válido
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    if (isNaN(dateA) || isNaN(dateB)) {
      console.error('Data inválida encontrada:', a, b);
      return 0;
    }

    return dateB - dateA;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'awaiting_seller_confirmation': return 'bg-orange-100 text-orange-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'approved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Aguardando Pagamento';
      case 'awaiting_seller_confirmation': return 'Aguardando Confirmação';
      case 'confirmed': return 'Pagamento Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto para Retirada';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'approved': return 'Aprovado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <CreditCard className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'preparing': return <Clock className="w-4 h-4" />;
      case 'ready': return <Package className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'paid': return 'Pago';
      case 'approved': return 'Aprovado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus as any);
    toast.success(`Status do pedido atualizado para ${getStatusText(newStatus)}`);
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'completed';
      default: return null;
    }
  };

  const getNextStatusText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'Confirmar Pagamento';
      case 'confirmed': return 'Iniciar Preparo';
      case 'preparing': return 'Marcar como Pronto';
      case 'ready': return 'Concluir Entrega';
      default: return null;
    }
  };

  const canProgressStatus = (status: string) => {
    return ['pending', 'confirmed', 'preparing', 'ready'].includes(status);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const todayOrders = orders.filter(o => 
    new Date(o.createdAt).toDateString() === new Date().toDateString()
  );

  const todayRevenue = todayOrders.reduce((sum, order) => 
    order.paymentStatus === 'paid' ? sum + order.total : sum, 0
  );

  const handleApprovePayments = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Nenhum pedido selecionado para aprovação.');
      return;
    }

    setIsApprovingPayments(true);
    try {
      const validOrderIds = selectedOrders.filter(id => id);

      if (validOrderIds.length === 0) {
        toast.error('Nenhum pedido válido encontrado para aprovação.');
        setIsApprovingPayments(false);
        return;
      }

      const res = await api.approvePayments(validOrderIds);
      toast.success(`${res.updated_count} pagamentos aprovados!`);
      setSelectedOrders([]);

      // Buscar dados atualizados do backend
      const updatedOrders = await api.getAdminOrders();
      setOrders(updatedOrders);
    } catch (err) {
      toast.error('Erro ao aprovar pagamentos');
    }
    setIsApprovingPayments(false);
  };

  const handleCancelPayments = async () => {
    if (selectedOrders.length === 0) return;
    
    setIsCancellingPayments(true);
    try {
      const res = await api.cancelPayments(selectedOrders);
      toast.success(`${res.updated_count} pagamentos cancelados!`);
      setSelectedOrders([]);
      window.location.reload(); // Para atualizar a lista
    } catch (err: any) {
      toast.error('Erro ao cancelar pagamentos');
    }
    setIsCancellingPayments(false);
  };

  const handleConfirmManyOrders = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Nenhum pedido selecionado para autorização.');
      return;
    }

    setIsConfirmingMany(true);
    try {
      const validOrderIds = selectedOrders.filter(id => id);

      if (validOrderIds.length === 0) {
        toast.error('Nenhum pedido válido encontrado para autorização.');
        setIsConfirmingMany(false);
        return;
      }

      const res = await api.confirmManyOrders(validOrderIds);
      toast.success(`${res.updated_count} pedidos autorizados!`);
      setSelectedOrders([]);

      // Buscar dados atualizados do backend
      const updatedOrders = await api.getAdminOrders();
      setOrders(updatedOrders);
    } catch (err) {
      toast.error('Erro ao autorizar pedidos');
    }
    setIsConfirmingMany(false);
  };

  const handleMarkAsCompleted = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Nenhum pedido selecionado para marcar como concluído.');
      return;
    }

    setIsConfirmingMany(true);
    try {
      const validOrderIds = selectedOrders.filter(id => id);

      if (validOrderIds.length === 0) {
        toast.error('Nenhum pedido válido encontrado para marcar como concluído.');
        setIsConfirmingMany(false);
        return;
      }

      const res = await api.markAsCompleted(validOrderIds);
      toast.success(`${res.updated_count} pedidos marcados como concluídos!`);
      setSelectedOrders([]);

      // Buscar dados atualizados do backend
      const updatedOrders = await api.getAdminOrders();
      setOrders(updatedOrders);
    } catch (err) {
      toast.error('Erro ao marcar pedidos como concluídos');
    }
    setIsConfirmingMany(false);
  };

  return (
    <div>
      {/* Header */}
      <div>
        <h1>Gerenciar Pedidos</h1>
        <p className="text-muted-foreground">Acompanhe e atualize o status dos pedidos da sua loja</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Aguard. Pagamento</p>
                <p className="text-xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Aguard. Confirmação</p>
                <p className="text-xl font-bold">{orders.filter(o => o.status === 'awaiting_seller_confirmation').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Confirmados</p>
                <p className="text-xl font-bold">{orders.filter(o => o.status === 'confirmed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-xl font-bold">{orders.filter(o => o.status === 'approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Preparando</p>
                <p className="text-xl font-bold">{orders.filter(o => o.status === 'preparing').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Prontos</p>
                <p className="text-xl font-bold">{orders.filter(o => o.status === 'ready').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Card */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Faturamento Hoje</p>
              <p className="text-2xl font-bold text-green-700">{formatPrice(todayRevenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Pedidos Hoje</p>
              <p className="text-xl font-semibold">{todayOrders.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <div className="w-48">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Aguardando Pagamento</SelectItem>
                  <SelectItem value="awaiting_seller_confirmation">Aguardando Confirmação</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="approved">Aprovados</SelectItem>
                  <SelectItem value="preparing">Preparando</SelectItem>
                  <SelectItem value="ready">Prontos</SelectItem>
                  <SelectItem value="completed">Concluídos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredOrders.length} de {orders.length} pedidos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <Select onValueChange={setSelectedStatus} value={selectedStatus} className="w-full sm:w-auto">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Aguardando Pagamento</SelectItem>
                <SelectItem value="confirmed">Pagamento Confirmado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={isApprovingPayments}
                onClick={handleApprovePayments}
                className="w-full sm:w-auto"
              >
                Aprovar Pagamento
              </Button>
              <Button
                size="sm"
                disabled={isConfirmingMany}
                onClick={async () => {
                  setIsConfirmingMany(true);
                  try {
                    const res = await api.confirmManyOrders(selectedOrders);
                    toast.success(`${res.updated_count} pedidos autorizados!`);
                    setSelectedOrders([]);
                    res.updated_orders.forEach((order: Order) => {
                      updateOrderStatus(order.id, 'approved');
                    });
                  } catch (err: any) {
                    toast.error('Erro ao autorizar pedidos');
                  }
                  setIsConfirmingMany(false);
                }}
                className="w-full sm:w-auto"
              >
                Autorizar Pedido
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={isCancellingPayments}
                onClick={async () => {
                  setIsCancellingPayments(true);
                  try {
                    const res = await api.cancelPayments(selectedOrders);
                    toast.success(`${res.updated_count} pagamentos cancelados!`);
                    setSelectedOrders([]);
                    res.updated_orders.forEach((order: Order) => {
                      updateOrderStatus(order.id, 'cancelled');
                    });
                  } catch (err: any) {
                    toast.error('Erro ao cancelar pagamentos');
                  }
                  setIsCancellingPayments(false);
                }}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                disabled={isConfirmingMany}
                onClick={handleMarkAsCompleted}
                className="w-full sm:w-auto"
              >
                Pedido Entregue
              </Button>
            </div>
          </div>
          <CardHeader>
            <CardTitle>Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <input
                      type="checkbox"
                      checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedOrders.includes(o.id))}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedOrders(filteredOrders.map(o => o.id));
                        } else {
                          setSelectedOrders([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setSelectedOrders(prev =>
                            isChecked ? [...prev, order.id] : prev.filter(id => id !== order.id)
                          );
                        }}
                      />
                    </TableCell>
                    <TableCell>{`#${order.id}`}</TableCell>
                    <TableCell>{order.customer?.name.slice(0, 15) + (order.customer?.name.length > 30 ? '...' : '')}</TableCell>
                    <TableCell>{formatPrice(order.total)}</TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                        {getPaymentStatusText(order.paymentStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Eye className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedOrder(order)}>Ver Detalhes</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground">
                  Não há pedidos {selectedStatus !== 'all' ? `com status "${getStatusText(selectedStatus)}"` : ''} no momento
                </p>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
}