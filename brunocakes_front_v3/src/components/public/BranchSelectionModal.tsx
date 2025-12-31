import { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle2, XCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Branch } from '../../types/admin';
import { apiRequest } from '../../api/common/request';
import { toast } from 'sonner';

interface BranchSelectionModalProps {
  open: boolean;
  onBranchSelect: (branch: Branch) => void;
  allowClose?: boolean; // Permite fechar sem selecionar (quando está trocando de filial)
}

export function BranchSelectionModal({ open, onBranchSelect, allowClose = false }: BranchSelectionModalProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  useEffect(() => {
    if (open) {
      // Resetar seleção quando modal abrir
      setSelectedBranch(null);
      fetchBranches();
    }
  }, [open]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      console.log('🔍 Buscando filiais em /branches...');
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8191/api';
      const url = `${API_BASE_URL}/branches`;
      
      console.log('📡 URL completa:', url);
      const response = await apiRequest(url);
      console.log('✅ Resposta da API:', response);
      
      const branchList = Array.isArray(response) ? response : 
                         (response?.data ? response.data : []);
      
      console.log('🏪 Filiais processadas:', branchList);
      setBranches(branchList);
      
      if (branchList.length === 0) {
        console.warn('⚠️ Nenhuma filial encontrada na resposta');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar filiais:', error);
      toast.error('Erro ao carregar filiais. Verifique sua conexão.');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
  };

  const handleConfirm = () => {
    if (selectedBranch) {
      onBranchSelect(selectedBranch);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Se allowClose=true (trocando filial), não bloqueia
      // Se allowClose=false (primeira vez), só permite fechar após selecionar
      if (!isOpen && !allowClose && !selectedBranch) {
        // Impede o fechamento na primeira seleção
      }
    }}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Só bloqueia se não permitir fechar E não tiver selecionado
          if (!allowClose && !selectedBranch) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Só bloqueia se não permitir fechar E não tiver selecionado
          if (!allowClose && !selectedBranch) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">
            🏪 Escolha sua filial preferida
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-2">
            Selecione a filial mais próxima de você para continuar
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando filiais...</p>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma filial disponível no momento.</p>
              <Button onClick={fetchBranches}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {branches.map((branch) => (
                  <Card 
                    key={branch.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedBranch?.id === branch.id 
                        ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
                        : ''
                    }`}
                    onClick={() => handleSelectBranch(branch)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-base">{branch.name}</h3>
                          <span className="text-xs text-muted-foreground">{branch.code}</span>
                        </div>
                        {branch.is_open ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-medium">Aberta</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="w-4 h-4" />
                            <span className="text-xs font-medium">Fechada</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-muted-foreground line-clamp-2">{branch.address}</span>
                        </div>

                        {branch.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">📞 {branch.phone}</span>
                          </div>
                        )}

                        {branch.opening_hours && (
                          <div className="flex items-start gap-2">
                            <Clock className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-muted-foreground text-xs line-clamp-2">
                              {typeof branch.opening_hours === 'string' 
                                ? branch.opening_hours 
                                : JSON.stringify(branch.opening_hours)}
                            </span>
                          </div>
                        )}
                      </div>

                      {selectedBranch?.id === branch.id && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-primary">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-medium text-sm">Selecionada</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center pt-4 border-t mt-4">
                <Button 
                  onClick={handleConfirm}
                  disabled={!selectedBranch}
                  size="lg"
                  className="w-full md:w-auto min-w-[200px]"
                >
                  {selectedBranch ? `Continuar com ${selectedBranch.name}` : 'Selecione uma filial'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
