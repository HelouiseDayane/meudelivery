<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AddressController extends Controller
{


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
            'endereco_entrega' => 'boolean',
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
            'endereco_entrega' => 'boolean',
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
    /**
     * Ativa o endereço informado e desativa os demais.
     */
    public function activate($id)
    {
        // Adicione o campo 'ativo' na migration/model se ainda não existir
        // Desativa todos
        Address::query()->update(['ativo' => false]);
        // Ativa o selecionado
        $address = Address::findOrFail($id);
        $address->ativo = true;
        $address->save();
        return response()->json(['message' => 'Endereço ativado com sucesso', 'id' => $id]);
    }

        /**
     * Retorna o endereço ativo (público)
     */
    public function getActive()
    {
        $active = Address::where('ativo', true)->first();
        return $active ? response()->json($active) : response()->json(null, 404);
    }
}
