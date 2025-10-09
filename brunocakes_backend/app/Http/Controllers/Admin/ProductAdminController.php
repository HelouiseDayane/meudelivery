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

        $appUrl = config('app.url');
        $products->map(function ($product) use ($appUrl) {
            if ($product->image) {
                if (preg_match('/^https?:\/\//', $product->image)) {
                    $product->image_url = $product->image;
                } else {
                    $imagePath = Storage::url($product->image);
                    $product->image_url = rtrim($appUrl, '/') . $imagePath;
                }
            } else {
                $product->image_url = null;
            }
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
        $appUrl = config('app.url');
        if ($product->image) {
            if (preg_match('/^https?:\/\//', $product->image)) {
                $product->image_url = $product->image;
            } else {
                $imagePath = Storage::url($product->image);
                $product->image_url = rtrim($appUrl, '/') . $imagePath;
            }
        } else {
            $product->image_url = null;
        }
        
        \Log::info('Produto criado com sucesso', ['product_id' => $product->id]);
        
        return response()->json($product, 201);
    }

    public function show($id)
    {
        $product = Product::findOrFail($id);
        
        $appUrl = config('app.url');
        if ($product->image) {
            if (preg_match('/^https?:\/\//', $product->image)) {
                $product->image_url = $product->image;
            } else {
                $imagePath = Storage::url($product->image);
                $product->image_url = rtrim($appUrl, '/') . $imagePath;
            }
        } else {
            $product->image_url = null;
        }
            
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
        $appUrl = config('app.url');
        if ($updatedProduct->image) {
            if (preg_match('/^https?:\/\//', $updatedProduct->image)) {
                $updatedProduct->image_url = $updatedProduct->image;
            } else {
                $imagePath = Storage::url($updatedProduct->image);
                $updatedProduct->image_url = rtrim($appUrl, '/') . $imagePath;
            }
        } else {
            $updatedProduct->image_url = null;
        }
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
    // ✅ CORRIGIDO: Método privado para sincronizar um produto específico com debug
    private function syncProductStock(Product $product)
    {
        try {
            // Tenta conectar ao Redis primeiro
            if (!Redis::ping()) {
                \Log::error("Redis não está respondendo ao PING");
                return;
            }

            // ✅ USAR Facade Redis corretamente com log detalhado
            $key = "product_stock_{$product->id}";
            $oldValue = Redis::get($key);
            Redis::set($key, $product->quantity);
            $newValue = Redis::get($key);

            \Log::info("Produto {$product->id} sincronizado com Redis", [
                'product_name' => $product->name,
                'quantity' => $product->quantity,
                'redis_key' => $key,
                'old_value' => $oldValue,
                'new_value' => $newValue,
                'redis_info' => Redis::info()
            ]);
        } catch (\Exception $e) {
            \Log::error("Erro ao sincronizar produto {$product->id} com Redis: " . $e->getMessage(), [
                'exception' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
            // ✅ Não falhar se Redis não estiver disponível
        }
    }

    // ✅ CORRIGIDO: Método para sincronizar todos os produtos (manual) com validação e debug
    public function syncStock()
    {
        // Validar conexão Redis primeiro
        try {
            if (!Redis::ping()) {
                \Log::error("Redis não está respondendo ao PING durante syncStock");
                return response()->json([
                    'message' => 'Erro: Redis não está respondendo',
                    'error' => 'REDIS_NOT_RESPONDING'
                ], 500);
            }
        } catch (\Exception $e) {
            \Log::error("Erro ao tentar PING no Redis: " . $e->getMessage());
            return response()->json([
                'message' => 'Erro na conexão com Redis',
                'error' => $e->getMessage()
            ], 500);
        }

        $products = Product::all();
        $synced = 0;
        $errors = 0;
        $syncDetails = [];

        foreach ($products as $product) {
            try {
                $key = "product_stock_{$product->id}";
                $oldValue = Redis::get($key);
                Redis::set($key, $product->quantity);
                $newValue = Redis::get($key);

                if ($newValue !== null && (string)$newValue === (string)$product->quantity) {
                    $synced++;
                    $syncDetails[$product->id] = [
                        'success' => true,
                        'name' => $product->name,
                        'old_value' => $oldValue,
                        'new_value' => $newValue,
                        'expected' => $product->quantity
                    ];
                } else {
                    $errors++;
                    $syncDetails[$product->id] = [
                        'success' => false,
                        'name' => $product->name,
                        'error' => 'Valor não sincronizado corretamente',
                        'old_value' => $oldValue,
                        'new_value' => $newValue,
                        'expected' => $product->quantity
                    ];
                }
            } catch (\Exception $e) {
                $errors++;
                $syncDetails[$product->id] = [
                    'success' => false,
                    'name' => $product->name,
                    'error' => $e->getMessage()
                ];
                \Log::error("Erro ao sincronizar produto {$product->id}: " . $e->getMessage(), [
                    'exception' => get_class($e),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        // Log detalhado do resultado
        \Log::info("Resultado da sincronização de estoque", [
            'total_products' => $products->count(),
            'synced' => $synced,
            'errors' => $errors,
            'details' => $syncDetails,
            'redis_info' => Redis::info()
        ]);

        return response()->json([
            'message' => $errors > 0 ? 'Sincronização parcial' : 'Sincronização completa',
            'products_synced' => $synced,
            'errors' => $errors,
            'total_products' => $products->count(),
            'details' => $syncDetails
        ]);
    }
}