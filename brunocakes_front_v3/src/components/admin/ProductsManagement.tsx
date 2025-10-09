import { useState, useEffect } from 'react';
import { useApp } from '../../App';
import { adminApi } from '../../api_admin';
import { getProductImageUrl } from '../../api';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock?: number;
  quantity?: number;
  is_active: boolean | number | string;
  is_promo?: boolean;
  is_new?: boolean;
  image_url?: string;
  image?: string;
  promotionPrice?: number;
  promotion_price?: number;
  expiryDate?: string;
  expires_at?: string;
  available?: boolean;
  isPromotion?: boolean;
  isNew?: boolean;
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { toast } from 'sonner';
import { Plus, Edit, Search, Package, Calendar, Star, Percent, AlertTriangle, RefreshCw } from 'lucide-react';

export function ProductsManagement() {
  const { adminProducts, setAdminProducts, refreshProducts } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingStock, setEditingStock] = useState<{ productId: string; value: string } | null>(null);

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

  const categories = [...new Set(adminProducts.map((p: any) => p.category).filter((cat: string) => cat && cat.trim() !== ''))];

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

  // Admin deve ver todos os produtos, inclusive inativos
  useEffect(() => {
    import('../../api_admin').then(({ adminApi }) => {
      adminApi.getProducts().then((products) => {
        setAdminProducts(products);
      });
    });
  }, [setAdminProducts]);
  const filteredProducts = adminProducts.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    // Não filtra por status, sempre mostra todos
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
      name: product.name || '',
      description: product.description || '',
      price: product.price ? product.price.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }) : '',
      promotionPrice: (product.promotionPrice || product.promotion_price) ? (product.promotionPrice || product.promotion_price).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }) : '',
      category: product.category || '',
      file: null,
      available: product.available || product.is_active || false,
      stock: (product.stock || product.quantity || 0).toString(),
      expiryDate: (product.expiryDate || product.expires_at) ? new Date(product.expiryDate || product.expires_at).toISOString().split('T')[0] : '',
      isPromotion: product.isPromotion || product.is_promo || false,
      isNew: product.isNew || product.is_new || false,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    
    // Validação mais específica
    if (!formData.name?.trim()) {
      toast.error('Nome do produto é obrigatório');
      return;
    }
    
    if (!formData.description?.trim()) {
      toast.error('Descrição do produto é obrigatória');
      return;
    }
    
    if (!formData.price?.trim()) {
      toast.error('Preço do produto é obrigatório');
      return;
    }
    
    if (!formData.category?.trim()) {
      toast.error('Categoria do produto é obrigatória');
      return;
    }
    
    if (!formData.stock?.trim()) {
      toast.error('Quantidade em estoque é obrigatória');
      return;
    }

    try {
      // Converter valores formatados para números
      const priceValue = parseFloat(formData.price.replace(/[^\d,]/g, '').replace(',', '.'));
      const promotionPriceValue = formData.promotionPrice ? parseFloat(formData.promotionPrice.replace(/[^\d,]/g, '').replace(',', '.')) : null;
      const stockValue = parseInt(formData.stock);

      // Validações numéricas
      if (isNaN(priceValue) || priceValue <= 0) {
        toast.error('Preço deve ser um número válido maior que zero');
        return;
      }

      if (isNaN(stockValue) || stockValue < 0) {
        toast.error('Estoque deve ser um número válido maior ou igual a zero');
        return;
      }

      if (formData.isPromotion && (!promotionPriceValue || promotionPriceValue >= priceValue)) {
        toast.error('Preço promocional deve ser menor que o preço normal');
        return;
      }

      // Preparar dados para envio (apenas campos que o backend espera)
      const productData: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: priceValue,
        category: formData.category.trim(),
        quantity: stockValue,
        is_promo: formData.isPromotion,
        is_new: formData.isNew,
        is_active: formData.available,
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (promotionPriceValue) {
        productData.promotion_price = promotionPriceValue;
      }

      if (formData.expiryDate) {
        productData.expires_at = formData.expiryDate;
      }

      if (formData.file) {
        productData.file = formData.file;
      }

      console.log('📤 Enviando dados do produto:', productData);
    // ...

      if (editingProduct) {
        // Atualizar produto existente
        console.log(`🔄 Atualizando produto ${editingProduct.id}`);
    // ...
        await adminApi.updateProduct(editingProduct.id, productData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
  // ...
        await adminApi.createProduct(productData);
        toast.success('Produto criado com sucesso!');
      }

      // Recarregar produtos usando refreshProducts
      await refreshProducts();

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('❌ Erro ao salvar produto:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar produto: ${errorMessage}`);
    }
  };

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      
      // Atualiza o estado local imediatamente para feedback instantâneo
      const updatedProducts = adminProducts.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            is_active: newStatus
          };
        }
        return product;
      });
      setAdminProducts(updatedProducts);

      // Tentar primeiro o endpoint específico de toggle
      try {
        await adminApi.toggleProduct(productId);
        console.log('✅ Toggle realizado via endpoint específico');
      } catch (toggleError) {
        // Fallback para update manual
        await adminApi.updateProduct(productId, { is_active: newStatus });
        console.log('✅ Toggle realizado via update manual');
      }
      
      // Atualiza novamente para garantir sincronização com o backend
      await refreshProducts();
      toast.success(`Produto ${newStatus ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      // Em caso de erro, reverte a alteração local
      const revertedProducts = adminProducts.map(product => {
        if (product.id === productId) {
          return {
            ...product,
            is_active: currentStatus
          };
        }
        return product;
      });
      setAdminProducts(revertedProducts);
      
      console.error('❌ Erro ao atualizar disponibilidade:', error);
      toast.error(`Erro ao ${!currentStatus ? 'ativar' : 'desativar'} produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const handleSyncStock = async () => {
    try {
      await adminApi.syncStock();
      await refreshProducts();
      toast.success('Estoque sincronizado com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar estoque:', error);
      toast.error('Erro ao sincronizar estoque');
    }
  };

  const handleQuickStockUpdate = async (productId: string, newStock: number) => {
    try {
  // ...
      await adminApi.updateProductStock(productId, newStock);
      await refreshProducts();
      toast.success('Estoque atualizado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar estoque:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao atualizar estoque: ${errorMessage}`);
    }
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

  const lowStockCount = adminProducts.filter((p: any) => p.stock <= 5 && p.stock > 0).length;
  const outOfStockCount = adminProducts.filter((p: any) => p.stock === 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1>Gerenciar Doces</h1>
          <p className="text-muted-foreground">Controle total do seu estoque de doces</p>
        </div>
        
        <div className="flex gap-2">
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
              <form onSubmit={async (e) => {
                await handleSubmit(e);
                // Atualiza lista de produtos automaticamente após criar/editar
                await refreshProducts();
              }} className="space-y-6">
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
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, category: value }))}
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
                    setFormData(prev => ({ ...prev, file: file || null }));
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
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, available: !!checked }))}
                  />
                  <Label htmlFor="available">Produto Disponível</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPromotion"
                    checked={formData.isPromotion}
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ 
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
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isNew: !!checked }))}
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
              {filteredProducts.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <ImageWithFallback
                          src={getProductImageUrl(product.image_url || product.image)}
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
                            {formatPrice((product.promotionPrice || product.promotion_price) ?? 0)}
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
                      {editingStock?.productId === product.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editingStock?.value || ''}
                            onChange={(e) => setEditingStock({ 
                              productId: product.id, 
                              value: e.target.value 
                            })}
                            className="w-16 h-6 text-xs"
                            min="0"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editingStock) {
                                handleQuickStockUpdate(product.id, parseInt(editingStock.value) || 0);
                                setEditingStock(null);
                              } else if (e.key === 'Escape') {
                                setEditingStock(null);
                              }
                            }}
                            autoFocus
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (editingStock) {
                                handleQuickStockUpdate(product.id, parseInt(editingStock.value) || 0);
                                setEditingStock(null);
                              }
                            }}
                            className="h-6 w-6 p-0"
                          >
                            ✓
                          </Button>
                        </div>
                      ) : (
                        <span 
                          className="font-medium cursor-pointer hover:bg-muted px-1 rounded"
                          onClick={() => setEditingStock({ 
                            productId: product.id, 
                            value: (product.stock || product.quantity || 0).toString() 
                          })}
                          title="Clique para editar"
                        >
                          {product.stock || product.quantity || 0}
                        </span>
                      )}
                      {getStockBadge(product.stock || product.quantity || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={Boolean(product.is_active)}
                        onCheckedChange={() => handleToggleAvailability(product.id, Boolean(product.is_active))}
                        aria-label={`${Boolean(product.is_active) ? 'Desativar' : 'Ativar'} produto`}
                      />
                      <Badge 
                        variant={Boolean(product.is_active) ? 'default' : 'secondary'}
                        className={Boolean(product.is_active) ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}
                      >
                        {Boolean(product.is_active) ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        (Clique para {Boolean(product.is_active) ? 'desativar' : 'ativar'})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(product.expiryDate || product.expires_at) ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {new Date(product.expiryDate || product.expires_at || '').toLocaleDateString('pt-BR')}
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
                        title="Editar produto"
                      >
                        <Edit className="w-4 h-4" />
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