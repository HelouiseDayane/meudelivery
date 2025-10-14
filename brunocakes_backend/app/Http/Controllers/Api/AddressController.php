<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AddressController extends Controller
{
    /**
     * @OA\Get(
     *      path="/api/addresses",
     *      operationId="getAddressesList",
     *      tags={"Addresses"},
     *      summary="Listar endereços",
     *      description="Retorna lista de todos os endereços cadastrados",
     *      @OA\Response(
     *          response=200,
     *          description="Lista de endereços",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/Address")
     *          )
     *      )
     * )
     */
    public function index()
    {
        return Address::all();
    }

    /**
     * @OA\Post(
     *      path="/api/addresses",
     *      operationId="createAddress",
     *      tags={"Addresses"},
     *      summary="Criar novo endereço",
     *      description="Cadastra um novo endereço de entrega",
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"rua","numero","bairro","cidade","estado"},
     *              @OA\Property(property="rua", type="string", example="Rua das Flores"),
     *              @OA\Property(property="numero", type="string", example="123"),
     *              @OA\Property(property="bairro", type="string", example="Centro"),
     *              @OA\Property(property="cidade", type="string", example="São Paulo"),
     *              @OA\Property(property="estado", type="string", example="SP"),
     *              @OA\Property(property="ponto_referencia", type="string", example="Próximo ao mercado"),
     *              @OA\Property(property="horarios", type="string", example="8h às 18h"),
     *              @OA\Property(property="endereco_entrega", type="boolean", example=true),
     *              @OA\Property(property="latitude", type="string", example="-23.550520"),
     *              @OA\Property(property="longitude", type="string", example="-46.633309")
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Endereço criado com sucesso",
     *          @OA\JsonContent(ref="#/components/schemas/Address")
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Dados de validação inválidos"
     *      )
     * )
     */
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
