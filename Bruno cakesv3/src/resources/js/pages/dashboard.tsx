import { useApp } from '../contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Package2, 
  ShoppingBag, 
  TrendingUp, 
  Users,
  Clock,
  Star,
  Truck,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Mock data
const mockStats = {
  admin: {
    totalOrders: 245,
    pendingOrders: 12,
    totalProducts: 48,
    totalClients: 156,
    monthlyRevenue: 15420.50,
    dailyOrders: 23
  },
  client: {
    totalOrders: 8,
    favoriteProducts: 12,
    totalSpent: 520.30,
    recentOrders: [
      { id: '1', items: 'Brigadeiro Premium x3', status: 'entregue', date: '2024-01-10', total: 45.00 },
      { id: '2', items: 'Bolo Chocolate Belga', status: 'preparando', date: '2024-01-12', total: 89.90 },
      { id: '3', items: 'Trufa de Maracujá x6', status: 'a caminho', date: '2024-01-15', total: 72.00 }
    ]
  }
};

const mockRecentProducts = [
  { id: '1', name: 'Brigadeiro Premium', orders: 45, rating: 4.9 },
  { id: '2', name: 'Bolo Red Velvet', orders: 32, rating: 4.8 },
  { id: '3', name: 'Trufa de Chocolate', orders: 28, rating: 4.7 },
  { id: '4', name: 'Cheesecake Morango', orders: 25, rating: 4.9 }
];

export default function Dashboard() {
  const { userType } = useApp();
  const navigate = useNavigate();

  if (userType === 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1>Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral do seu negócio de doces
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Hoje</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.admin.dailyOrders}</div>
              <p className="text-xs text-muted-foreground">
                +12% desde ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.admin.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Requer atenção
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {mockStats.admin.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">
                +8.2% desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.admin.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                +5 novos esta semana
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Populares</CardTitle>
              <CardDescription>
                Doces mais pedidos este mês
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockRecentProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Package2 className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.orders} pedidos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs">{product.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Acesso rápido às principais funcionalidades
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate('/products/new')}
                className="w-full justify-between bg-orange-500 hover:bg-orange-600"
              >
                <span>Adicionar Novo Produto</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigate('/orders')}
                variant="outline"
                className="w-full justify-between"
              >
                <span>Ver Pedidos Pendentes</span>
                <Badge variant="secondary">{mockStats.admin.pendingOrders}</Badge>
              </Button>
              <Button
                onClick={() => navigate('/deliveries')}
                variant="outline"
                className="w-full justify-between"
              >
                <span>Gerenciar Entregas</span>
                <Truck className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Client Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1>Bem-vindo de volta!</h1>
        <p className="text-muted-foreground">
          Que tal experimentar nossos novos doces?
        </p>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.client.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Total de pedidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.client.favoriteProducts}</div>
            <p className="text-xs text-muted-foreground">
              Doces salvos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {mockStats.client.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              Desde o primeiro pedido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>
              Acompanhe o status dos seus pedidos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockStats.client.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{order.items}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">R$ {order.total.toFixed(2)}</p>
                    <Badge 
                      variant={
                        order.status === 'entregue' ? 'default' :
                        order.status === 'a caminho' ? 'secondary' : 'outline'
                      }
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button
              onClick={() => navigate('/my-orders')}
              variant="outline"
              className="w-full mt-4"
            >
              Ver todos os pedidos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Explorar Doces</CardTitle>
            <CardDescription>
              Descubra novos sabores e faça seu pedido
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={() => navigate('/products')}
              className="w-full justify-between bg-orange-500 hover:bg-orange-600"
            >
              <span>Ver Cardápio Completo</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => navigate('/products?category=novidades')}
              variant="outline"
              className="w-full justify-between"
            >
              <span>Novidades da Semana</span>
              <Star className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => navigate('/products?category=promocoes')}
              variant="outline"
              className="w-full justify-between"
            >
              <span>Promoções Especiais</span>
              <Badge variant="secondary">-20%</Badge>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}