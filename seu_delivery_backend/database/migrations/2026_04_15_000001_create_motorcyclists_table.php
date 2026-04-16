<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('motorcyclists', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('moto')->nullable();           // modelo da moto
            $table->string('plate')->nullable();          // placa
            $table->string('pix_key')->nullable();        // chave pix
            $table->decimal('price_per_delivery', 8, 2)->default(0); // valor por entrega
            $table->boolean('is_active')->default(true);  // ativo para trabalhar hoje
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('motorcyclists');
    }
};
