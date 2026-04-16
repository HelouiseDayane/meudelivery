<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
    'name',
    'slug',
    'price',
    'promotion_price',
    'quantity',
    'category',
    'expires_at',
    'is_promo',
    'is_new',
    'is_active',
    'description',
    'image',
    'branch_id',
    'two_flavor_price',
    'has_chocolate_syrup',
    'has_ninho_syrup',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'promotion_price' => 'decimal:2',
        'expires_at' => 'datetime',
        'is_promo' => 'boolean',
        'is_new' => 'boolean',
        'is_active' => 'boolean',
        'two_flavor_price' => 'decimal:2',
        'has_chocolate_syrup' => 'boolean',
        'has_ninho_syrup' => 'boolean',
    ];

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    // Relacionamento com Branch
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    // Relacionamento com estoques por filial
    public function stocks()
    {
        return $this->hasMany(ProductStock::class);
    }

    // Helper para obter quantidade de estoque em uma filial específica
    public function getStockInBranch($branchId)
    {
        $stock = $this->stocks()->where('branch_id', $branchId)->first();
        return $stock ? $stock->quantity : 0;
    }
}
