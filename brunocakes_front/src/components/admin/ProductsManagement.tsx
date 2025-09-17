import React, { useState, useEffect } from "react";
import { useApp } from "../../App";
import { toast } from "sonner"; 
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Checkbox } from "../ui/checkbox";
import { Edit } from "lucide-react";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  promotionPrice?: string;
  category: string;
  image: string;
  file?: File;
  is_active: boolean;
  stock: string;
  expiryDate?: string;
  isPromotion: boolean;
  isNew: boolean;
 
}

// Categorias padrão
const defaultCategories: string[] = [
  "Trufas",
  "Beijinhos",
  "Brownies",
  "Cupcakes",
  "Bolos",
  "Docinhos",
  "Tortas",
  "Brigadeiro",
  "Refrigerante",
  "Bolo de Festa",
  "Bolo de Pote",
  "Cupcake Gourmet",
  "Doce de Leite",
  "Doce de Coco",
  "Doce de Amendoim",
  "Torta de Limão",
  "Torta de Morango",
  "Torta Holandesa",
];


export function ProductsManagement() {
  // Máscara de moeda em tempo real
  const maskCurrency = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (!v) return "";
    v = (parseInt(v, 10) / 100).toFixed(2).replace('.', ',');
    return v.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  };
  const { products: contextProducts, addProduct, updateProduct, toggleProduct } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  // Função para buscar produtos do backend após update
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await import('../../api').then(mod => mod.api.getAdminProducts());
      if (Array.isArray(data)) {
        // Normaliza todos os campos esperados pelo frontend
        setProducts(data.map((p: any) => ({
          id: p.id,
          name: p.name || '',
          description: p.description || '',
          price: p.price !== undefined ? p.price : '',
          promotionPrice: p.promotion_price !== undefined ? p.promotion_price : '',
          category: p.category || '',
          image_url: p.image_url || (p.image && typeof p.image === 'string' && p.image.startsWith('http')
            ? p.image
            : p.image && p.image.startsWith('products/')
              ? `http://localhost:8000/storage/${p.image}`
              : `http://localhost:8000/storage/products/${p.image}`),
          image: p.image || '',
          stock: p.quantity !== undefined ? p.quantity : (p.stock !== undefined ? p.stock : ''),
          expiryDate: p.expires_at || p.expiryDate || '',
          isPromotion: p.is_promo !== undefined ? p.is_promo : (p.isPromotion !== undefined ? p.isPromotion : false),
          isNew: p.is_new !== undefined ? p.is_new : (p.isNew !== undefined ? p.isNew : false),
          is_active: p.is_active !== undefined ? p.is_active : true,
        })));
      }
    } catch {
      toast.error('Erro ao atualizar lista de produtos');
    }
    setIsLoading(false);
  };

  // Garante que products sempre seja um array
  const [products, setProducts] = useState<any[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  // Sempre mostrar todas as categorias padrão e cadastradas
  const categories = Array.from(new Set([...defaultCategories, ...products.map((p) => p.category).filter(Boolean)]));
  const selectCategories: string[] = categories;

  const [formData, setFormData] = useState<ProductFormData>({
  name: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  image: "",
  is_active: true,
  isPromotion: false,
  isNew: false,
  });

  // formatações (currency / peso)
  const formatCurrency = (value: string) => {
    if (!value) return "";
    // Aceita vírgula ou ponto como separador decimal
    const clean = value.replace(/[^\d.,]/g, "").replace(/,/g, ".");
    const num = parseFloat(clean);
    if (isNaN(num)) return "";
    return num.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const parseCurrency = (value: string) => {
  if (!value) return 0;
  // Aceita vírgula ou ponto como separador decimal
  const clean = value.replace(/[^\d.,]/g, "").replace(/,/g, ".");
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
  };

  const formatWeight = (value: string) => {
    if (!value) return "";
    const numericValue = value.replace(/\D/g, "");
    return numericValue ? numericValue + " g" : "";
  };

  // Carrega todos os produtos do backend ao montar o componente
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (editingProduct !== null) {
      const product = products.find((p) => String(p.id) === String(editingProduct));
      if (product) {
        let validCategory = product.category || "";
        if (validCategory && !selectCategories.includes(validCategory)) {
          validCategory = "";
        }
        // Corrige formato da data para input type="date"
        let expiryDate = "";
        if (product.expiryDate) {
          expiryDate = product.expiryDate.split("T")[0];
        }
        setFormData({
          name: product.name || "",
          description: product.description || "",
          price: (product.price !== undefined && product.price !== null) ? product.price.toString() : "",
          promotionPrice: (product.promotionPrice !== undefined && product.promotionPrice !== null) ? product.promotionPrice.toString() : "",
          category: validCategory,
          image: product.image_url || product.image || "",
          stock: (product.stock !== undefined && product.stock !== null) ? product.stock.toString() : "",
          expiryDate,
          isPromotion: product.isPromotion !== undefined ? product.isPromotion : false,
          isNew: product.isNew !== undefined ? product.isNew : false,
          is_active: product.is_active !== undefined ? product.is_active : true,
        });
        setIsDialogOpen(true);
      }
    }
  }, [editingProduct, products]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validação básica
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Função para gerar slug
      const generateSlug = (str: string) => {
        return str
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // remove acentos
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
          .replace(/--+/g, "-");
      };

    // Monta objeto no formato esperado pelo backend
    const productData: any = {
      name: formData.name,
      slug: generateSlug(formData.name),
      description: formData.description,
      price: parseCurrency(formData.price),
      promotion_price: formData.promotionPrice ? parseCurrency(formData.promotionPrice) : undefined,
      quantity: parseInt(formData.stock, 10),
      category: formData.category,
      is_promo: formData.isPromotion,
      is_new: formData.isNew,
      is_active: formData.is_active,
      expires_at: formData.expiryDate || undefined,
    };
    if (formData.file) {
      productData.file = formData.file;
    }

    if (editingProduct) {
      updateProduct(editingProduct, productData);
    } else {
      addProduct(productData);
    }
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      image: "",
      is_active: true,
      isPromotion: false,
      isNew: false,
      expiryDate: "",
    });
    setTimeout(fetchProducts, 400); // Atualiza só o datatable
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
          <Button onClick={() => setIsDialogOpen(true)}>Novo Produto</Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para cadastrar ou atualizar o produto.
              </DialogDescription>
            </DialogHeader>

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Digite o nome do produto"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: string) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectCategories.map((cat: string) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  value={formData.description || ""}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Preço, promoção e peso */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="text"
                  value={formData.price || ""}
                  placeholder="0,00 R$"
                  onChange={e => setFormData({ ...formData, price: maskCurrency(e.target.value) })}
                />
                <Input
                  type="text"
                  value={formData.promotionPrice || ""}
                  placeholder="0,00 R$"
                  disabled={!formData.isPromotion}
                  onChange={e => setFormData({ ...formData, promotionPrice: maskCurrency(e.target.value) })}
                />
              </div>

              {/* Estoque e validade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Estoque *</Label>
                  <Input
                    type="number"
                    value={formData.stock || ""}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Validade</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate || ""}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={formData.is_active}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setFormData({ ...formData, is_active: !!checked })
                  }
                />
                <Label>Disponível</Label>

                <Checkbox
                  checked={formData.isPromotion}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setFormData({ ...formData, isPromotion: !!checked })
                  }
                />
                <Label>Promoção</Label>

                <Checkbox
                  checked={formData.isNew}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setFormData({ ...formData, isNew: !!checked })
                  }
                />
                <Label>Novidade</Label>
              </div>

              {/* Imagem */}
              <div>
                <Label htmlFor="image">Imagem *</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData({ ...formData, file });
                    }
                  }}
                />
                {formData.image && (
                  <img
                    src={formData.image.startsWith('http') ? formData.image : `http://localhost:8000/storage/products/${formData.image}`}
                    alt={formData.name}
                    className="mt-2 w-24 h-24 object-cover rounded"
                    onError={e => { e.currentTarget.src = '/placeholder.png'; }}
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" onClick={handleSubmit}>{editingProduct ? 'Atualizar' : 'Adicionar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos ({products.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Promoção</TableHead>
                  <TableHead>Novidade</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Disponível</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((prod) => (
                  <TableRow key={prod.id}>
                    <TableCell>{prod.name || <span className="text-gray-400">(sem nome)</span>}</TableCell>
                    <TableCell>
                      {prod.isPromotion && prod.promotionPrice ? (
                        <>
                          <span className="line-through text-gray-400 mr-2">{formatPrice(Number(prod.price))}</span>
                          <span className="font-bold text-yellow-700">{formatPrice(Number(prod.promotionPrice))}</span>
                        </>
                      ) : prod.price ? (
                        formatPrice(Number(prod.price))
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {prod.isPromotion
                        ? <Badge className="bg-yellow-100 text-yellow-800">Promoção</Badge>
                        : <span className="text-gray-400">--</span>}
                    </TableCell>
                    <TableCell>
                      {prod.isNew
                        ? <Badge className="bg-blue-100 text-blue-800">Novidade</Badge>
                        : <span className="text-gray-400">--</span>}
                    </TableCell>
                    <TableCell>
                      {typeof prod.stock === "number" || typeof prod.stock === "string"
                        ? prod.stock
                        : <span className="text-gray-400">--</span>}
                    </TableCell>
                    <TableCell>
                      {prod.expiryDate
                        ? (() => {
                            const date = new Date(prod.expiryDate);
                            const day = String(date.getDate()).padStart(2, '0');
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            return `${day}/${month}`;
                          })()
                        : <span className="text-gray-400">--</span>}
                    </TableCell>
                    <TableCell>
                      <span
                        onClick={() => prod.id !== undefined && toggleProduct(String(prod.id))}
                        className="cursor-pointer flex items-center gap-1 px-3 py-1"
                        title={prod.is_active ? "Ativo" : "Inativo"}
                      >
                        {prod.is_active ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="green" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                        )}
                        <span className={prod.is_active ? "text-green-800" : "text-red-800"}>{prod.is_active ? "Ativo" : "Inativo"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingProduct(prod.id);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
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