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
        'name'        => 'required|string',
        'slug'        => 'required|string|unique:products,slug',
        'price'       => 'required|numeric',
        'quantity'    => 'required|integer',
        'expires_at'  => 'nullable|date',
        'is_promo'    => 'boolean',
        'is_new'      => 'boolean',
        'is_active'   => 'boolean',
        'description' => 'nullable|string',
        'image'       => 'nullable|image|max:2048', // valida upload
    ]);

    // Tratamento da imagem
    if ($request->hasFile('image')) {
        $path = $request->file('image')->store('products', 'public');
        $data['image'] = $path;
    }

    $product = Product::create($data);

    return response()->json($product, 201);
}

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name'        => 'string',
            'slug'        => 'string|unique:products,slug,' . $product->id,
            'price'       => 'numeric',
            'quantity'    => 'integer',
            'expires_at'  => 'nullable|date',
            'is_promo'    => 'boolean',
            'is_new'      => 'boolean',
            'is_active'   => 'boolean',
            'description' => 'nullable|string',
            'image'       => 'nullable|image|max:2048', // valida upload
        ]);

        if ($request->hasFile('image')) {
            // Apaga a imagem antiga se existir
            if ($product->image && \Storage::disk('public')->exists($product->image)) {
                \Storage::disk('public')->delete($product->image);
            }
            $path = $request->file('image')->store('products', 'public');
            $data['image'] = $path;
        }

        $product->update($data);

        return response()->json($product);
    }

}
