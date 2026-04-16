<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('two_flavor_price', 8, 2)->nullable()->after('promotion_price');
            $table->boolean('has_chocolate_syrup')->default(false)->after('two_flavor_price');
            $table->boolean('has_ninho_syrup')->default(false)->after('has_chocolate_syrup');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['two_flavor_price', 'has_chocolate_syrup', 'has_ninho_syrup']);
        });
    }
};
