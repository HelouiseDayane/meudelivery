import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function ClientFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
    status: 'active',
    notes: '',
    birthDate: '',
    preferences: '',
    allergens: ''
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);
        setFormData(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setFormData(prev => ({ ...prev, avatar: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (formData.name && formData.email && formData.phone && formData.address) {
      toast.success(
        isEdit 
          ? 'Cliente atualizado com sucesso!' 
          : 'Cliente cadastrado com sucesso!'
      );
      navigate('/clients');
    } else {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/clients')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl">
            {isEdit ? 'Editar Cliente' : 'Novo Cliente'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Dados básicos do cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarPreview || formData.avatar} />
                  <AvatarFallback>
                    {formData.name ? formData.name.split(' ').map(n => n[0]).join('') : 'CL'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label>Foto do Cliente</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                    </Label>
                    {avatarPreview && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={removeAvatar}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nome do cliente"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleInputChange('birthDate')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, status: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Address and Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço e Preferências</CardTitle>
              <CardDescription>
                Localização e informações adicionais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo *</Label>
                <Textarea
                  id="address"
                  placeholder="Rua, número, complemento, bairro, cidade, CEP"
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferences">Preferências</Label>
                <Textarea
                  id="preferences"
                  placeholder="Doces preferidos, sabores favoritos, etc."
                  value={formData.preferences}
                  onChange={handleInputChange('preferences')}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergens">Alergias/Restrições</Label>
                <Input
                  id="allergens"
                  type="text"
                  placeholder="Ex: Leite, Glúten, Amendoim"
                  value={formData.allergens}
                  onChange={handleInputChange('allergens')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas internas sobre o cliente..."
                  value={formData.notes}
                  onChange={handleInputChange('notes')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historical Data (only for edit mode) */}
        {isEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Histórico do Cliente</CardTitle>
              <CardDescription>
                Informações sobre pedidos e relacionamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl">15</p>
                  <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl">R$ 890</p>
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl">R$ 59</p>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl">4.8★</p>
                  <p className="text-sm text-muted-foreground">Avaliação Média</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/clients')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading 
              ? (isEdit ? 'Atualizando...' : 'Cadastrando...') 
              : (isEdit ? 'Atualizar Cliente' : 'Cadastrar Cliente')
            }
          </Button>
        </div>
      </form>
    </div>
  );
}