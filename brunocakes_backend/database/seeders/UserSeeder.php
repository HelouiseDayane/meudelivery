<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('users')->insert([
            'name' => 'Admin Teste',
            'email' => 'admin@admin.com',
            'password' => Hash::make('Gatopreto11.'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

          DB::table('users')->insert([
            'name' => 'Bruno Cakes',
            'email' => 'brunocakes@zapsrv.com',
            'password' => Hash::make('BrunoC2k3.s#@.'),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
