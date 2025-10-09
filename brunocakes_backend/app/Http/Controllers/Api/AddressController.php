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
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
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
            'latitude' => 'nullable|string',
            'longitude' => 'nullable|string',
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
        $address = Address::findOrFail($id);
        if ($address->ativo) {
            // Se já está ativo, inativa apenas ele
            $address->ativo = false;
            $address->save();
            $message = 'Endereço inativado com sucesso';
        } else {
            // Se está inativo, desativa todos e ativa este
            Address::query()->update(['ativo' => false]);
            $address->ativo = true;
            $address->save();
            $message = 'Endereço ativado com sucesso';
        }
        return response()->json([
            'message' => $message,
            'id' => $id,
            'address' => $address,
        ], 200, ['Content-Type' => 'application/json; charset=UTF-8'], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }
        /**
     * Retorna o endereço ativo (público)
     */
    public function getActive()
    {
        $active = Address::where('ativo', true)->first();
        if (!$active) {
            return response()->json(null, 404);
        }

        // Retorna o modelo diretamente, Laravel cuida da serialização
        return response()->json($active, 200, ['Content-Type' => 'application/json; charset=UTF-8'], JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    }

}
