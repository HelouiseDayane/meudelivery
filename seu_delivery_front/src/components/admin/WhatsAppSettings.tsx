import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Smartphone, Wifi, WifiOff, RefreshCw, LogOut, QrCode, Loader2 } from 'lucide-react';
import adminApi from '../../api/admin';
import { useApp } from '../../App';

interface WhatsAppStatus {
  status: 'connected' | 'connecting' | 'disconnected';
  number: string | null;
  connected_at: string | null;
  instance_name: string | null;
  warning?: string;
}

interface Branch {
  id: number;
  name: string;
}

interface Props {
  onBack?: () => void;
}

export function WhatsAppSettings({ onBack }: Props) {
  const { admin } = useApp();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Carregar filiais disponíveis
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await adminApi.get('/admin/branches');
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setBranches(list);

        // Se admin não é master, usa a filial dele diretamente
        if (admin?.role !== 'master' && admin?.branch_id) {
          setSelectedBranchId(String(admin.branch_id));
        } else if (list.length > 0) {
          setSelectedBranchId(String(list[0].id));
        }
      } catch {
        toast.error('Erro ao carregar filiais');
      }
    };
    loadBranches();
  }, [admin]);

  // Verificar status ao trocar de filial
  const checkStatus = useCallback(async (branchId: string) => {
    if (!branchId) return;
    setStatusLoading(true);
    try {
      const data = await adminApi.status(branchId);
      setStatus(data);
      // Se ainda connecting, mantém QR Code visível
      if (data.status !== 'connecting') {
        setQrCode(null);
      }
    } catch {
      // silencioso
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      checkStatus(selectedBranchId);
    }
  }, [selectedBranchId, checkStatus]);

  // Polling quando status for 'connecting'
  useEffect(() => {
    if (status?.status === 'connecting') {
      const interval = setInterval(() => {
        checkStatus(selectedBranchId);
      }, 5000);
      setPollingInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.status, selectedBranchId]);

  const handleConnect = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setQrCode(null);
    try {
      const data = await adminApi.connect(Number(selectedBranchId));
      if (data.qrcode) {
        setQrCode(data.qrcode);
        setStatus(prev => ({ ...prev!, status: 'connecting' }));
        toast.info('Escaneie o QR Code com o WhatsApp');
      } else if (data.retry) {
        toast.warning(data.message ?? 'QR Code sendo gerado, clique em "Atualizar QR Code"');
        setStatus(prev => ({ ...prev!, status: 'connecting' }));
      } else if (data.status === 'connected') {
        toast.success('WhatsApp já está conectado!');
        checkStatus(selectedBranchId);
      }
    } catch (err: any) {
      toast.error('Erro ao conectar: ' + (err?.message ?? 'Tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshQrCode = async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    try {
      const data = await adminApi.refreshQrCode(selectedBranchId);
      if (data.qrcode) {
        setQrCode(data.qrcode);
        toast.info('QR Code atualizado');
      } else if (data.status === 'connected') {
        toast.success('WhatsApp já está conectado!');
        setQrCode(null);
        checkStatus(selectedBranchId);
      }
    } catch {
      toast.error('Erro ao atualizar QR Code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedBranchId) return;
    if (!confirm('Deseja desconectar o WhatsApp desta filial?')) return;
    setLoading(true);
    try {
      await adminApi.disconnect(selectedBranchId);
      setStatus(prev => ({ ...prev!, status: 'disconnected', number: null, connected_at: null }));
      setQrCode(null);
      toast.success('WhatsApp desconectado');
    } catch {
      toast.error('Erro ao desconectar');
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = {
    connected: {
      color: 'bg-green-100 text-green-800',
      label: '✅ Conectado',
      icon: <Wifi className="w-4 h-4 text-green-600" />,
    },
    connecting: {
      color: 'bg-yellow-100 text-yellow-800',
      label: '⏳ Conectando...',
      icon: <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />,
    },
    disconnected: {
      color: 'bg-red-100 text-red-800',
      label: '❌ Desconectado',
      icon: <WifiOff className="w-4 h-4 text-red-600" />,
    },
  };

  const currentStatus = status?.status ?? 'disconnected';
  const info = statusInfo[currentStatus];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Seleção de filial (somente master vê) */}
      {admin?.role === 'master' && branches.length > 1 && (
        <Card>
          <CardContent className="pt-6">
            <label className="text-sm font-medium mb-2 block">Filial</label>
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar filial" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(b => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Status atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Status da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando status...
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {info.icon}
              <Badge className={info.color}>{info.label}</Badge>
              {status?.number && (
                <span className="text-sm text-muted-foreground">📱 +{status.number}</span>
              )}
              {status?.instance_name && (
                <span className="text-xs text-muted-foreground font-mono">
                  ({status.instance_name})
                </span>
              )}
            </div>
          )}

          {status?.connected_at && (
            <p className="text-xs text-muted-foreground">
              Conectado em: {new Date(status.connected_at).toLocaleString('pt-BR')}
            </p>
          )}

          {status?.warning && (
            <p className="text-xs text-amber-600">⚠️ {status.warning}</p>
          )}

          <Separator />

          <div className="flex flex-wrap gap-2">
            {/* Botão conectar — aparece quando desconectado */}
            {currentStatus === 'disconnected' && (
              <Button onClick={handleConnect} disabled={loading || !selectedBranchId} className="!bg-green-600 hover:!bg-green-700 !text-white gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                Conectar WhatsApp
              </Button>
            )}

            {/* Atualizar QR Code — aparece quando connecting */}
            {currentStatus === 'connecting' && (
              <Button onClick={handleRefreshQrCode} disabled={loading} variant="outline" className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Atualizar QR Code
              </Button>
            )}

            {/* Verificar status */}
            <Button
              onClick={() => checkStatus(selectedBranchId)}
              disabled={statusLoading || !selectedBranchId}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
              Verificar Status
            </Button>

            {/* Desconectar — aparece quando connected ou connecting */}
            {(currentStatus === 'connected' || currentStatus === 'connecting') && (
              <Button onClick={handleDisconnect} disabled={loading} variant="destructive" className="gap-2">
                <LogOut className="w-4 h-4" />
                Desconectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      {qrCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Escanear QR Code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Abra o WhatsApp no celular → <strong>Dispositivos conectados</strong> → <strong>Conectar dispositivo</strong> → Escaneie o QR Code abaixo
            </p>
            <div className="border-4 border-green-500 rounded-xl p-2 bg-white">
              <img
                src={qrCode}
                alt="QR Code WhatsApp"
                className="w-64 h-64 object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O QR Code expira em alguns minutos. Clique em "Atualizar QR Code" se necessário.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      {currentStatus === 'disconnected' && !qrCode && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-3">Como conectar:</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Clique em <strong>"Conectar WhatsApp"</strong></li>
              <li>Aguarde o QR Code aparecer</li>
              <li>Abra o WhatsApp no celular</li>
              <li>Vá em <strong>Dispositivos conectados → Conectar dispositivo</strong></li>
              <li>Escaneie o QR Code</li>
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
