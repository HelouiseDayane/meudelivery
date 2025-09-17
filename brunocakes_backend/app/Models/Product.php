<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
    'image'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'promotion_price' => 'decimal:2',
        'expires_at' => 'datetime',
        'is_promo' => 'boolean',
        'is_new' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
