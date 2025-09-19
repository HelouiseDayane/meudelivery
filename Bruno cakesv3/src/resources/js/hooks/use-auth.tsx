import { useState } from 'react';
import { AuthenticatedSessionController } from '../actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import { RegisteredUserController } from '../actions/App/Http/Controllers/Auth/RegisteredUserController';
import { PasswordResetLinkController } from '../actions/App/Http/Controllers/Auth/PasswordResetLinkController';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string, userType: 'admin' | 'client') => {
    setLoading(true);
    try {
      const response = await AuthenticatedSessionController.store({
        email,
        password,
        userType
      });
      
      // Store auth data in localStorage for persistence
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }) => {
    setLoading(true);
    try {
      const response = await RegisteredUserController.store(userData);
      
      // Store auth data in localStorage for persistence
      localStorage.setItem('auth_token', response.data.token);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthenticatedSessionController.destroy();
      
      // Clear auth data from localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      
      return { message: 'Logout realizado com sucesso!' };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const response = await PasswordResetLinkController.store({ email });
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getStoredAuth = () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return { token, user };
      } catch {
        // Clear invalid data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    
    return null;
  };

  return {
    login,
    register,
    logout,
    forgotPassword,
    getStoredAuth,
    loading
  };
};