
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { STORE_CONFIG, fetchAndSetActiveAddress, fetchAllAddresses, fetchStoreSettings, updateStoreConfig, apiRequest } from '../../api';
import { ShoppingCart, Package, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useApp } from '../../App';
import { PWAInstallButton } from '../PWAInstallButton';
import { usePWA } from '../../hooks/usePWA';
import { useStoreConfig } from '../../hooks/useStoreConfig';
import { useStoreConfigState } from '../../hooks/useStoreConfigState';
import { ThemeTestComponent, useThemeTest } from '../ThemeTestComponent';

export const PublicLayout = () => {
  // Listener global para garantir atualização dos cards em todas as rotas sem reload
  useEffect(() => {
    const handleCartExpired = () => {
      // Atualiza um valor no localStorage para forçar todos os componentes a reagirem
      localStorage.setItem('bruno_cart_expired', String(Date.now()));
    };
    window.addEventListener('cart-expired', handleCartExpired);
    return () => {
      window.removeEventListener('cart-expired', handleCartExpired);
    };
  }, []);
  const { cart } = useApp();
  const location = useLocation();
  const { isMobile } = usePWA();
  const { showThemeTest } = useThemeTest();
  
  // Hook para gerenciar configurações da loja
  useStoreConfig();
  
  // Hook reativo para configurações da loja
  const storeConfigState = useStoreConfigState();

  // Estado local para endereços, sem travar renderização global
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [allAddresses, setAllAddresses] = useState<any[]>([]);

  useEffect(() => {
    setLoadingAddress(true);
    fetchAllAddresses(apiRequest)
      .then(setAllAddresses)
      .catch(() => setAllAddresses([]))
      .finally(() => setLoadingAddress(false));
  }, [storeConfigState]);

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
            {/* Logo + Nome + Slogan */}
              <Link to="/" className="flex items-center space-x-3">
                {/* Mobile: só ícone, Desktop: logo + texto */}
                <img
                  src={storeConfigState.logoIcon}
                  alt={storeConfigState.storeName}
                  className="h-16 w-16 block sm:hidden"
                />
                <img
                  src={storeConfigState.logoHorizontal || "/Logo horizontal.png"}
                  alt={storeConfigState.storeName}
                  className="h-16 w-auto hidden sm:block"
                />
                <div className="hidden sm:flex flex-col">
                  <span className="font-bold text-primary text-lg leading-tight">{storeConfigState.storeName}</span>
                  <span className="text-xs text-muted-foreground">{storeConfigState.slogan}</span>
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
              <h3 className="font-semibold mb-2 bruno-text-gradient">
                <img 
                  src={storeConfigState.logoHorizontal} 
                  alt={storeConfigState.storeName} 
                  className="h-12 w-auto max-w-32 object-contain inline-block mr-2 align-middle" 
                />
              </h3>
              <p className="text-muted-foreground">
                {storeConfigState.slogan}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Contato</h4>
              <p className="text-muted-foreground">
                {storeConfigState.phone && (
                  <span>
                    <span role="img" aria-label="telefone">📞</span> <span className="font-semibold">{storeConfigState.phone}</span><br />
                  </span>
                )}
                {storeConfigState.whatsapp && (
                  <span>
                    <span role="img" aria-label="whatsapp">🟢</span> <a href={`https://wa.me/${storeConfigState.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline hover:opacity-80">WhatsApp: {storeConfigState.whatsapp}</a><br />
                  </span>
                )}
                {storeConfigState.instagram && (
                  <span>
                    <span role="img" aria-label="instagram">📸</span> <a href={`https://instagram.com/${storeConfigState.instagram}`} target="_blank" rel="noopener noreferrer" className="text-purple-600 font-semibold underline hover:opacity-80">{storeConfigState.instagram}</a><br />
                  </span>
                )}
                {allAddresses.length > 0 ? (
                  <span>
                    {allAddresses.map((addr, idx) => (
                      <span key={addr.id || idx}>
                        📍 {addr.rua}, {addr.numero} - {addr.bairro}, {addr.cidade} - {addr.estado}<br/>
                      </span>
                    ))}
                  </span>
                ) : loadingAddress ? (
                  'Carregando endereço...'
                ) : (
                  'Endereço não disponível'
                )}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Horário de Funcionamento</h4>
              <p className="text-muted-foreground">
                {STORE_CONFIG.workingHours && STORE_CONFIG.workingHours.trim() !== ''
                  ? STORE_CONFIG.workingHours
                  : 'Horário não disponível'}
              </p>
            </div>
          </div>
          <div className="border-t pt-4 mt-4 text-center text-muted-foreground">
            <p>© 2025 <a href="https://www.helosworld.com.br/" target="_blank" rel="noopener noreferrer">Helo's World</a>. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
      
      {/* Componente de teste de tema - só aparece em desenvolvimento */}
      {showThemeTest && (import.meta as any).env.DEV && <ThemeTestComponent />}
    </div>
  );
};
