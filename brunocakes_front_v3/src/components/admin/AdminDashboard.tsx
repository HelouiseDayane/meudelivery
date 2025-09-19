import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useApp } from '../../App';
import { DollarSign, TrendingUp, Package, MapPin, Calendar, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { STORE_CONFIG } from '../../api';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export function AdminDashboard() {
  const { analytics, loadAnalytics, orders, products } = useApp();

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (!analytics || 
      !analytics.salesByDay || 
      !analytics.salesByMonth || 
      !analytics.salesByYear ||
      !analytics.topProductsMonth ||
      !analytics.neighborhoodsSales ||
      analytics.totalRevenue === undefined) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">Carregando dados analíticos...</p>
        </div>
      </div>
    );
  }

  const todaySales = analytics.salesByDay?.length > 0 ? analytics.salesByDay[analytics.salesByDay.length - 1]?.amount || 0 : 0;
  const thisMonthSales = analytics.salesByMonth?.length > 0 ? analytics.salesByMonth[analytics.salesByMonth.length - 1]?.amount || 0 : 0;
  const thisYearSales = analytics.salesByYear?.length > 0 ? analytics.salesByYear[analytics.salesByYear.length - 1]?.amount || 0 : 0;
  
  const totalProducts = products?.length || 0;
  const availableProducts = products?.filter(p => p.available && p.stock > 0)?.length || 0;
  const lowStockProducts = products?.filter(p => p.stock <= 5 && p.stock > 0)?.length || 0;
  const outOfStockProducts = products?.filter(p => p.stock === 0)?.length || 0;
  
  const pendingOrders = orders?.filter(o => o.status === 'pending')?.length || 0;
  const todayOrders = orders?.filter(o => 
    new Date(o.createdAt).toDateString() === new Date().toDateString()
  )?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Dashboard - {STORE_CONFIG.name}</h1>
        <p className="text-muted-foreground">
          Visão geral das vendas e operações da loja
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {todayOrders} pedidos hoje
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {thisMonthSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Meta: R$ 25.000
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(analytics.totalRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ano atual: R$ {thisYearSales.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Dia (Últimos 5 dias)</CardTitle>
            <CardDescription>Evolução das vendas diárias</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.salesByDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Vendas']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Mês</CardTitle>
            <CardDescription>Comparativo mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.salesByMonth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${value}`} />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Vendas']} />
                <Bar dataKey="amount" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos (Mês)</CardTitle>
            <CardDescription>Ranking de produtos por quantidade vendida</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics.topProductsMonth || []).map((item, index) => (
                <div key={item.product} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{index + 1}º</Badge>
                    <div>
                      <p className="font-medium">{item.product}</p>
                      <p className="text-sm text-muted-foreground">{item.quantity} unidades</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {item.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Neighborhoods */}
        <Card>
          <CardHeader>
            <CardTitle>Bairros que Mais Compram</CardTitle>
            <CardDescription>Distribuição de vendas por região</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.neighborhoodsSales || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ neighborhood, orders }) => `${neighborhood} (${orders})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {analytics.neighborhoodsSales?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  )) || []}
                </Pie>
                <Tooltip formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Receita']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stock Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Estoque</CardTitle>
          <CardDescription>Controle de produtos disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{availableProducts}</div>
              <p className="text-sm text-muted-foreground">Disponíveis</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{lowStockProducts}</div>
              <p className="text-sm text-muted-foreground">Estoque Baixo</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{outOfStockProducts}</div>
              <p className="text-sm text-muted-foreground">Sem Estoque</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-sm text-muted-foreground">Total de Produtos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Neighborhood Sales Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes por Bairro</CardTitle>
          <CardDescription>Performance de vendas por localização</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(analytics.neighborhoodsSales || []).map((item, index) => (
              <div key={item.neighborhood}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{item.neighborhood}</p>
                      <p className="text-sm text-muted-foreground">{item.orders} pedidos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">R$ {item.revenue.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      Ticket médio: R$ {(item.revenue / item.orders).toFixed(2)}
                    </p>
                  </div>
                </div>
                {index < (analytics.neighborhoodsSales?.length || 0) - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}