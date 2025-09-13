import { useState } from 'react';
import { useApp } from '../../App';
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

export function OrdersManagement() {
  const { orders, updateOrderStatus } = useApp();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const filteredOrders = orders.filter(order => {
    return selectedStatus === 'all' || order.status === selectedStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-purple-100 text-purple-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Aguardando Pagamento';
      case 'confirmed': return 'Pagamento Confirmado';
      case 'preparing': return 'Preparando';
      case 'ready': return 'Pronto para Retirada';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
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
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'paid': return 'Pago';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Gerenciar Pedidos</h1>
        <p className="text-muted-foreground">Acompanhe e atualize o status dos pedidos da sua loja</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Aguardando Pagamento</p>
                <p className="text-xl font-bold">{orders.filter(o => o.status === 'pending').length}</p>
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
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-muted-foreground">Concluídos Hoje</p>
                <p className="text-xl font-bold">{todayOrders.filter(o => o.status === 'completed').length}</p>
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
                  <SelectItem value="confirmed">Confirmados</SelectItem>
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
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">#{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.clientName}</p>
                      <p className="text-sm text-muted-foreground">{order.clientPhone}</p>
                      <p className="text-xs text-muted-foreground">{order.clientNeighborhood}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatPrice(order.total)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                      {getPaymentStatusText(order.paymentStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(order.createdAt).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Detalhes do Pedido #{selectedOrder?.id}</DialogTitle>
                          </DialogHeader>
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* Status */}
                              <div className="flex items-center justify-between">
                                <Badge className={getStatusColor(selectedOrder.status)} size="lg">
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(selectedOrder.status)}
                                    {getStatusText(selectedOrder.status)}
                                  </div>
                                </Badge>
                                <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                                  Pagamento: {getPaymentStatusText(selectedOrder.paymentStatus)}
                                </Badge>
                              </div>

                              {/* Customer Info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Dados do Cliente
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Nome:</span>
                                      <span>{selectedOrder.clientName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-3 w-3" />
                                      <span>{selectedOrder.clientPhone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-3 w-3" />
                                      <span>{selectedOrder.clientEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-3 w-3" />
                                      <span>{selectedOrder.clientAddress}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">Bairro:</span>
                                      <span>{selectedOrder.clientNeighborhood}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Local de Retirada
                                  </h4>
                                  <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
                                    <p className="font-medium text-blue-800">{STORE_CONFIG.name}</p>
                                    <p className="text-blue-700">{STORE_CONFIG.address}</p>
                                    <p className="text-blue-700">{STORE_CONFIG.workingHours}</p>
                                    <p className="text-blue-700">{STORE_CONFIG.phone}</p>
                                  </div>
                                </div>
                              </div>

                              <Separator />
                              
                              {/* Items */}
                              <div>
                                <h4 className="font-semibold mb-4 flex items-center gap-2">
                                  <Package className="h-4 w-4" />
                                  Itens do Pedido
                                </h4>
                                <div className="space-y-3">
                                  {selectedOrder.items.map((item: any, index: number) => {
                                    const price = item.product.isPromotion && item.product.promotionPrice 
                                      ? item.product.promotionPrice 
                                      : item.product.price;
                                    const itemTotal = price * item.quantity;
                                    
                                    return (
                                      <div key={index} className="flex items-center gap-4 p-3 border rounded">
                                        <ImageWithFallback
                                          src={item.product.image}
                                          alt={item.product.name}
                                          className="w-16 h-16 rounded object-cover"
                                        />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium">{item.product.name}</p>
                                            {item.product.isPromotion && (
                                              <Badge variant="destructive" className="text-xs">
                                                Promoção
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-muted-foreground">{item.product.category}</p>
                                          <div className="flex items-center gap-4 text-sm">
                                            <span>Quantidade: {item.quantity}</span>
                                            <span>Preço unitário: {formatPrice(price)}</span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-semibold">{formatPrice(itemTotal)}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                <Separator className="my-4" />
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Subtotal ({selectedOrder.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} itens)</span>
                                    <span>{formatPrice(selectedOrder.total)}</span>
                                  </div>
                                  <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>{formatPrice(selectedOrder.total)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Order Date */}
                              <div className="text-sm text-muted-foreground">
                                <p>Pedido realizado em: {new Date(selectedOrder.createdAt).toLocaleString('pt-BR')}</p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {canProgressStatus(order.status) && getNextStatus(order.status) && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(order.id, getNextStatus(order.status)!)}
                        >
                          {getNextStatusText(order.status)}
                        </Button>
                      )}

                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(order.id, 'cancelled')}
                          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
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
      </Card>
    </div>
  );
}