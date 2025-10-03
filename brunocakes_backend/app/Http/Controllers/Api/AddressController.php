<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AddressController extends Controller
{
    // Middleware para garantir que só admin pode acessar
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware(function ($request, $next) {
            if (!Auth::user() || Auth::user()->role !== 'admin') {
                return response()->json(['error' => 'Acesso restrito a administradores'], 403);
            }
            return $next($request);
        });
    }

    public function index()
    {
        return Address::all();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'rua' => 'required|string',
            'numero' => 'required|string',
            'bairro' => 'required|string',
            'cidade' => 'required|string',
            'estado' => 'required|string',
            'ponto_referencia' => 'nullable|string',
            'horarios' => 'nullable|string',
        ]);
        $address = Address::create($data);
        return response()->json($address, 201);
    }

    public function show($id)
    {
        $address = Address::findOrFail($id);
        return response()->json($address);
    }

    public function update(Request $request, $id)
    {
        $address = Address::findOrFail($id);
        $data = $request->validate([
            'rua' => 'sometimes|required|string',
            'numero' => 'sometimes|required|string',
            'bairro' => 'sometimes|required|string',
            'cidade' => 'sometimes|required|string',
            'estado' => 'sometimes|required|string',
            'ponto_referencia' => 'nullable|string',
            'horarios' => 'nullable|string',
        ]);
        $address->update($data);
        return response()->json($address);
    }

    public function destroy($id)
    {
        $address = Address::findOrFail($id);
        $address->delete();
        return response()->json(['message' => 'Endereço removido com sucesso']);
    }
}
