import { useState } from 'react';
import { Button } from './ui/button';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { toast } from 'sonner';

export const PWAInstallButton = () => {
  const { isInstallable, installApp } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isInstallable) return null;

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        toast.success('Bruno Cakes instalado com sucesso!');
      } else {
        toast.error('Instalação cancelada');
      }
    } catch (error) {
      toast.error('Erro ao instalar o app');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      size="sm"
      className="bruno-gradient text-white hover:opacity-90 transition-opacity"
    >
      <Smartphone className="w-4 h-4 mr-2" />
      <Download className="w-4 h-4 mr-2" />
      {isInstalling ? 'Instalando...' : 'Instalar App'}
    </Button>
  );
};