import { useState, useEffect, useCallback } from 'react';
import { adminApiRequest } from '../../api/common/request';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Bike, Phone, CreditCard, CheckCircle2, CircleDollarSign,
  Calendar, ToggleLeft, ToggleRight, Save, AlertCircle,
  ClipboardList, TrendingUp,
} from 'lucide-react';

interface Motorcyclist {
  id: number;
  name: string;
  phone: string | null;
  moto: string | null;
  plate: string | null;
  pix_key: string | null;
  price_per_delivery: number;
  is_active: boolean;
  total_deliveries: number;
  total_due: number;
  total_paid: number;
  total_balance: number;
}

interface DeliveryRecord {
  id: number;
  motorcyclist_id: number;
  delivery_date: string;
  deliveries_count: number;
  amount_due: number;
  amount_paid: number;
  is_paid: boolean;
  paid_at: string | null;
  notes: string | null;
  balance: number;
}

const emptyMoto = { name: '', phone: '', moto: '', plate: '', pix_key: '', price_per_delivery: 0, is_active: true };
const emptyRecord = { delivery_date: new Date().toISOString().split('T')[0], deliveries_count: 0, amount_paid: 0, is_paid: false, paid_at: '', notes: '' };
const BTN_ORANGE = { backgroundColor: '#f97316', color: '#fff' } as const;
const API = '/admin/motorcyclists';

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtDate = (d: string | null) => { if (!d) return '—'; const [y, m, day] = d.split('-'); return `${day}/${m}/${y}`; };
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const maskPlate = (v: string) => { const r = v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 7); return r.length <= 3 ? r : `${r.slice(0, 3)}-${r.slice(3)}`; };

export default function DeliveriesPage() {
  const [motorcyclists, setMotorcyclists] = useState<Motorcyclist[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [records, setRecords] = useState<Record<number, DeliveryRecord[]>>({});
  const [loadingRecords, setLoadingRecords] = useState<number | null>(null);

  const [showMotoForm, setShowMotoForm] = useState(false);
  const [editingMoto, setEditingMoto] = useState<Motorcyclist | null>(null);
  const [motoForm, setMotoForm] = useState({ ...emptyMoto });
  const [savingMoto, setSavingMoto] = useState(false);

  const [showRecordForm, setShowRecordForm] = useState<number | null>(null);
  const [editingRecord, setEditingRecord] = useState<DeliveryRecord | null>(null);
  const [recordForm, setRecordForm] = useState({ ...emptyRecord });
  const [savingRecord, setSavingRecord] = useState(false);

  const fetchMotorcyclists = useCallback(async () => {
    setLoading(true);
    try { const d = await adminApiRequest(API); setMotorcyclists(Array.isArray(d) ? d : []); }
    catch { toast.error('Erro ao carregar motociclistas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMotorcyclists(); }, [fetchMotorcyclists]);

  const fetchRecords = useCallback(async (motoId: number) => {
    setLoadingRecords(motoId);
    try { const d = await adminApiRequest(`${API}/${motoId}/records`); setRecords(prev => ({ ...prev, [motoId]: Array.isArray(d) ? d : [] })); }
    catch { toast.error('Erro ao carregar registros'); }
    finally { setLoadingRecords(null); }
  }, []);

  const toggleExpand = (id: number) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!records[id]) fetchRecords(id);
  };

  const openNewMoto = () => { setEditingMoto(null); setMotoForm({ ...emptyMoto }); setShowMotoForm(true); };
  const openEditMoto = (m: Motorcyclist) => {
    setEditingMoto(m);
    setMotoForm({ name: m.name, phone: m.phone ?? '', moto: m.moto ?? '', plate: m.plate ?? '', pix_key: m.pix_key ?? '', price_per_delivery: m.price_per_delivery, is_active: m.is_active });
    setShowMotoForm(true);
  };

  const saveMoto = async () => {
    if (!motoForm.name.trim()) { toast.error('Nome obrigatorio'); return; }
    setSavingMoto(true);
    try {
      if (editingMoto) {
        const u = await adminApiRequest(`${API}/${editingMoto.id}`, { method: 'PUT', body: JSON.stringify(motoForm) });
        setMotorcyclists(prev => prev.map(m => m.id === editingMoto.id ? { ...m, ...u } : m));
        toast.success('Atualizado');
      } else {
        await adminApiRequest(API, { method: 'POST', body: JSON.stringify(motoForm) });
        toast.success('Cadastrado');
        fetchMotorcyclists();
      }
      setShowMotoForm(false);
    } catch { toast.error('Erro ao salvar'); }
    finally { setSavingMoto(false); }
  };

  const deleteMoto = async (id: number, name: string) => {
    if (!confirm(`Remover ${name}?`)) return;
    try { await adminApiRequest(`${API}/${id}`, { method: 'DELETE' }); setMotorcyclists(prev => prev.filter(m => m.id !== id)); toast.success('Removido'); }
    catch { toast.error('Erro ao remover'); }
  };

  const toggleActive = async (m: Motorcyclist) => {
    try { const r = await adminApiRequest(`${API}/${m.id}/toggle-active`, { method: 'PATCH' }); setMotorcyclists(prev => prev.map(x => x.id === m.id ? { ...x, is_active: r.is_active } : x)); }
    catch { toast.error('Erro ao alterar status'); }
  };

  const openNewRecord = (motoId: number) => { setEditingRecord(null); setRecordForm({ ...emptyRecord }); setShowRecordForm(motoId); };
  const openEditRecord = (r: DeliveryRecord) => {
    setEditingRecord(r);
    setRecordForm({ delivery_date: r.delivery_date, deliveries_count: r.deliveries_count, amount_paid: r.amount_paid, is_paid: r.is_paid, paid_at: r.paid_at ?? '', notes: r.notes ?? '' });
    setShowRecordForm(r.motorcyclist_id);
  };

  const saveRecord = async () => {
    if (!showRecordForm) return;
    setSavingRecord(true);
    try {
      const payload = { ...recordForm, paid_at: recordForm.paid_at || null, notes: recordForm.notes || null };
      let saved: DeliveryRecord;
      if (editingRecord) {
        saved = await adminApiRequest(`${API}/${showRecordForm}/records/${editingRecord.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        setRecords(prev => ({ ...prev, [showRecordForm]: (prev[showRecordForm] ?? []).map(r => r.id === editingRecord.id ? saved : r) }));
        toast.success('Registro atualizado');
      } else {
        saved = await adminApiRequest(`${API}/${showRecordForm}/records`, { method: 'POST', body: JSON.stringify(payload) });
        setRecords(prev => ({ ...prev, [showRecordForm]: [saved, ...(prev[showRecordForm] ?? [])] }));
        toast.success('Registro adicionado');
      }
      fetchMotorcyclists();
      setShowRecordForm(null);
    } catch { toast.error('Erro ao salvar registro'); }
    finally { setSavingRecord(false); }
  };

  const deleteRecord = async (motoId: number, recordId: number) => {
    if (!confirm('Remover este registro?')) return;
    try {
      await adminApiRequest(`${API}/${motoId}/records/${recordId}`, { method: 'DELETE' });
      setRecords(prev => ({ ...prev, [motoId]: (prev[motoId] ?? []).filter(r => r.id !== recordId) }));
      fetchMotorcyclists();
      toast.success('Removido');
    } catch { toast.error('Erro ao remover'); }
  };

  const markPaid = async (motoId: number, r: DeliveryRecord) => {
    try {
      const u = await adminApiRequest(`${API}/${motoId}/records/${r.id}`, { method: 'PUT', body: JSON.stringify({ is_paid: true, amount_paid: r.amount_due, paid_at: new Date().toISOString().split('T')[0] }) });
      setRecords(prev => ({ ...prev, [motoId]: (prev[motoId] ?? []).map(x => x.id === r.id ? u : x) }));
      fetchMotorcyclists();
      toast.success('Marcado como pago');
    } catch { toast.error('Erro ao marcar pagamento'); }
  };

  const totals = {
    active: motorcyclists.filter(m => m.is_active).length,
    balance: motorcyclists.reduce((s, m) => s + m.total_balance, 0),
    paid: motorcyclists.reduce((s, m) => s + m.total_paid, 0),
    deliveries: motorcyclists.reduce((s, m) => s + m.total_deliveries, 0),
  };

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto">

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bike className="h-6 w-6 text-orange-500" /> Entregas</h1>
          <p className="text-sm text-muted-foreground">Gestao de motociclistas e registros de entrega</p>
        </div>
        <Button onClick={openNewMoto} style={BTN_ORANGE}><Plus className="h-4 w-4 mr-1" /> Novo Motociclista</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Ativos hoje</p><p className="text-2xl font-bold text-green-600">{totals.active}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total entregas</p><p className="text-2xl font-bold">{totals.deliveries}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total pago</p><p className="text-2xl font-bold text-blue-600">{fmt(totals.paid)}</p></CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Saldo a pagar</p>
          <p className={`text-2xl font-bold ${totals.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(totals.balance)}</p>
        </CardContent></Card>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-10">Carregando...</p>
      ) : motorcyclists.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Bike className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum motociclista cadastrado</p>
          <Button onClick={openNewMoto} variant="outline" className="mt-4"><Plus className="h-4 w-4 mr-1" /> Cadastrar primeiro</Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {motorcyclists.map(m => (
            <Card key={m.id} className={!m.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-0">
                <div className="flex items-center gap-3 p-4 flex-wrap">
                  <button onClick={() => toggleActive(m)} className="shrink-0">
                    {m.is_active ? <ToggleRight className="h-7 w-7 text-green-500" /> : <ToggleLeft className="h-7 w-7 text-gray-400" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{m.name}</span>
                      {m.is_active ? <Badge className="bg-green-100 text-green-700 text-xs">Ativo</Badge> : <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground mt-0.5">
                      {m.moto && <span className="flex items-center gap-1"><Bike className="h-3 w-3" />{m.moto}{m.plate && ` - ${m.plate}`}</span>}
                      {m.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone}</span>}
                      {m.pix_key && <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />PIX: {m.pix_key}</span>}
                      <span className="flex items-center gap-1"><CircleDollarSign className="h-3 w-3" />{fmt(m.price_per_delivery)}/entrega</span>
                    </div>
                  </div>
                  <div className="flex gap-4 text-sm shrink-0">
                    <div className="text-center"><p className="text-xs text-muted-foreground">Entregas</p><p className="font-bold">{m.total_deliveries}</p></div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">A pagar</p>
                      <p className={`font-bold ${m.total_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(m.total_balance)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEditMoto(m)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-red-500" onClick={() => deleteMoto(m.id, m.name)}><Trash2 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => toggleExpand(m.id)}>
                      {expanded === m.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                {expanded === m.id && (
                  <div className="border-t bg-gray-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm flex items-center gap-1"><ClipboardList className="h-4 w-4" /> Registros de Entregas</h3>
                      <Button size="sm" onClick={() => openNewRecord(m.id)} style={BTN_ORANGE} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Adicionar Registro
                      </Button>
                    </div>
                    {loadingRecords === m.id ? (
                      <p className="text-xs text-center py-4 text-muted-foreground">Carregando...</p>
                    ) : !records[m.id] || records[m.id].length === 0 ? (
                      <p className="text-xs text-center py-4 text-muted-foreground">Nenhum registro. Clique em "Adicionar Registro" para comecar.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 bg-white rounded-lg p-3 border text-center text-xs">
                          <div><p className="text-muted-foreground">Total</p><p className="font-bold text-sm">{fmt(m.total_due)}</p></div>
                          <div><p className="text-muted-foreground">Pago</p><p className="font-bold text-sm text-blue-600">{fmt(m.total_paid)}</p></div>
                          <div>
                            <p className="text-muted-foreground">Resta</p>
                            <p className={`font-bold text-sm ${m.total_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(m.total_balance)}</p>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-muted-foreground border-b">
                                <th className="text-left py-1 pr-3">Data</th>
                                <th className="text-right py-1 pr-3">Entregas</th>
                                <th className="text-right py-1 pr-3">A Receber</th>
                                <th className="text-right py-1 pr-3">Pago</th>
                                <th className="text-right py-1 pr-3">Saldo</th>
                                <th className="text-center py-1 pr-3">Status</th>
                                <th className="text-left py-1">Obs</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {records[m.id].map(r => (
                                <tr key={r.id} className="border-b last:border-0 hover:bg-white/70">
                                  <td className="py-1.5 pr-3 whitespace-nowrap">
                                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" />{fmtDate(r.delivery_date)}</span>
                                  </td>
                                  <td className="text-right pr-3 font-medium">{r.deliveries_count}</td>
                                  <td className="text-right pr-3">{fmt(r.amount_due)}</td>
                                  <td className="text-right pr-3 text-blue-600">{fmt(r.amount_paid)}</td>
                                  <td className={`text-right pr-3 font-medium ${r.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(r.balance)}</td>
                                  <td className="text-center pr-3">
                                    {r.is_paid ? (
                                      <span className="flex items-center justify-center gap-1 text-green-600"><CheckCircle2 className="h-3.5 w-3.5" /><span>{fmtDate(r.paid_at)}</span></span>
                                    ) : (
                                      <button onClick={() => markPaid(m.id, r)} className="flex items-center justify-center gap-1 text-amber-600 hover:text-amber-800">
                                        <AlertCircle className="h-3.5 w-3.5" /><span>Pendente</span>
                                      </button>
                                    )}
                                  </td>
                                  <td className="pr-3 max-w-[120px] truncate text-muted-foreground" title={r.notes ?? ''}>{r.notes || '—'}</td>
                                  <td className="flex items-center gap-0.5 py-1">
                                    <button onClick={() => openEditRecord(r)} className="p-1 hover:text-orange-600"><Pencil className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => deleteRecord(m.id, r.id)} className="p-1 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Motociclista */}
      <Dialog open={showMotoForm} onOpenChange={setShowMotoForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bike className="h-5 w-5 text-orange-500" />
              {editingMoto ? 'Editar Motociclista' : 'Novo Motociclista'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome *</label>
              <Input value={motoForm.name} onChange={e => setMotoForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome completo" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                <Input value={motoForm.phone ?? ''} onChange={e => setMotoForm(p => ({ ...p, phone: maskPhone(e.target.value) }))} placeholder="(84) 99999-9999" maxLength={15} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Moto</label>
                <Input value={motoForm.moto ?? ''} onChange={e => setMotoForm(p => ({ ...p, moto: e.target.value }))} placeholder="Honda CG 160" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Placa</label>
                <Input value={motoForm.plate ?? ''} onChange={e => setMotoForm(p => ({ ...p, plate: maskPlate(e.target.value) }))} placeholder="ABC-1234" maxLength={8} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Valor por entrega (R$)</label>
                <Input type="number" min={0} step={0.5} value={motoForm.price_per_delivery} onChange={e => setMotoForm(p => ({ ...p, price_per_delivery: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Chave PIX</label>
              <Input value={motoForm.pix_key ?? ''} onChange={e => setMotoForm(p => ({ ...p, pix_key: e.target.value }))} placeholder="CPF, e-mail, telefone ou chave aleatoria" />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="moto-active" checked={motoForm.is_active} onChange={e => setMotoForm(p => ({ ...p, is_active: e.target.checked }))} className="h-4 w-4 rounded" />
              <label htmlFor="moto-active" className="text-sm">Ativo para trabalhar hoje</label>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowMotoForm(false)}>Cancelar</Button>
            <Button onClick={saveMoto} disabled={savingMoto} style={BTN_ORANGE}>
              <Save className="h-4 w-4 mr-1" />{savingMoto ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Registro de Entregas */}
      <Dialog open={showRecordForm !== null} onOpenChange={(open: boolean) => { if (!open) setShowRecordForm(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              {editingRecord ? 'Editar Registro' : 'Novo Registro de Entrega'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {(() => {
              const moto = motorcyclists.find(x => x.id === showRecordForm);
              const calc = (recordForm.deliveries_count || 0) * (moto?.price_per_delivery || 0);
              return calc > 0 ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-center">
                  <span className="text-muted-foreground">Valor calculado: </span>
                  <span className="font-bold text-orange-700">{fmt(calc)}</span>
                  <span className="text-muted-foreground text-xs block">{recordForm.deliveries_count} entregas x {fmt(moto?.price_per_delivery ?? 0)}</span>
                </div>
              ) : null;
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data *</label>
                <Input type="date" value={recordForm.delivery_date} onChange={e => setRecordForm(p => ({ ...p, delivery_date: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Qtd. de Entregas *</label>
                <Input type="number" min={0} value={recordForm.deliveries_count} onChange={e => setRecordForm(p => ({ ...p, deliveries_count: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Valor ja pago (R$)</label>
                <Input type="number" min={0} step={0.01} value={recordForm.amount_paid} onChange={e => setRecordForm(p => ({ ...p, amount_paid: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Data do pagamento</label>
                <Input type="date" value={recordForm.paid_at} onChange={e => setRecordForm(p => ({ ...p, paid_at: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="rec-paid" checked={recordForm.is_paid} onChange={e => setRecordForm(p => ({ ...p, is_paid: e.target.checked }))} className="h-4 w-4 rounded" />
              <label htmlFor="rec-paid" className="text-sm">Marcar como totalmente pago</label>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Observacoes</label>
              <Input value={recordForm.notes} onChange={e => setRecordForm(p => ({ ...p, notes: e.target.value }))} placeholder="Bairros atendidos, ocorrencias..." />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => setShowRecordForm(null)}>Cancelar</Button>
            <Button onClick={saveRecord} disabled={savingRecord} style={BTN_ORANGE}>
              <Save className="h-4 w-4 mr-1" />{savingRecord ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
