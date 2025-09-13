import { useState, useEffect } from 'react';
import { useApp } from '../../App';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { api } from '../../api';

export function ProductsManagement() {
  const { products, setProducts } = useApp(); // ajustar no AppContext se precisar
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    name: '', description: '', price: '', promotionPrice: '', category: '', image: '',
    available: true, stock: '', expiryDate: '', isPromotion: false, isNew: false, ingredients: '', allergens: '', weight: ''
  });

  // Carregar produtos da API ao montar
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await api.getProducts();
        setProducts(data); // substitui os mockProducts
      } catch (err: any) {
        toast.error('Erro ao carregar produtos: ' + err.message);
      }
    };
    loadProducts();
  }, []);

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({...product, price: product.price.toString(), stock: product.stock.toString()});
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.price || !formData.category || !formData.stock) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock)
    };

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData);
        toast.success('Produto atualizado com sucesso');
      } else {
        await api.createProduct(productData);
        toast.success('Produto criado com sucesso');
      }
      // Recarregar produtos
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);
      setIsDialogOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await api.deleteProduct(id);
      toast.success('Produto removido');
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao excluir produto');
    }
  };

  return (
    <div>
      <Button onClick={() => { setEditingProduct(null); setIsDialogOpen(true); }}>
        <Plus className="w-4 h-4 mr-2"/> Novo Doce
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Doce' : 'Novo Doce'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Label htmlFor="price">Preço</Label>
            <Input id="price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            <Label htmlFor="stock">Estoque</Label>
            <Input id="stock" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
            <Button type="submit">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-3 gap-4 mt-4">
        {products.map(product => (
          <div key={product.id} className="border p-4 rounded">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <p>R$ {product.price.toFixed(2)}</p>
            <Button onClick={() => handleEdit(product)}>Editar</Button>
            <Button onClick={() => handleDelete(product.id)}>Excluir</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
