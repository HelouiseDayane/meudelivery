<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = [
        'name',
        'code',
        'address',
        'phone',
        'email',
        'opening_hours',
        'is_open',
        'is_active',
        'pix_key',
        'payment_frequency',
        'profit_percentage',
        'whatsapp_instance_name',
        'whatsapp_status',
        'whatsapp_number',
        'whatsapp_connected_at',
    ];

    protected $casts = [
        'is_open' => 'boolean',
        'is_active' => 'boolean',
        'profit_percentage' => 'decimal:2',
    ];

    // Relacionamentos
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(BranchPayment::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOpen($query)
    {
        return $query->where('is_open', true);
    }
}
