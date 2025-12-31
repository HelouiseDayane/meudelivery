<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    public function run(): void
    {


        // Manter usuários antigos para compatibilidade (serão master)
        DB::table('users')->insert([
            'name' => 'Admin Teste',
            'email' => 'admin@admin.com',
            'password' => Hash::make('Gatopreto11.'),
            'is_admin' => true,
            'role' => 'master',
            'branch_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('users')->insert([
            'name' => 'Bruno Miranda Cake',
            'email' => 'brunocakes@zapsrv.com',
            'password' => Hash::make('BrunoC2k3.s#@.'),
            'is_admin' => true,
            'role' => 'master',
            'branch_id' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
