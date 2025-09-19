import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { 
  Plus, 
  Search, 
  Star, 
  ShoppingCart, 
  Edit3, 
  Trash2,
  Filter,
  Heart
} from 'lucide-react';
import { toast } from '../../components/ui/sonner';

// Mock products data
const mockProducts = [
  {
    id: '1',
    name: 'Brigadeiro Premium',
    description: 'Brigadeiro artesanal com chocolate belga e granulado especial',
    price: 15.00,
    image: 'https://images.unsplash.com/photo-1729875751095-71c051759eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmF6aWxpYW4lMjBicmlnYWRlaXJvJTIwY2hvY29sYXRlJTIwdHJ1ZmZsZXN8ZW58MXx8fHwxNzU3NjE2MjQxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'trufas',
    inStock: true,
    rating: 4.9,
    reviews: 127,
    isNew: false,
    isPromotion: true,
    originalPrice: 18.00
  },
  {
    id: '2',
    name: 'Bolo Red Velvet',
    description: 'Bolo aveludado com cream cheese e cobertura especial',
    price: 89.90,
    image: 'https://images.unsplash.com/photo-1607257882338-70f7dd2ae344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZWxpY2lvdXMlMjBjaG9jb2xhdGUlMjBkZXNzZXJ0JTIwY2FrZXxlbnwxfHx8fDE3NTc2MTYyMzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'bolos',
    inStock: true,
    rating: 4.8,
    reviews: 89,
    isNew: true,
    isPromotion: false
  },
  {
    id: '3',
    name: 'Cupcakes Coloridos',
    description: 'Kit com 6 cupcakes de sabores variados e decoração especial',
    price: 48.00,
    image: 'https://images.unsplash.com/photo-1615557509870-98972c5e1396?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzd2VldCUyMGNvbG9yZnVsJTIwY3VwY2FrZXMlMjBkZXNzZXJ0fGVufDF8fHx8MTc1NzYxNjIzN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'cupcakes',
    inStock: true,
    rating: 4.7,
    reviews: 203,
    isNew: false,
    isPromotion: false
  },
  {
    id: '4',
    name: 'Cheesecake de Morango',
    description: 'Cheesecake cremoso com calda de morango e base de biscoito',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1641424795123-9f12d697219d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHJhd2JlcnJ5JTIwY2hlZXNlY2FrZSUyMGRlc3NlcnR8ZW58MXx8fHwxNzU3NjE2MjQ0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    category: 'tortas',
    inStock: false,
    rating: 4.9,
    reviews: 156,
    isNew: true,
    isPromotion: false
  }
];

const categories = [
  { value: 'all', label: 'Todos os Produtos' },
  { value: 'bolos', label: 'Bolos' },
  { value: 'cupcakes', label: 'Cupcakes' },
  { value: 'trufas', label: 'Trufas & Brigadeiros' },
  { value: 'tortas', label: 'Tortas' }
];

export default function ProductsPage() {
  const { userType, addToCart } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<string[]>(['1', '3']);

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    toast.success('Favoritos atualizados!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1>
            {userType === 'admin' ? 'Gerenciar Produtos' : 'Nossos Doces'}
          </h1>
          <p className="text-muted-foreground">
            {userType === 'admin' 
              ? 'Adicione, edite e gerencie seus produtos' 
              : 'Descubra sabores únicos feitos com carinho'
            }
          </p>
        </div>
        
        {userType === 'admin' && (
          <Button 
            onClick={() => navigate('/products/new')}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <Card key={product.id} className="group hover:shadow-lg transition-shadow">
            <div className="relative">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {product.isNew && (
                  <Badge className="bg-green-500 text-white">Novo</Badge>
                )}
                {product.isPromotion && (
                  <Badge className="bg-red-500 text-white">Promoção</Badge>
                )}
                {!product.inStock && (
                  <Badge variant="secondary">Esgotado</Badge>
                )}
              </div>

              {/* Favorite Button (Client only) */}
              {userType === 'client' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  onClick={() => toggleFavorite(product.id)}
                >
                  <Heart 
                    className={`h-4 w-4 ${
                      favorites.includes(product.id) 
                        ? 'text-red-500 fill-current' 
                        : 'text-gray-500'
                    }`} 
                  />
                </Button>
              )}

              {/* Admin Actions */}
              {userType === 'admin' && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                    onClick={() => navigate(`/products/${product.id}/edit`)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium line-clamp-1">{product.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span>{product.rating}</span>
                    <span className="text-xs">({product.reviews})</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-orange-600">
                      R$ {product.price.toFixed(2)}
                    </span>
                    {product.isPromotion && product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">
                        R$ {product.originalPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {userType === 'client' && (
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(product)}
                      disabled={!product.inStock}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-medium mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou termos de busca
          </p>
        </div>
      )}
    </div>
  );
}