<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;

class ProductAdminController extends Controller
{
    public function index()
    {
        $products = Product::all();

        $products->map(function ($product) {
            $product->image_url = $product->image 
                ? Storage::url($product->image) 
                : null;
            return $product;
        });

        return response()->json($products);
    }

    public function store(Request $request)
    {
        \Log::info('ProductAdminController@store chamado', $request->all());
        
        $input = $request->all();

        // Converter campos booleanos vindos como string
        foreach (['is_promo', 'is_new', 'is_active'] as $boolField) {
            if (isset($input[$boolField])) {
                $input[$boolField] = filter_var($input[$boolField], FILTER_VALIDATE_BOOLEAN);
            }
        }

        // Gerar slug automaticamente se não fornecido
        if (!isset($input['slug']) && isset($input['name'])) {
            $input['slug'] = \Str::slug($input['name']);
            // Garantir que seja único
            $baseSlug = $input['slug'];
            $counter = 1;
            while (Product::where('slug', $input['slug'])->exists()) {
                $input['slug'] = $baseSlug . '-' . $counter;
                $counter++;
            }
        }

        $data = $request->merge($input)->validate([
            'name'            => 'required|string',
            'slug'            => 'required|string|unique:products,slug',
            'price'           => 'required|numeric',
            'promotion_price' => 'nullable|numeric',
            'quantity'        => 'required|integer',
            'category'        => 'nullable|string',
            'expires_at'      => 'nullable|date',
            'is_promo'        => 'boolean',
            'is_new'          => 'boolean',
            'is_active'       => 'boolean',
            'description'     => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            $data['image'] = $imagePath;
        } else {
            $data['image'] = null;
        }

        $product = Product::create($data);
        
        // ✅ CORRIGIDO: Sincronizar estoque com Redis automaticamente
        $this->syncProductStock($product);
        
        // Adicionar image_url para response
        $product->image_url = $product->image 
            ? Storage::url($product->image) 
            : null;
        
        \Log::info('Produto criado com sucesso', ['product_id' => $product->id]);
        
        return response()->json($product, 201);
    }

    public function show($id)
    {
        $product = Product::findOrFail($id);
        
        $product->image_url = $product->image 
            ? Storage::url($product->image) 
            : null;
            
        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $input = $request->all();

        // Converter campos booleanos vindos como string
        foreach (["is_promo", "is_new", "is_active"] as $boolField) {
            if (isset($input[$boolField])) {
                $input[$boolField] = filter_var($input[$boolField], FILTER_VALIDATE_BOOLEAN);
            }
        }

        $validated = $request->merge($input)->validate([
            'name'            => 'string',
            'slug'            => 'string|unique:products,slug,' . $product->id,
            'price'           => 'numeric',
            'promotion_price' => 'nullable|numeric',
            'quantity'        => 'integer',
            'category'        => 'nullable|string',
            'expires_at'      => 'nullable|date',
            'is_promo'        => 'boolean',
            'is_new'          => 'boolean',
            'is_active'       => 'boolean',
            'description'     => 'nullable|string',
            'image'           => 'nullable',
        ]);

        $data = [];
        foreach ($validated as $key => $value) {
            $data[$key] = $value;
        }

        // Se não está em promoção, zere o campo promotion_price
        if (isset($data['is_promo']) && !$data['is_promo']) {
            $data['promotion_price'] = null;
        }

        // Imagem: só altera se for enviada
        if ($request->hasFile('image')) {
            if ($product->image && \Storage::disk('public')->exists($product->image)) {
                \Storage::disk('public')->delete($product->image);
            }
            $path = $request->file('image')->store('products', 'public');
            $data['image'] = $path;
        }

        $product->update($data);

        // ✅ CORRIGIDO: Sincronizar estoque com Redis automaticamente após update
        $this->syncProductStock($product->fresh());

        // Adicionar image_url para response
        $updatedProduct = $product->fresh();
        $updatedProduct->image_url = $updatedProduct->image 
            ? Storage::url($updatedProduct->image) 
            : null;

        return response()->json($updatedProduct);
    }

    public function updateStock(Request $request, $id)
    {
        $data = $request->validate([
            'quantity' => 'required|integer|min:0'
        ]);

        $product = Product::findOrFail($id);
        $oldStock = $product->quantity;
        
        $product->update(['quantity' => $data['quantity']]);
        
        // ✅ CORRIGIDO: Sincronizar estoque com Redis automaticamente
        $this->syncProductStock($product->fresh());
        
        return response()->json([
            'message' => 'Estoque atualizado com sucesso',
            'product' => $product->fresh(),
            'old_stock' => $oldStock,
            'new_stock' => $data['quantity']
        ]);
    }

    public function toggleActive($id)
{
    // ✅ Buscar produto manualmente
    $product = Product::findOrFail($id);
    
    $product->is_active = !$product->is_active;
    $product->save();

    // ✅ Sincronizar com Redis quando ativar/desativar
    $this->syncProductStock($product);

    return response()->json([
        'message' => $product->is_active ? 'Produto habilitado' : 'Produto desabilitado',
        'product' => $product
    ]);
}
    // ✅ CORRIGIDO: Método privado para sincronizar um produto específico
    private function syncProductStock(Product $product)
    {
        try {
            // ✅ USAR Facade Redis corretamente
            Redis::set("product_stock_{$product->id}", $product->quantity);
            \Log::info("Produto {$product->id} sincronizado com Redis", [
                'product_name' => $product->name,
                'quantity' => $product->quantity
            ]);
        } catch (\Exception $e) {
            \Log::warning("Erro ao sincronizar produto {$product->id} com Redis: " . $e->getMessage());
            // ✅ Não falhar se Redis não estiver disponível
        }
    }

    // ✅ CORRIGIDO: Método para sincronizar todos os produtos (manual)
    public function syncStock()
    {
        $products = Product::all();
        $synced = 0;
        $errors = 0;

        foreach ($products as $product) {
            try {
                // ✅ USAR Facade Redis corretamente
                Redis::set("product_stock_{$product->id}", $product->quantity);
                $synced++;
            } catch (\Exception $e) {
                $errors++;
                \Log::error("Erro ao sincronizar produto {$product->id}: " . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Sincronização completa',
            'products_synced' => $synced,
            'errors' => $errors,
            'total_products' => $products->count()
        ]);
    }
}