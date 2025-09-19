import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Search, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../api';
import { toast } from 'sonner';

export const OrderTracking = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const formatPhoneInput = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Apply mask: (11) 99999-9999
    if (digits.length <= 2) {
      return `(${digits}`;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneInput(value);
    setPhone(formatted);
  };

  const searchOrders = async () => {
    if (!email && !phone) {
      toast.error('Preencha pelo menos um campo para buscar');
      return;
    }

    setIsSearching(true);
    
    try {
      const results = await api.getOrdersByContact(email, phone);
      setSearchResults(Array.isArray(results) ? results : []);
      
      if (results.length === 0) {
        toast.info('Nenhum pedido encontrado com esses dados');
      } else {
        toast.success(`${results.length} pedido(s) encontrado(s)`);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao buscar pedidos');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'awaiting_seller_confirmation':
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
        return 'Aguardando confirmação';
      case 'awaiting_seller_confirmation':
        return 'Aguardando confirmação do vendedor';
      case 'confirmed':
        return 'Pedido confirmado';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Pronto para retirada';
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
      case 'awaiting_seller_confirmation':
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="bruno-text-gradient mb-2">Acompanhe seu Pedido</h1>
        <p className="text-muted-foreground">
          Digite seu email ou telefone para encontrar seus pedidos
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Telefone</label>
              <Input
                type="tel"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={searchOrders} 
            disabled={isSearching || (!email && !phone)}
            className="w-full bruno-gradient text-white hover:opacity-90"
          >
            {isSearching ? 'Buscando...' : 'Buscar Pedidos'}
          </Button>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Seus Pedidos</h2>
          {searchResults.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at || order.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{getStatusText(order.status)}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Itens do Pedido</h4>
                  <div className="space-y-2">
                    {(order.items || []).map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>
                          {item.quantity}x {item.product?.name || item.product_name || 'Produto'}
                        </span>
                        <span className="font-medium">
                          R$ {((item.unit_price || item.price || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center font-semibold">
                    <span>Total</span>
                    <span className="text-primary">R$ {Number(order.total_amount || order.total || 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-1">Cliente</h4>
                    <p>{order.customer_name || order.customer?.name}</p>
                    <p>{order.customer_email || order.customer?.email}</p>
                    <p>{order.customer_phone || order.customer?.phone}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Endereço</h4>
                    <p>{order.address_street || order.customer?.address}</p>
                    <p>{order.address_neighborhood || order.customer?.neighborhood}</p>
                    {(order.additional_info || order.customer?.additionalInfo) && (
                      <p className="text-muted-foreground">{order.additional_info || order.customer?.additionalInfo}</p>
                    )}
                  </div>
                </div>

                {order.status === 'ready' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      🎉 Seu pedido está pronto para retirada!
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Você pode buscar na nossa loja durante o horário de funcionamento.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {searchResults.length === 0 && (email || phone) && !isSearching && (
        <div className="text-center py-8">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Nenhum pedido encontrado com os dados informados.
            <br />
            Verifique se as informações estão corretas.
          </p>
        </div>
      )}
    </div>
  );
};