<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    // Método para listar todos os produtos
    public function index()
    {
        $products = Product::all();
        return response()->json($products);
    }

    // Método para exibir um produto específico
    public function show($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json(['message' => 'Produto não encontrado'], 404);
        }

        return response()->json($product);
    }
}