import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Search, Eye, CheckCircle, Clock, Package, XCircle, MessageCircle } from 'lucide-react';
import { useApp } from '../../App';

export const OrdersManagement = () => {
  const { orders, updateOrderStatus, updatePaymentStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'confirmed':
      case 'preparing':
        return <Package className="w-4 h-4" />;
      case 'ready':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmado';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Pronto';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-primary/10 text-primary';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus as any);
  };

  const handleCompleteOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'completed');
  };

  const generateWhatsAppLink = (order: any) => {
    const phoneNumber = order.customer.phone.replace(/\D/g, '');
    let message = `🎂 *Bruno Cakes - Atualização do Pedido* 🎂\\n\\n`;
    message += `Olá ${order.customer.name}!\\n\\n`;
    message += `Seu pedido #${order.id} foi atualizado:\\n`;
    message += `*Status:* ${getStatusText(order.status)}\\n\\n`;
    
    if (order.status === 'ready') {
      message += `🎉 *Seu pedido está pronto para retirada!*\\n`;
      message += `Endereço: Rua das Tortas, 123 - Centro\\n`;
      message += `Horário: Segunda a Sexta: 8h às 18h | Sábado: 8h às 16h\\n\\n`;
    }
    
    message += `_Aqui não é fatia nem pedaço, aqui é tora!_ 🍰`;
    
    return `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="bruno-text-gradient mb-2">Gestão de Pedidos</h1>
        <p className="text-muted-foreground">Gerencie todos os pedidos da loja</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="confirmed">Confirmado</SelectItem>
            <SelectItem value="preparing">Preparando</SelectItem>
            <SelectItem value="ready">Pronto</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">#{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer.name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">R$ {order.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{getStatusText(order.status)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Pedido #{order.id}</DialogTitle>
                              </DialogHeader>
                              
                              {selectedOrder && (
                                <div className="space-y-4">
                                  {/* Status e Ações */}
                                  <div className="flex items-center justify-between">
                                    <Badge className={getStatusColor(selectedOrder.status)}>
                                      {getStatusIcon(selectedOrder.status)}
                                      <span className="ml-1">{getStatusText(selectedOrder.status)}</span>
                                    </Badge>
                                    <div className="flex gap-2">
                                      {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                                        <Button
                                          onClick={() => handleCompleteOrder(selectedOrder.id)}
                                          size="sm"
                                          className="bruno-gradient text-white"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Marcar como Concluído
                                        </Button>
                                      )}
                                      <Button
                                        asChild
                                        variant="outline"
                                        size="sm"
                                      >
                                        <a 
                                          href={generateWhatsAppLink(selectedOrder)}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <MessageCircle className="w-4 h-4 mr-1" />
                                          WhatsApp
                                        </a>
                                      </Button>
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Dados do Cliente */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Dados do Cliente</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <strong>Nome:</strong> {selectedOrder.customer.name}
                                      </div>
                                      <div>
                                        <strong>Email:</strong> {selectedOrder.customer.email}
                                      </div>
                                      <div>
                                        <strong>Telefone:</strong> {selectedOrder.customer.phone}
                                      </div>
                                      <div>
                                        <strong>Bairro:</strong> {selectedOrder.customer.neighborhood}
                                      </div>
                                      <div className="col-span-2">
                                        <strong>Endereço:</strong> {selectedOrder.customer.address}
                                      </div>
                                      {selectedOrder.customer.additionalInfo && (
                                        <div className="col-span-2">
                                          <strong>Observações:</strong> {selectedOrder.customer.additionalInfo}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Itens do Pedido */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Itens do Pedido</h4>
                                    <div className="space-y-2">
                                      {selectedOrder.items.map((item: any, index: number) => {
                                        const price = item.product.isPromotion ? item.product.promotionPrice : item.product.price;
                                        return (
                                          <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                            <div>
                                              <p className="font-medium">{item.product.name}</p>
                                              <p className="text-sm text-muted-foreground">
                                                {item.quantity}x R$ {price.toFixed(2)}
                                              </p>
                                            </div>
                                            <span className="font-medium">
                                              R$ {(price * item.quantity).toFixed(2)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t font-semibold">
                                      <span>Total</span>
                                      <span className="text-primary">R$ {selectedOrder.total.toFixed(2)}</span>
                                    </div>
                                  </div>

                                  {/* Controle de Status */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Alterar Status</h4>
                                    <Select 
                                      value={selectedOrder.status} 
                                      onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="confirmed">Confirmado</SelectItem>
                                        <SelectItem value="preparing">Preparando</SelectItem>
                                        <SelectItem value="ready">Pronto para Retirada</SelectItem>
                                        <SelectItem value="completed">Concluído</SelectItem>
                                        <SelectItem value="cancelled">Cancelado</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {/* Botão de Concluir direto na tabela */}
                          {order.status === 'ready' && (
                            <Button
                              onClick={() => handleCompleteOrder(order.id)}
                              size="sm"
                              className="bruno-gradient text-white"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};