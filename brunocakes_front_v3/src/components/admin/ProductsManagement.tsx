import { useState } from 'react';
import { useApp } from '../../App';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, Package, Calendar, Star, Percent, AlertTriangle } from 'lucide-react';

export function ProductsManagement() {
  const { products, addProduct, updateProduct, toggleProduct } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    promotionPrice: '',
    category: '',
    file: null as File | null,
    available: true,
    stock: '',
    expiryDate: '',
    isPromotion: false,
    isNew: false,
  });

  const categories = [...new Set(products.map(p => p.category))];

  // Função para formatar valor monetário brasileiro
  const formatCurrency = (value: string) => {
    // Remove tudo que não é dígito
    const numericValue = value.replace(/\D/g, '');
    
    // Converte para número e divide por 100 para ter centavos
    const floatValue = parseFloat(numericValue) / 100;
    
    // Formata como moeda brasileira
    return floatValue.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Função para converter valor formatado de volta para número
  const parseCurrency = (value: string) => {
    return value.replace(/[^\d,]/g, '').replace(',', '.');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      promotionPrice: '',
      category: '',
      file: null,
      available: true,
      stock: '',
      expiryDate: '',
      isPromotion: false,
      isNew: false,
    });
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }),
      promotionPrice: product.promotionPrice ? product.promotionPrice.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }) : '',
      category: product.category,
      file: null,
      available: product.available || product.is_active,
      stock: product.stock.toString(),
      expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : '',
      isPromotion: product.isPromotion || product.is_promo,
      isNew: product.isNew || product.is_new,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.stock) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Converter valores formatados para números
    const priceValue = parseFloat(formData.price.replace(/[^\d,]/g, '').replace(',', '.'));
    const promotionPriceValue = formData.promotionPrice ? parseFloat(formData.promotionPrice.replace(/[^\d,]/g, '').replace(',', '.')) : undefined;

    if (formData.isPromotion && (!promotionPriceValue || promotionPriceValue >= priceValue)) {
      toast.error('Preço promocional deve ser menor que o preço normal');
      return;
    }

    // Gerar slug simples baseado no nome
    const generateSlug = (name: string) => {
      return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim();
    };

    const productData = {
      name: formData.name,
      slug: generateSlug(formData.name),
      description: formData.description,
      price: priceValue,
      promotion_price: promotionPriceValue,
      category: formData.category,
      quantity: parseInt(formData.stock),
      expires_at: formData.expiryDate || undefined,
      is_promo: formData.isPromotion,
      is_new: formData.isNew,
      is_active: formData.available,
      file: formData.file, // Para upload de imagem
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
    } else {
      addProduct(productData);
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (productId: string, productName: string) => {
    if (confirm(`Tem certeza que deseja desativar "${productName}"?`)) {
      toggleProduct(productId);
    }
  };

  const handleToggleAvailability = (productId: string, currentStatus: boolean) => {
    toggleProduct(productId);
    toast.success(`Produto ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    } else if (stock <= 5) {
      return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Estoque Baixo</Badge>;
    } else {
      return <Badge variant="outline" className="text-green-600 border-green-600">Em Estoque</Badge>;
    }
  };

  const lowStockCount = products.filter(p => p.stock <= 5 && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Gerenciar Doces</h1>
          <p className="text-muted-foreground">Controle total do seu estoque de doces</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Doce
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Editar Doce' : 'Novo Doce'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Doce *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Brigadeiro Gourmet"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Brigadeiros">Brigadeiros</SelectItem>
                      <SelectItem value="Trufas">Trufas</SelectItem>
                      <SelectItem value="Beijinhos">Beijinhos</SelectItem>
                      <SelectItem value="Brownies">Brownies</SelectItem>
                      <SelectItem value="Cupcakes">Cupcakes</SelectItem>
                      <SelectItem value="Bolos">Bolos</SelectItem>
                      <SelectItem value="Docinhos">Docinhos</SelectItem>
                      <SelectItem value="Tortas">Tortas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o doce, seus ingredientes principais e diferenciais"
                  rows={3}
                  required
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço Normal *</Label>
                  <Input
                    id="price"
                    type="text"
                    value={formData.price}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      const formattedValue = rawValue ? (parseFloat(rawValue) / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 2
                      }) : '';
                      setFormData(prev => ({ ...prev, price: formattedValue }));
                    }}
                    placeholder="R$ 0,00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="promotionPrice">Preço Promocional</Label>
                  <Input
                    id="promotionPrice"
                    type="text"
                    value={formData.promotionPrice}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, '');
                      const formattedValue = rawValue ? (parseFloat(rawValue) / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 2
                      }) : '';
                      setFormData(prev => ({ ...prev, promotionPrice: formattedValue }));
                    }}
                    placeholder="R$ 0,00"
                    disabled={!formData.isPromotion}
                  />
                </div>
              </div>

              {/* Stock and Expiry */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Quantidade em Estoque *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Data de Validade</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="image">Imagem do Produto</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setFormData(prev => ({ ...prev, file }));
                  }}
                  className="cursor-pointer"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Formatos aceitos: JPG, PNG, GIF (máximo 5MB)
                </p>
              </div>

              {/* Flags */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="available"
                    checked={formData.available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: !!checked }))}
                  />
                  <Label htmlFor="available">Produto Disponível</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPromotion"
                    checked={formData.isPromotion}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      isPromotion: !!checked,
                      promotionPrice: !checked ? '' : prev.promotionPrice
                    }))}
                  />
                  <Label htmlFor="isPromotion">Em Promoção</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isNew"
                    checked={formData.isNew}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNew: !!checked }))}
                  />
                  <Label htmlFor="isNew">Novidade</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingProduct ? 'Atualizar' : 'Adicionar'} Doce
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stock Alerts */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">Alertas de Estoque</span>
            </div>
            <div className="mt-2 text-sm text-yellow-700">
              {outOfStockCount > 0 && (
                <p>{outOfStockCount} produtos sem estoque</p>
              )}
              {lowStockCount > 0 && (
                <p>{lowStockCount} produtos com estoque baixo (≤5 unidades)</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar doces..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="sm:w-48">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Doces ({filteredProducts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{product.name}</p>
                          {(product.isNew || product.is_new) && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Novo
                            </Badge>
                          )}
                          {(product.isPromotion || product.is_promo) && (
                            <Badge variant="destructive" className="text-xs">
                              <Percent className="h-3 w-3 mr-1" />
                              Promoção
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground max-w-xs truncate">
                          {product.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {(product.isPromotion || product.is_promo) && (product.promotionPrice || product.promotion_price) ? (
                        <div>
                          <div className="font-semibold text-green-600">
                            {formatPrice(product.promotionPrice || product.promotion_price)}
                          </div>
                          <div className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.price)}
                          </div>
                        </div>
                      ) : (
                        <div className="font-semibold">
                          {formatPrice(product.price)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{product.stock}</span>
                      {getStockBadge(product.stock)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAvailability(product.id, product.available || product.is_active)}
                    >
                      <Badge className={(product.available || product.is_active) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {(product.available || product.is_active) ? 'Disponível' : 'Indisponível'}
                      </Badge>
                    </Button>
                  </TableCell>
                  <TableCell>
                    {product.expiryDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(product.expiryDate).toLocaleDateString('pt-BR')}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}