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
        $data = $request->validate([
            'name'            => 'required|string',
            'slug'            => 'required|string|unique:products,slug',
            'price'           => 'required|numeric',
            'promotion_price' => 'nullable|numeric', // ADICIONADO
            'quantity'        => 'required|integer',
            'category'        => 'nullable|string',
            'expires_at'      => 'nullable|date',
            'is_promo'        => 'boolean',
            'is_new'          => 'boolean',
            'is_active'       => 'boolean',
            'description'     => 'nullable|string',
            'image'           => 'nullable',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $data['image'] = $path;
        } elseif ($request->image) {
            $data['image'] = $request->image;
        }

        $product = Product::create($data);

        return response()->json($product, 201);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name'            => 'string',
            'slug'            => 'string|unique:products,slug,' . $product->id,
            'price'           => 'numeric',
            'promotion_price' => 'nullable|numeric', // ADICIONADO
            'quantity'        => 'integer',
            'category'        => 'nullable|string',
            'expires_at'      => 'nullable|date',
            'is_promo'        => 'boolean',
            'is_new'          => 'boolean',
            'is_active'       => 'boolean',
            'description'     => 'nullable|string',
            'image'           => 'nullable',
        ]);

        if ($request->hasFile('image')) {
            if ($product->image && \Storage::disk('public')->exists($product->image)) {
                \Storage::disk('public')->delete($product->image);
            }
            $path = $request->file('image')->store('products', 'public');
            $data['image'] = $path;
        } elseif ($request->image) {
            $data['image'] = $request->image;
        }

        $product->update($data);

        return response()->json($product);
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
