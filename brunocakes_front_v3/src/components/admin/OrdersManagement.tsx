import { Checkbox } from '../ui/checkbox';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Search, Eye, CheckCircle, Clock, Package, XCircle, MessageCircle, DollarSign, Ban, Flag } from 'lucide-react';
import { useApp } from '../../App';
import { adminApi } from '../../api_admin';

// Tipo para o pedido baseado na estrutura real dos dados do backend
interface Order {
  id: string;
  clientName: string; // client_name do backend
  email: string;
  whatsapp: string;
  address?: string;
  neighborhood?: string;
  additionalInfo?: string;
  observations?: string; // Campo do backend
  status: string;
  total: number;
  created_at?: string;
  createdAt?: string;
  items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    product?: any;
  }>;
  paymentMethod?: string;
  payment_method?: string;
  scheduledDate?: string;
  scheduled_date?: string;
}

export const OrdersManagement = () => {

  const { orders, updateOrder, admin } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);


  // Estado de autenticação
  const isAdminAuthenticated = admin?.role === 'staff';

  // Seleção múltipla
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // Filtrar pedidos nulos ou undefined antes de aplicar o filtro de busca/status
  const filteredOrders = orders
    .filter(order => !!order)
    .filter(order => {
      const matchesSearch = (order.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (order.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                           (order.email && order.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  // IDs de pedidos aguardando confirmação
  const selectableIds = filteredOrders.filter(o => o.status === 'awaiting_seller_confirmation').map(o => o.id);
  const isAllSelected = selectableIds.length > 0 && selectableIds.every(id => selectedIds.includes(id));
  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(ids => ids.filter(id => !selectableIds.includes(id)));
    } else {
      setSelectedIds(ids => Array.from(new Set([...ids, ...selectableIds])));
    }
  };
  const handleSelectOne = (id: string) => {
    setSelectedIds(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  };
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkLoading(true);
    try {
      await adminApi.approvePayments(selectedIds);
      selectedIds.forEach(id => updateOrder(id, { status: 'completed' }));
      setSelectedIds([]);
    } catch (e) {
      // TODO: feedback de erro
    }
    setIsBulkLoading(false);
  };


  // Funções auxiliares para atualizar pedidos
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      
      // Usar o endpoint confirm-many que já existe
      await adminApi.confirmManyOrders([orderId]);
      
      // Atualiza o estado local após sucesso
      updateOrder(orderId, { status: newStatus as any });
      
      
    } catch (error) {
      // Aqui você pode adicionar um toast de erro se quiser
    }
  };

  const updatePaymentStatus = (orderId: string, paymentStatus: string) => {
    // Implementar lógica de pagamento se necessário
  };

  // Confirmar pedido (para pedidos já pagos)
  const handleConfirmOrder = async (orderId: string) => {
    try {
     
      await adminApi.confirmManyOrders([orderId]);
      
      // Atualiza o status local
      updateOrder(orderId, { status: 'confirmed' as any });
      
      
    } catch (error) {
    }
  };

  // Cancelar pedido
  const handleCancelPayment = async (orderId: string) => {
    try {
      
      await adminApi.cancelPayments([orderId]);
      
      // Atualiza o status local - usar "canceled" (8 chars) ao invés de "cancelled" (9 chars)
      updateOrder(orderId, { status: 'canceled' as any });
      
      
    } catch (error) {
    }
  };

  // Finalizar pedido (mark as completed)
  const handleFinishOrder = async (orderId: string) => {
    try {
      
      await adminApi.markAsCompleted([orderId]);
      
      // Atualiza o status local
      updateOrder(orderId, { status: 'completed' as any });
      
      
    } catch (error) {
    }
  };


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
      case 'canceled':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled': // Compatibilidade com dados antigos
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'pending_payment':
        return 'Aguardando Pagamento';
      case 'awaiting_seller_confirmation':
        return 'Aguardando Confirmação';
      case 'confirmed':
        return 'Confirmado';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Pronto';
      case 'completed':
        return 'Concluído';
      case 'canceled':
        return 'Cancelado';
      case 'cancelled': // Compatibilidade com dados antigos
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Função para verificar se o pagamento foi aprovado (status que vem da API)
  // Função para verificar se o pagamento foi aprovado (usa payment_status do backend)
  const isPaymentApproved = (paymentStatus: string) => {
    // Se o status não é 'pending_payment', significa que o pagamento foi processado
    return paymentStatus !== 'pending_payment';
  };

  // Função para mostrar indicador de pagamento
  // Função para mostrar indicador de pagamento (usa payment_status do backend)
  const getPaymentIndicator = (paymentStatus: string) => {
    if (paymentStatus === 'pending_payment') {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-600 ml-2">
          <Clock className="w-3 h-3 mr-1" />
          Aguardando Pagamento
        </Badge>
      );
    } else if (paymentStatus === 'failed' || paymentStatus === 'falied' || paymentStatus === 'canceled' || paymentStatus === 'cancelled') {
      return (
        <Badge variant="outline" className="text-red-600 border-red-600 ml-2">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      );
    } else if (paymentStatus === 'paid') {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600 ml-2">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-gray-600 border-gray-600 ml-2">
          <Flag className="w-3 h-3 mr-1" />
          {paymentStatus}
        </Badge>
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending_payment':
        return 'bg-orange-100 text-orange-800';
      case 'awaiting_seller_confirmation':
        return 'bg-purple-100 text-purple-800';
      case 'confirmed':
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-primary/10 text-primary';
      case 'canceled':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled': // Compatibilidade com dados antigos
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus);
  };

  const handleCompleteOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'confirmed');
  };

  const generateWhatsAppLink = (order: Order) => {
    // Verificar se o whatsapp existe e não é undefined
    if (!order.whatsapp) {
      return '#'; // Retorna link vazio se não houver whatsapp
    }
    
    const phoneNumber = order.whatsapp.replace(/\D/g, '');
    let message = `🎂 *Bruno Cake - Atualização do Pedido* 🎂\\n\\n`;
    message += `Olá ${order.clientName || 'Cliente'}!\\n\\n`;
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
      <div className="flex flex-col sm:flex-row gap-4 items-end">
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
        <div className="flex gap-2 items-end">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
              <SelectItem value="awaiting_seller_confirmation">Aguardando Confirmação</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="ready">Pronto</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
              <SelectItem value="cancelled">Cancelado (Legacy)</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="default"
            size="sm"
            disabled={selectedIds.length === 0 || isBulkLoading}
            onClick={handleBulkApprove}
            className="gap-1"
          >
            <CheckCircle className="w-4 h-4" />
            Confirmar Pedidos Selecionados para Entrega
          </Button>
        </div>
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
                    <TableHead>
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                        disabled={selectableIds.length === 0}
                      />
                    </TableHead>
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
                      <TableCell>
                        {'confirmed'.includes(order.status) && (
                          <Checkbox
                            checked={selectedIds.includes(order.id)}
                            onCheckedChange={() => handleSelectOne(order.id)}
                            aria-label={`Selecionar pedido ${order.id}`}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-mono">#{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {(() => {
                              const orderAny = order as any;
                              const name = order.clientName || orderAny.client_name || 'Cliente não informado';
                              return name.length > 15 ? `${name.substring(0, 15)}...` : name;
                            })()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(() => {
                              const orderAny = order as any;
                              return order.email || order.whatsapp || orderAny.phone || 'Contato não informado';
                            })()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {(() => {
                          const orderAny = order as any;
                          const total = order.total || orderAny.value || orderAny.amount || 0;
                          return !isNaN(Number(total)) ? Number(total).toFixed(2) : '0,00';
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{getStatusText(order.status)}</span>
                          </Badge>
                          {getPaymentIndicator((order as any).payment_status || order.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.createdAt ? 
                          new Date(order.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : 'Data não informada'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedOrder(order);
                                }}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                Detalhes
                              </Button>
                            </DialogTrigger>
                            
                            {/* Botão de confirmar pedido - apenas para pedidos já pagos */}
                            {isPaymentApproved((order as any).payment_status || order.status) && 
                             order.status !== 'confirmed' && 
                             order.status !== 'completed' && 
                             order.status !== 'canceled' && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleConfirmOrder(order.id)}
                                className="gap-1"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Confirmar
                              </Button>
                            )}

                            {/* Botões para pedidos confirmados */}
                            {order.status === 'confirmed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleFinishOrder(order.id)}
                                  className="gap-1 bg-blue-600 hover:bg-blue-700"
                                >
                                  <Flag className="w-4 h-4" />
                                  Finalizar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancelPayment(order.id)}
                                  className="gap-1"
                                >
                                  <Ban className="w-4 h-4" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Pedido #{order.id}</DialogTitle>
                              </DialogHeader>
                              
                              {selectedOrder && (
                                <div className="space-y-4">
                                  {/* Status e Ações */}
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-col gap-2">
                                      <Badge className={getStatusColor(selectedOrder.status)}>
                                        {getStatusIcon(selectedOrder.status)}
                                        <span className="ml-1">{getStatusText(selectedOrder.status)}</span>
                                      </Badge>
                                      {getPaymentIndicator((selectedOrder as any).payment_status || selectedOrder.status)}
                                    </div>
                                    <div className="flex gap-2">
                                      {/* Botão de confirmar pedido - apenas para pedidos já pagos */}
                                      {isPaymentApproved((selectedOrder as any).payment_status || selectedOrder.status) && 
                                       selectedOrder.status !== 'confirmed' && 
                                       selectedOrder.status !== 'completed' && 
                                       selectedOrder.status !== 'canceled' && (
                                        <Button
                                          onClick={() => handleConfirmOrder(selectedOrder.id)}
                                          size="sm"
                                          className="bruno-gradient text-white"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Confirmar Pedido
                                        </Button>
                                      )}

                                      {/* Botões para pedidos confirmados */}
                                      {selectedOrder.status === 'confirmed' && (
                                        <>
                                          <Button
                                            onClick={() => handleFinishOrder(selectedOrder.id)}
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                          >
                                            <Flag className="w-4 h-4 mr-1" />
                                            Finalizar
                                          </Button>
                                          <Button
                                            onClick={() => handleCancelPayment(selectedOrder.id)}
                                            size="sm"
                                            variant="destructive"
                                          >
                                            <Ban className="w-4 h-4 mr-1" />
                                            Cancelar
                                          </Button>
                                        </>
                                      )}
                                      {selectedOrder.whatsapp && (
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
                                      )}
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Dados do Cliente */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Dados do Cliente</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <strong>Nome:</strong> {(() => {
                                          const orderAny = selectedOrder as any;
                                          return selectedOrder.clientName || orderAny.client_name || 'Cliente não informado';
                                        })()}
                                      </div>
                                      <div>
                                        <strong>Email:</strong> {selectedOrder.email || 'Não informado'}
                                      </div>
                                      <div>
                                        <strong>Telefone:</strong> {(() => {
                                          const orderAny = selectedOrder as any;
                                          return selectedOrder.whatsapp || orderAny.phone || 'Não informado';
                                        })()}
                                      </div>
                                      {selectedOrder.neighborhood && (
                                        <div>
                                          <strong>Bairro:</strong> {selectedOrder.neighborhood}
                                        </div>
                                      )}
                                      {selectedOrder.address && (
                                        <div className="col-span-2">
                                          <strong>Endereço:</strong> {selectedOrder.address}
                                        </div>
                                      )}
                                      {(selectedOrder.additionalInfo || selectedOrder.observations) && (
                                        <div className="col-span-2">
                                          <strong>Observações:</strong> {selectedOrder.additionalInfo || selectedOrder.observations}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <Separator />

                                  {/* Itens do Pedido */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Itens do Pedido</h4>
                                    <div className="space-y-2">
                                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        selectedOrder.items.map((item: any, index: number) => {
                                          // Debug: log do item individual
                                          
                                          // Usar o preço diretamente do item (unit_price do backend)
                                          const price = Number(item.price || item.unit_price || 0);
                                          const quantity = Number(item.quantity || 1);
                                          const itemName = item.name || item.product_name || item.product?.name || 'Produto não informado';
                                          
                                          // Debug: valores processados
                                          
                                          return (
                                            <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                                              <div>
                                                <p className="font-medium">{itemName}</p>
                                                <p className="text-sm text-muted-foreground">
                                                  {quantity}x R$ {price.toFixed(2)}
                                                </p>
                                              </div>
                                              <span className="font-medium">
                                                R$ {(price * quantity).toFixed(2)}
                                              </span>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <p className="text-muted-foreground text-center py-4">
                                          Nenhum item encontrado neste pedido
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t font-semibold">
                                      <span>Total</span>
                                      <span className="text-primary">
                                        R$ {(() => {
                                          const orderAny = selectedOrder as any;
                                          const total = selectedOrder.total || orderAny.value || orderAny.amount || 0;
                                          return !isNaN(Number(total)) ? Number(total).toFixed(2) : '0,00';
                                        })()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Controle de Status */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Alterar Status</h4>
                                    <Select 
                                      value={selectedOrder.status} 
                                      onValueChange={(value: string) => handleStatusChange(selectedOrder.id, value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pendente</SelectItem>
                                        <SelectItem value="pending_payment">Aguardando Pagamento</SelectItem>
                                        <SelectItem value="awaiting_seller_confirmation">Aguardando Confirmação</SelectItem>
                                        <SelectItem value="confirmed">Confirmado</SelectItem>
                                        <SelectItem value="preparing">Preparando</SelectItem>
                                        <SelectItem value="ready">Pronto para Retirada</SelectItem>
                                        <SelectItem value="completed">Concluído</SelectItem>
                                        <SelectItem value="canceled">Cancelado</SelectItem>
                                        <SelectItem value="cancelled">Cancelado (Legacy)</SelectItem>
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