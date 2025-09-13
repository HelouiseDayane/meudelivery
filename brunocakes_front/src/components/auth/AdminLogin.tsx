import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import { api } from '../../api';
import { useApp } from '../../App'; // ✅ pega o contexto do App

interface Admin {
  id: string;
  name: string;
  email: string;
  role: 'staff';
}

export function AdminLogin() {
  const { adminLogin } = useApp(); // pega função do contexto
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await adminLogin(email, password); // chama função do App
    setIsLoading(false);

    if (success) {
      navigate('/admin'); // redireciona para dashboard
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Lado informativo */}
        <div className="text-center md:text-left space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">Painel Administrativo</h1>
          <p className="text-muted-foreground">Bruno Cakes</p>
          <p className="text-lg text-muted-foreground">
            Gerencie sua loja de doces com controle total sobre vendas, estoque e clientes.
          </p>
        </div>

        {/* Formulário */}
        <Card className="w-full max-w-md mx-auto shadow-xl border-gray-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-slate-700 to-gray-800 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-gray-800">Acesso Administrativo</CardTitle>
            <CardDescription>
              Entre com suas credenciais de administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Administrativo</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@docesedelicias.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-slate-700 to-gray-800 hover:from-slate-800 hover:to-gray-900"
                disabled={isLoading}
              >
                {isLoading ? 'Verificando...' : 'Acessar Painel'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Não é um administrador?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium underline">
                  Área do cliente
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
