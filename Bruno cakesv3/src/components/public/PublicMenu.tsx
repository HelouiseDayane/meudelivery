import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Plus, Search, Star, Clock, Percent, Sparkles, ShoppingCart } from 'lucide-react';
import { useApp } from '../../App';
import { usePWA } from '../../hooks/usePWA';

export const PublicMenu = () => {
  const { products, addToCart } = useApp();
  const { isMobile } = usePWA();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    return matchesSearch && matchesCategory && product.available;
  });

  const handleAddToCart = (product: any, quantity: number = 1) => {
    setIsLoading(true);
    setTimeout(() => {
      addToCart(product, quantity);
      setIsLoading(false);
    }, 300);
  };

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className={`bruno-text-gradient mb-2 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
          Cardápio Bruno Cakes
        </h1>
        <p className="text-muted-foreground mb-4">
          🍰 Aqui não é fatia nem pedaço, aqui é tora! 🍰
        </p>
        <div className="bg-primary/10 rounded-lg p-4 mb-6">
          <p className="text-primary font-medium">
            ✨ Todas as nossas tortas são feitas artesanalmente com ingredientes premium
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className={`mb-6 ${isMobile ? 'space-y-4' : 'flex gap-4'}`}>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tortas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className={isMobile ? 'w-full' : 'w-[200px]'}>
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.filter(cat => cat !== 'all').map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Produtos */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {filteredProducts.map((product) => {
          const displayPrice = product.isPromotion ? product.promotionPrice : product.price;
          
          return (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={product.imageUrl || product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // Fallback para imagem padrão se houver erro
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400';
                  }}
                />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isNew && (
                    <Badge className="bg-primary text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Novidade
                    </Badge>
                  )}
                  {product.isPromotion && (
                    <Badge variant="destructive">
                      <Percent className="w-3 h-3 mr-1" />
                      Promoção
                    </Badge>
                  )}
                </div>

                {/* Stock badge */}
                <div className="absolute top-2 right-2">
                  {product.stock <= 3 && (
                    <Badge variant="outline" className="bg-white/90">
                      <Clock className="w-3 h-3 mr-1" />
                      Últimas {product.stock}
                    </Badge>
                  )}
                </div>
              </div>

              <CardHeader className="pb-2">
                <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'}`}>
                  {product.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Preço */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {product.isPromotion ? (
                      <>
                        <span className="text-lg font-bold text-primary">
                          {formatPrice(product.promotionPrice!)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {product.weight}g
                  </Badge>
                </div>

                {/* Botões */}
                <div className={`${isMobile ? 'space-y-2' : 'flex gap-2'}`}>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={isMobile ? 'w-full' : 'flex-1'}
                        onClick={() => setSelectedProduct(product)}
                      >
                        Ver Detalhes
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{product.name}</DialogTitle>
                      </DialogHeader>
                      
                      {selectedProduct && (
                        <div className="space-y-4">
                          <img
                            src={selectedProduct.image}
                            alt={selectedProduct.name}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                          
                          <div className="space-y-2">
                            <h3 className="font-semibold">Descrição</h3>
                            <p className="text-muted-foreground">{selectedProduct.description}</p>
                          </div>

                          {selectedProduct.ingredients && (
                            <div className="space-y-2">
                              <h3 className="font-semibold">Ingredientes</h3>
                              <div className="flex flex-wrap gap-1">
                                {selectedProduct.ingredients.map((ingredient: string, index: number) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {ingredient}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedProduct.allergens && (
                            <div className="space-y-2">
                              <h3 className="font-semibold">Alérgenos</h3>
                              <div className="flex flex-wrap gap-1">
                                {selectedProduct.allergens.map((allergen: string, index: number) => (
                                  <Badge key={index} variant="destructive" className="text-xs">
                                    {allergen}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <Separator />

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Preço</p>
                              <p className="text-2xl font-bold text-primary">
                                {formatPrice(selectedProduct.isPromotion ? selectedProduct.promotionPrice : selectedProduct.price)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Peso</p>
                              <p className="font-semibold">{selectedProduct.weight}g</p>
                            </div>
                          </div>

                          <Button 
                            onClick={() => handleAddToCart(selectedProduct)}
                            disabled={isLoading || selectedProduct.stock === 0}
                            className="w-full bruno-gradient text-white hover:opacity-90"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {isLoading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                          </Button>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button 
                    onClick={() => handleAddToCart(product)}
                    disabled={isLoading || product.stock === 0}
                    className={`bruno-gradient text-white hover:opacity-90 ${isMobile ? 'w-full' : 'flex-1'}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isLoading ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold text-lg mb-2">Nenhuma torta encontrada</h3>
          <p className="text-muted-foreground">
            Tente alterar os filtros ou buscar por outro termo.
          </p>
        </div>
      )}

      {/* Informações importantes */}
      <div className="mt-12 bg-muted/50 rounded-lg p-6">
        <h3 className="font-semibold mb-4 text-center">ℹ️ Informações Importantes</h3>
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
          <div className="text-center">
            <h4 className="font-medium text-primary mb-2">📞 Contato</h4>
            <p className="text-sm text-muted-foreground">
              (11) 99999-9999<br />
              contato@brunocakes.com.br
            </p>
          </div>
          <div className="text-center">
            <h4 className="font-medium text-primary mb-2">🕒 Funcionamento</h4>
            <p className="text-sm text-muted-foreground">
              Seg-Sex: 8h às 18h<br />
              Sáb: 8h às 16h
            </p>
          </div>
          <div className="text-center">
            <h4 className="font-medium text-primary mb-2">📍 Endereço</h4>
            <p className="text-sm text-muted-foreground">
              Rua das Tortas, 123<br />
              Centro - São Paulo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};