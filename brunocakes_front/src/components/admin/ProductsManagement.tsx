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
  available: boolean;
  stock: string;
  expiryDate?: string;
  isPromotion: boolean;
  isNew: boolean;
  ingredients?: string;
  allergens?: string;
  weight?: string;
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
];

export function ProductsManagement() {
  const { products, addProduct, updateProduct, toggleProduct } = useApp();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  const selectCategories: string[] = categories.length > 0 ? categories : defaultCategories;

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: "",
    available: true,
    isPromotion: false,
    isNew: false,
  });

  // formatações (currency / peso)
  const formatCurrency = (value: string) => {
    if (!value) return "";
    const numericValue = parseInt(value.replace(/\D/g, ""), 10) || 0;
    return (numericValue / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const parseCurrency = (value: string) => {
    if (!value) return 0;
    return parseInt(value.replace(/\D/g, ""), 10) / 100;
  };

  const formatWeight = (value: string) => {
    if (!value) return "";
    const numericValue = value.replace(/\D/g, "");
    return numericValue ? numericValue + " g" : "";
  };

  useEffect(() => {
    if (editingProduct !== null) {
      const product = products.find((p) => String(p.id) === editingProduct);
      if (product) {
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          stock: product.stock.toString(),
          category: product.category || "",
          image: product.image,
          available: product.available,
          isPromotion: product.isPromotion,
          promotionPrice: product.promotionPrice?.toString() || "",
          isNew: product.isNew,
          expiryDate: product.expiryDate || "",
        });
        setIsDialogOpen(true);
      }
    }
  }, [editingProduct, products]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const productData = {
      ...formData,
      price: parseCurrency(formData.price),
      promotionPrice: formData.promotionPrice ? parseCurrency(formData.promotionPrice) : undefined,
      stock: parseInt(formData.stock, 10),
      weight: formData.weight ? parseFloat(formData.weight.replace(/\D/g, "")) : undefined,
      ingredients: formData.ingredients
        ? formData.ingredients.split(",").map((i: string) => i.trim())
        : [],
      allergens: formData.allergens
        ? formData.allergens.split(",").map((a: string) => a.trim())
        : [],
    };

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
      available: true,
      isPromotion: false,
      isNew: false,
      weight: "",
      ingredients: "",
      allergens: "",
      expiryDate: "",
    });
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(price);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>{editingProduct ? "Editar Produto" : "Novo Produto"}</Button>
          </DialogTrigger>
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
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Digite o nome do produto"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoria *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, category: value })
                    }
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
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Preço, promoção e peso */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  type="text"
                  value={formData.price}
                  placeholder="0,00 R$"
                  onChange={e => setFormData({ ...formData, price: e.target.value.replace(/\D/g, '') })}
                  onBlur={() => setFormData({ ...formData, price: formatCurrency(formData.price) })}
                />
                <Input
                  type="text"
                  value={formData.promotionPrice || ''}
                  placeholder="0,00 R$"
                  disabled={!formData.isPromotion}
                  onChange={e => setFormData({ ...formData, promotionPrice: e.target.value.replace(/\D/g, '') })}
                  onBlur={() => formData.isPromotion && setFormData({ ...formData, promotionPrice: formatCurrency(formData.promotionPrice || '') })}
                />
                <Input
                  type="text"
                  placeholder="0 g"
                  value={formData.weight ? formatWeight(formData.weight) : ''}
                  onChange={e => setFormData({ ...formData, weight: e.target.value.replace(/\D/g, '') })}
                />
              </div>

              {/* Estoque e validade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock">Estoque *</Label>
                  <Input
                    type="number"
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiryDate">Validade</Label>
                  <Input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={formData.available}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    setFormData({ ...formData, available: !!checked })
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
                      const imageUrl = URL.createObjectURL(file);
                      setFormData({ ...formData, image: imageUrl, file });
                    }
                  }}
                />
                {formData.image && (
                  <img src={formData.image} alt={formData.name} className="mt-2 w-24 h-24 object-cover rounded" />
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit}>{editingProduct ? 'Atualizar' : 'Adicionar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                <TableHead>Disponível</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((prod) => (
                <TableRow key={prod.id}>
                  <TableCell>{prod.name}</TableCell>
                  <TableCell>{formatPrice(prod.price)}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        prod.available
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {prod.available ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => setEditingProduct(prod.id)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Checkbox
                      checked={prod.available}
                      onCheckedChange={() => toggleProduct(prod.id)}
                      className="w-5 h-5 accent-green-600"
                    />
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