<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
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
