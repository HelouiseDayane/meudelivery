import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { AlertCircle, Save, Upload, RotateCcw } from 'lucide-react';
import { adminApiRequest, ADMIN_API_ENDPOINTS } from '../../api';

interface StoreSettingsData {
  store_name: string;
  store_slogan: string; // Corrigido de 'slogan' para 'store_slogan'
  instagram: string;
  phone: string;
  whatsapp: string;
  primary_color: string;
  mercado_pago_key: string;
  logo_horizontal: string;
  logo_icon: string;
  logo_horizontal_url?: string;
  logo_icon_url?: string;
}

export const StoreSettings: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettingsData>({
    store_name: '',
    store_slogan: '',
    instagram: '',
    phone: '',
    whatsapp: '',
    primary_color: '#FFFF',
    mercado_pago_key: '',
    logo_horizontal: '',
    logo_icon: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [logoHorizontalFile, setLogoHorizontalFile] = useState<File | null>(null);
  const [logoIconFile, setLogoIconFile] = useState<File | null>(null);
  const [isExistingSettings, setIsExistingSettings] = useState(false);

  // Carregar configurações
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Token de autenticação não encontrado' });
        return;
      }

      const response = await fetch(ADMIN_API_ENDPOINTS.store.settings, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Erro ${response.status}`;
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage += `: ${errorData.message || response.statusText}`;
        } else {
          // Se não é JSON, provavelmente é uma página de erro HTML
          errorMessage += `: Erro interno do servidor. Verifique se o endpoint existe no backend.`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSettings({
        ...data,
        store_slogan: data.store_slogan || '',
        instagram: data.instagram || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        mercado_pago_key: data.mercado_pago_key || '',
        logo_horizontal: data.logo_horizontal || '',
        logo_icon: data.logo_icon || '',
        logo_horizontal_url: data.logo_horizontal_url || '', // URL completa vinda do backend
        logo_icon_url: data.logo_icon_url || '', // URL completa vinda do backend
      });
      
      // Verificar se já existe configurações salvas (tem ID)
      setIsExistingSettings(!!data.id);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('admin_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Token de autenticação não encontrado. Faça login novamente.' });
        return;
      }

      // Verificar se há arquivos para upload
      const hasFiles = logoHorizontalFile || logoIconFile;

      let requestBody;
      let headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
      };
      // Sempre usar POST, especialmente quando há arquivos
      let method = 'POST';

      if (hasFiles) {
        // Se há arquivos, usar FormData com POST
        const formData = new FormData();
        
        formData.append('store_name', settings.store_name);
        formData.append('store_slogan', settings.store_slogan);
        formData.append('instagram', settings.instagram);
        formData.append('primary_color', settings.primary_color || '#8B4513');
        formData.append('mercado_pago_key', settings.mercado_pago_key);

        if (logoHorizontalFile) {
          formData.append('logo_horizontal', logoHorizontalFile);
        }
        if (logoIconFile) {
          formData.append('logo_icon', logoIconFile);
        }

        requestBody = formData;
      } else {
        // Se não há arquivos, usar JSON com POST também    
        const jsonData = {
          store_name: settings.store_name,
          store_slogan: settings.store_slogan,
          instagram: settings.instagram,
          primary_color: settings.primary_color || '#8B4513',
          mercado_pago_key: settings.mercado_pago_key,
        };

        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(jsonData);
      }

      const response = await fetch(ADMIN_API_ENDPOINTS.store.settings, {
        method: method,
        headers: headers,
        body: requestBody,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorMessage = `Erro ${response.status}`;
        
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage += `: ${errorData.message || response.statusText}`;
        } else {
          // Se não é JSON, provavelmente é uma página de erro HTML
          errorMessage += `: Erro interno do servidor. Verifique se o backend está configurado corretamente.`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setLogoHorizontalFile(null);
      setLogoIconFile(null);
      loadSettings(); // Recarregar para pegar URLs das imagens
      
      // Força a aplicação das configurações na página
      setTimeout(() => {
        if ((window as any).reloadStoreConfig) {
          (window as any).reloadStoreConfig();
        }
        
        // Força atualização das imagens de preview nesta própria página
        const previewImages = document.querySelectorAll('img[alt*="Logo"]');
        
        previewImages.forEach((img) => {
          const element = img as HTMLImageElement;
          const currentSrc = element.src;
          // Força reload adicionando timestamp para quebrar cache
          element.src = currentSrc + '?t=' + Date.now();
        });
      }, 1000);
    } catch (error) {
      console.error('Erro completo ao salvar:', error);
      setMessage({ 
        type: 'error', 
        text: `Erro ao salvar configurações: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof StoreSettingsData, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = async () => {
    if (!confirm('Tem certeza que deseja resetar todas as configurações para os valores padrão? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setResetting(true);
      setMessage(null);

      const token = localStorage.getItem('admin_token');
      if (!token) {
        setMessage({ type: 'error', text: 'Token de autenticação não encontrado. Faça login novamente.' });
        return;
      }

      const response = await fetch(ADMIN_API_ENDPOINTS.store.settings, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText || response.statusText}`);
      }

      const result = await response.json();
      setMessage({ type: 'success', text: 'Configurações resetadas com sucesso!' });
      
      // Limpar arquivos selecionados
      setLogoHorizontalFile(null);
      setLogoIconFile(null);
      
      // Recarregar configurações
      loadSettings();
    } catch (error) {
      console.error('Erro ao resetar:', error);
      setMessage({ 
        type: 'error', 
        text: `Erro ao resetar configurações: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações da Loja</h1>
          <p className="text-sm text-gray-600 mt-1">
            {isExistingSettings ? 'Editando configurações existentes' : 'Criando novas configurações'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isExistingSettings && (
            <Button 
              onClick={handleReset} 
              disabled={resetting || saving} 
              variant="outline"
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4" />
              {resetting ? 'Resetando...' : 'Resetar'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || resetting} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : (isExistingSettings ? 'Atualizar' : 'Criar')}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md flex items-center gap-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          <AlertCircle className="w-4 h-4" />
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="store_name">Nome da Loja</Label>
              <Input
                id="store_name"
                value={settings.store_name}
                onChange={(e) => handleInputChange('store_name', e.target.value)}
                placeholder={settings.store_name || 'Nome da loja'}
              />
            </div>

            <div>
              <Label htmlFor="store_slogan">Slogan</Label>
              <Textarea
                id="store_slogan"
                value={settings.store_slogan}
                onChange={(e) => handleInputChange('store_slogan', e.target.value)}
                placeholder={settings.store_slogan || 'Slogan da loja'}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram (sem @)</Label>
              <Input
                id="instagram"
                value={settings.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                placeholder="Ex: brunocakee"
              />
            </div>

            <div>
              <Label htmlFor="primary_color">Cor Primária</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary_color"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => handleInputChange('primary_color', e.target.value)}
                  placeholder="#8B4513"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="mercado_pago_key">Chave Mercado Pago</Label>
              <Textarea
                id="mercado_pago_key"
                value={settings.mercado_pago_key}
                onChange={(e) => handleInputChange('mercado_pago_key', e.target.value)}
                placeholder="Chave de acesso do Mercado Pago"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Logos */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Logos e Imagens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={settings.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Ex: (84) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={settings.whatsapp}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                placeholder="Ex: (84) 99999-9999"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="logo_horizontal">Logo Horizontal</Label>
                {settings.logo_horizontal_url && (
                  <div className="mt-2 mb-2">
                    <img 
                      src={settings.logo_horizontal_url} 
                      alt="Logo Horizontal Atual" 
                      className="h-16 w-auto border rounded"
                    />
                  </div>
                )}
                <Input
                  id="logo_horizontal"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoHorizontalFile(e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <Label htmlFor="logo_icon">Logo Ícone</Label>
                {settings.logo_icon_url && (
                  <div className="mt-2 mb-2">
                    <img 
                      src={settings.logo_icon_url} 
                      alt="Logo Ícone Atual" 
                      className="h-16 w-16 border rounded"
                    />
                  </div>
                )}
                <Input
                  id="logo_icon"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoIconFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoreSettings;