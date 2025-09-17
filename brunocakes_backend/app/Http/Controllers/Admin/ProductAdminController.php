<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductAdminController extends Controller
{
    public function index()
    {
        return response()->json(Product::all());
    }

   public function store(Request $request)
    {
        $input = $request->all();

        // Converter campos booleanos vindos como string
        foreach (['is_promo', 'is_new', 'is_active'] as $boolField) {
            if (isset($input[$boolField])) {
                $input[$boolField] = filter_var($input[$boolField], FILTER_VALIDATE_BOOLEAN);
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
        return response()->json($product, 201);
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
                // Só atualiza os campos enviados
                $data[$key] = $value;
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

            return response()->json($product->fresh());
        }

    public function toggleActive(Product $product)
    {
        $product->is_active = !$product->is_active;
        $product->save();

        return response()->json([
            'message' => $product->is_active ? 'Produto habilitado' : 'Produto desabilitado',
            'product' => $product
        ]);
    }


}
