<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Support\Facades\Storage;


class ProductController extends Controller
{
    public function index()
    {
        $products = Product::where('is_active', true)->get();

        $products->map(function ($product) {
            $product->image_url = $product->image 
                ? Storage::url($product->image) 
                : null;
            return $product;
        });

        return response()->json($products);
    }

    public function show($id)
    {
        $product = Product::findOrFail($id);

        $product->image_url = $product->image 
            ? Storage::url($product->image) 
            : null;

        return response()->json($product);
    }
}
