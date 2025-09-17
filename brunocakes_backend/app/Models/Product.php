<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'promotion_price',
        'quantity',
        'expires_at',
        'is_promo',
        'is_new',
        'is_active',
        'image',
         'category'
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
