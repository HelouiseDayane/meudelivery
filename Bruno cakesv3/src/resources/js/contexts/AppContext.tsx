import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Product } from "../types/Product";
import { useAuth } from "../hooks/use-auth";

interface CartItem extends Product {
  quantity: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  type: "admin" | "client";
}

interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  user: User | null;
  userType: "admin" | "client";
  login: (
    email: string,
    password: string,
    type: "admin" | "client",
  ) => Promise<void>;
  logout: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (
    productId: string,
    quantity: number,
  ) => void;
  clearCart: () => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(
  undefined,
);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error(
      "useApp must be used within an AppProvider",
    );
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<"admin" | "client">(
    "client",
  );
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const authHook = useAuth();

  // Check for stored auth on app load
  useEffect(() => {
    const storedAuth = authHook.getStoredAuth();
    if (storedAuth) {
      setIsAuthenticated(true);
      setUser(storedAuth.user);
      setUserType(storedAuth.user.type);
    }
  }, []);

  const login = async (
    email: string,
    password: string,
    type: "admin" | "client",
  ) => {
    setIsLoading(true);

    try {
      const response = await authHook.login(
        email,
        password,
        type,
      );
      setIsAuthenticated(true);
      setUser(response.data.user);
      setUserType(response.data.user.type);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);

    try {
      await authHook.logout();
      setIsAuthenticated(false);
      setUser(null);
      setCart([]);
    } catch (error) {
      // Even if logout fails on server, clear local state
      setIsAuthenticated(false);
      setUser(null);
      setCart([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existingItem = prev.find(
        (item) => item.id === product.id,
      );
      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) =>
      prev.filter((item) => item.id !== productId),
    );
  };

  const updateCartQuantity = (
    productId: string,
    quantity: number,
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const contextValue: AppContextType = {
    isAuthenticated,
    user,
    userType,
    login,
    logout,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    isLoading,
    setIsLoading,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};