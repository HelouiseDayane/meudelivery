<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * @OA\Post(
     *      path="/api/admin/login",
     *      operationId="adminLogin",
     *      tags={"Admin Auth"},
     *      summary="Login de administrador",
     *      description="Faz login do administrador e retorna token de autenticação",
     *      @OA\RequestBody(
     *          required=true,
     *          @OA\JsonContent(
     *              required={"email","password"},
     *              @OA\Property(property="email", type="string", format="email", example="admin@brunocakes.com"),
     *              @OA\Property(property="password", type="string", example="123456")
     *          ),
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Login realizado com sucesso",
     *          @OA\JsonContent(
     *              @OA\Property(property="token", type="string", example="1|abc123...")
     *          )
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Credenciais inválidas",
     *          @OA\JsonContent(
     *              @OA\Property(property="error", type="string", example="Unauthorized")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Dados de validação",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="The given data was invalid."),
     *              @OA\Property(property="errors", type="object")
     *          )
     *      )
     * )
     */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password) || !$user->is_admin) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json(['token' => $token]);
    }
}
