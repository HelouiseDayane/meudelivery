import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ShoppingCart,
  LogOut,
  Menu,
  X,
  Package
} from 'lucide-react';

interface AppHeaderProps {
  onMenuToggle?: (isOpen: boolean) => void;
}

export default function AppHeader({ onMenuToggle }: AppHeaderProps) {
  const { userType, logout, cart } = useApp();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    onMenuToggle?.(newState);
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
            <Package className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-medium">Sweet Delivery</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {userType === 'client' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/checkout')}
            className="relative"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-orange-500">
                {cartItemsCount}
              </Badge>
            )}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}