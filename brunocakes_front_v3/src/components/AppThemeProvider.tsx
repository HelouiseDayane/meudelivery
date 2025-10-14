import { useStoreConfig } from '../hooks/useStoreConfig';
import { useEffect } from 'react';

// Componente principal que deve ser usado na raiz da aplicação
// para garantir que as configurações da loja sejam aplicadas globalmente
export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Aplica as configurações da loja globalmente
  const { loadStoreConfig } = useStoreConfig();
  
  // Carregamento inicial das configurações
  useEffect(() => {
    loadStoreConfig();
    
    // Só recarrega quando a página ganha foco (usuário volta de outra aba/janela)
    const handleFocus = () => {
      loadStoreConfig();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadStoreConfig]);
  
  return <>{children}</>;
};