<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeliveryRecord extends Model
{
    protected $fillable = [
        'motorcyclist_id',
        'delivery_date',
        'deliveries_count',
        'amount_due',
        'amount_paid',
        'is_paid',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'delivery_date' => 'date',
        'paid_at' => 'date',
        'is_paid' => 'boolean',
        'amount_due' => 'decimal:2',
        'amount_paid' => 'decimal:2',
    ];

    public function motorcyclist()
    {
        return $this->belongsTo(Motorcyclist::class);
    }

    // Saldo restante
    public function getBalanceAttribute()
    {
        return $this->amount_due - $this->amount_paid;
    }
}
