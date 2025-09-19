<?php


use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ProductAdminController;
use App\Http\Controllers\Admin\OrderAdminController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Api\AnalyticsController;

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
Route::get('/analytics', [AnalyticsController::class, 'index']);

Route::get('/checkout/pedidos', [CheckoutController::class, 'getPedidos']);

// Rotas admin (Sanctum auth)
Route::prefix('admin')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::get('/products', [ProductAdminController::class, 'index']);
        Route::post('/products', [ProductAdminController::class, 'store']);
        Route::match(['put', 'patch'], 'products/{id}', [ProductAdminController::class, 'update']);
        Route::patch('/products/{product}/toggle', [ProductAdminController::class, 'toggleActive']);

        Route::get('/orders', [OrderAdminController::class, 'index']);
        Route::get('/orders/{order}', [OrderAdminController::class, 'show']);
        Route::patch('/orders/approve-payment', [OrderAdminController::class, 'approvePayment']);
        Route::patch('/orders/finish', [OrderAdminController::class, 'markAsCompleted']); // Corrigido
        Route::patch('/orders/cancel-payment', [OrderAdminController::class, 'cancelPayment']); // Corrigido
        Route::match(['post', 'patch'], '/orders/confirm-many', [OrderAdminController::class, 'confirmMany']);

        Route::get('customers/unique', [OrderAdminController::class, 'getUniqueCustomers']);
    });
});