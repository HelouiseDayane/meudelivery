import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useApp } from '../../App';
import { PWAInstallButton } from '../PWAInstallButton';
import { usePWA } from '../../hooks/usePWA';

export const PublicLayout = () => {
  const { cart } = useApp();
  const location = useLocation();
  const { isMobile } = usePWA();
  
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bruno-gradient flex items-center justify-center">
                <span className="text-white font-bold text-sm">BC</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold bruno-text-gradient">Bruno Cake</h1>
                <p className="text-xs text-muted-foreground">Aqui não é fatia nem pedaço, aqui é tora!</p>
              </div>
            </Link>

            {/* Navigation - Mobile Friendly */}
            <nav className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant={isActive('/') ? 'default' : 'ghost'}
                size={isMobile ? 'sm' : 'default'}
                asChild
                className={isActive('/') ? 'bruno-gradient text-white' : ''}
              >
                <Link to="/">
                  {isMobile ? 'Menu' : 'Cardápio'}
                </Link>
              </Button>

              <Button
                variant={isActive('/tracking') ? 'default' : 'ghost'}
                size={isMobile ? 'sm' : 'default'}
                asChild
                className={isActive('/tracking') ? 'bruno-gradient text-white' : ''}
              >
                <Link to="/tracking" className="flex items-center gap-1">
                  <Search className="w-4 h-4" />
                  {!isMobile && 'Acompanhe seu pedido'}
                </Link>
              </Button>

              <Button
                variant={isActive('/cart') ? 'default' : 'ghost'}
                size={isMobile ? 'sm' : 'default'}
                asChild
                className={`relative ${isActive('/cart') ? 'bruno-gradient text-white' : ''}`}
              >
                <Link to="/cart" className="flex items-center gap-1">
                  <ShoppingCart className="w-4 h-4" />
                  {!isMobile && 'Carrinho'}
                  {cartItemsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {cartItemsCount}
                    </Badge>
                  )}
                </Link>
              </Button>

            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-2 flex justify-end">
      <PWAInstallButton />
    </div>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2 bruno-text-gradient">Bruno Cake</h3>
              <p className="text-muted-foreground">
                A melhor doceria da cidade!<br />
                Aqui não é fatia nem pedaço, aqui é tora!
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contato</h4>
              <p className="text-muted-foreground">
                📞 (11) 99999-9999<br />
                📧 contato@brunocakes.com.br<br />
                📍 Rua das Tortas, 123 - Centro
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Horário de Funcionamento</h4>
              <p className="text-muted-foreground">
                Segunda a Sexta: 8h às 18h<br />
                Sábado: 8h às 16h<br />
                Domingo: Fechado
              </p>
            </div>
          </div>
          <div className="border-t pt-4 mt-4 text-center text-muted-foreground">
            <p>&copy; 2024 Bruno Cake. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};