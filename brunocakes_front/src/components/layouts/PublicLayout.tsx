import { Outlet, Link, useLocation } from 'react-router-dom';
import { useApp } from '../../App';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ShoppingCart, Menu, X, Instagram, Phone, MapPin, Clock } from 'lucide-react';
import { STORE_CONFIG } from '../../api';
import { useState } from 'react';

export function PublicLayout() {
  const { cart } = useApp();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.isPromotion && item.product.promotionPrice 
      ? item.product.promotionPrice 
      : item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const navigationItems = [
    { name: 'Cardápio', href: '/', active: location.pathname === '/' },
    { name: 'Carrinho', href: '/cart', active: location.pathname === '/cart' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bruno-gradient rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bruno-text-gradient">{STORE_CONFIG.name}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">{STORE_CONFIG.slogan}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Cart & Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              <Link to="/cart">
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Carrinho</span>
                  {cartItemsCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {cartItemsCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <nav className="flex flex-col space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Cart Summary Bar */}
        {cartItemsCount > 0 && location.pathname !== '/cart' && (
          <div className="bg-primary/5 border-t border-primary/20">
            <div className="container mx-auto px-4 py-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-primary font-medium">
                  {cartItemsCount} {cartItemsCount === 1 ? 'tora' : 'toras'} no carrinho
                </span>
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-primary">
                    {formatPrice(cartTotal)}
                  </span>
                  <Link to="/cart">
                    <Button size="sm" className="h-7">
                      Ver Carrinho
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bruno-gradient rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">B</span>
                </div>
                <div>
                  <h3 className="font-bold bruno-text-gradient">{STORE_CONFIG.name}</h3>
                  <p className="text-sm text-muted-foreground">{STORE_CONFIG.slogan}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Especializados em tortas artesanais de alta qualidade. 
                Cada tora é feita com ingredientes selecionados e muito amor.
              </p>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="font-semibold">Contato</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>{STORE_CONFIG.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>{STORE_CONFIG.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{STORE_CONFIG.workingHours}</span>
                </div>
              </div>
            </div>

            {/* Social */}
            <div className="space-y-4">
              <h4 className="font-semibold">Redes Sociais</h4>
              <div className="flex items-center space-x-4">
                <a
                  href={`https://instagram.com/${STORE_CONFIG.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>{STORE_CONFIG.instagram}</span>
                </a>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Siga-nos no Instagram para ver nossas novidades diárias!</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 {STORE_CONFIG.name}. Todos os direitos reservados.</p>
            <p className="mt-1">Desenvolvido com ❤️ para os amantes de toras deliciosas</p>
          </div>
        </div>
      </footer>
    </div>
  );
}