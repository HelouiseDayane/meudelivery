<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->string('whatsapp_instance_name')->nullable()->after('email');
            $table->string('whatsapp_status')->default('disconnected')->after('whatsapp_instance_name');
            $table->string('whatsapp_number')->nullable()->after('whatsapp_status');
            $table->timestamp('whatsapp_connected_at')->nullable()->after('whatsapp_number');
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_instance_name',
                'whatsapp_status',
                'whatsapp_number',
                'whatsapp_connected_at',
            ]);
        });
    }
};
