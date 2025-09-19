import { useState } from 'react';
import { useApp } from '../../App';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Package, Search, Phone, Mail } from 'lucide-react';
import api from '../../api';

export function OrdersLookup() {
  const { products } = useApp();
  // Lê email/phone da query string ao carregar
  function getQueryParam(param: string) {
    return new URLSearchParams(window.location.search).get(param) || '';
  }
  const [email, setEmail] = useState(getQueryParam('email'));
  const [phone, setPhone] = useState(getQueryParam('phone'));
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const result = await api.getOrdersByContact(email, phone);
      // Garante que é array, se vier objeto, transforma em array
      if (Array.isArray(result)) {
        setOrders(result);
      } else if (result && typeof result === 'object') {
        setOrders([result]);
      } else {
        setOrders([]);
      }
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para aplicar máscara de telefone
  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) {
      return `(${digits}`;
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhoneInput(value));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_payment':
        return 'Pagamento Pendente';
      case 'confirmed':
        return 'Confirmado - Produto disponível para retirada';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Status desconhecido';
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Consultar Meus Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </label>
            <label className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Seu telefone (formato: (11) 99999-9999)"
                value={phone}
                onChange={e => handlePhoneChange(e.target.value)}
                maxLength={15}
              />
            </label>
          </div>
          <Button onClick={handleSearch} disabled={loading || (!email && !phone)} className="w-full">
            {loading ? 'Buscando...' : 'Buscar Pedidos'}
          </Button>
        </CardContent>
      </Card>

      {searched && !loading && orders.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
          <p className="text-muted-foreground">Verifique os dados informados ou faça um novo pedido.</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-6">
          {orders.map(order => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className={getStatusColor(order.status)}>
                <CardTitle className="flex items-center gap-2">
                  <span>Pedido #{order.id}</span>
                  <Badge>{getStatusText(order.status)}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Feito em {order.created_at ? new Date(order.created_at).toLocaleString('pt-BR') : (order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : 'Data não informada')}
                </p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-4">
                  <strong>Cliente:</strong> {order.customer?.name || order.customer_name || 'Não informado'}<br />
                  <strong>Telefone:</strong> {order.customer?.phone || order.customer_phone || 'Não informado'}<br />
                  <strong>Email:</strong> {order.customer?.email || order.customer_email || 'Não informado'}
                </div>
                <div className="mb-4">
                  <strong>Itens:</strong>
                  <ul className="list-disc ml-6">
                    {order.items.map((item: any, idx: number) => {
                      // Tenta buscar o produto pelo id para pegar imagem
                      const prod = products.find(p => String(p.id) === String(item.product_id));
                      return (
                        <li key={idx} className="flex items-center gap-2 mb-1">
                          {prod && prod.imageUrl && (
                            <img src={prod.imageUrl} alt={item.product_name} className="w-8 h-8 rounded object-cover" />
                          )}
                          <span>{item.product_name || item.name} - {item.quantity}x</span>
                          <span className="ml-2 text-muted-foreground">R$ {item.unit_price ? Number(item.unit_price).toFixed(2) : ''}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <strong>Total:</strong> R$ {
                    order.total_amount ? Number(order.total_amount).toFixed(2) :
                    typeof order.total === 'number' ? order.total.toFixed(2) :
                    (order.total ? String(order.total) : '0,00')
                  }
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
