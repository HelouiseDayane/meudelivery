<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Motorcyclist extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'moto',
        'plate',
        'pix_key',
        'price_per_delivery',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'price_per_delivery' => 'decimal:2',
    ];

    public function deliveryRecords()
    {
        return $this->hasMany(DeliveryRecord::class);
    }

    // Total a receber (não pago)
    public function getTotalDueAttribute()
    {
        return $this->deliveryRecords->sum(fn($r) => $r->amount_due - $r->amount_paid);
    }

    // Total de entregas realizadas
    public function getTotalDeliveriesAttribute()
    {
        return $this->deliveryRecords->sum('deliveries_count');
    }
}
