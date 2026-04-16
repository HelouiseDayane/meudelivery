<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delivery_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('motorcyclist_id')->constrained()->onDelete('cascade');
            $table->date('delivery_date');
            $table->integer('deliveries_count')->default(0); // quantidade de entregas no dia
            $table->decimal('amount_due', 8, 2)->default(0); // valor a receber (calculado)
            $table->decimal('amount_paid', 8, 2)->default(0); // valor já pago
            $table->boolean('is_paid')->default(false);       // marcado como pago
            $table->date('paid_at')->nullable();               // data do pagamento
            $table->text('notes')->nullable();                 // observações
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delivery_records');
    }
};
