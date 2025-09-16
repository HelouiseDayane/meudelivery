<?php


use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ProductAdminController;
use App\Http\Controllers\Admin\OrderAdminController;
use App\Http\Controllers\Admin\DashboardController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/



// Rotas públicas
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{id}', [ProductController::class, 'show']);
Route::post('/checkout', [CheckoutController::class, 'store']);
Route::post('/payment/notify', [PaymentWebhookController::class, 'notify']);

// Rotas admin (Sanctum auth)
Route::prefix('admin')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/products', [ProductAdminController::class, 'index']);
        Route::post('/products', [ProductAdminController::class, 'store']);
        Route::put('/products/{product}', [ProductAdminController::class, 'update']);
        Route::patch('/products/{product}/toggle', [ProductAdminController::class, 'toggleActive']);

        Route::get('/orders', [OrderAdminController::class, 'index']);
        Route::get('/orders/{order}', [OrderAdminController::class, 'show']);
        Route::post('/orders/{order}/confirm', [OrderAdminController::class, 'confirm']);
    });
});