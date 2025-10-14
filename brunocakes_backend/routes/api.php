<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\PaymentWebhookController;
use App\Http\Controllers\Api\StreamController;
use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\ProductAdminController;
use App\Http\Controllers\Admin\OrderAdminController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\Api\AddressController;
use App\Http\Controllers\Api\EngagementController;
use App\Http\Controllers\Api\GeocodeController;

// ==========================================
// ROTAS PÚBLICAS
// Geocodificação reversa
Route::get('/geocode/reverse', [GeocodeController::class, 'reverse']);
// ==========================================

// Produtos (existentes)
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/with-stock', [CheckoutController::class, 'getAllProductsStock']);
Route::get('/products/{id}/stock', [CheckoutController::class, 'getProductStock']);
Route::get('/products/{id}', [ProductController::class, 'show']); // Esta por últim

// Checkout
Route::post('/checkout', [CheckoutController::class, 'storeWithPix']);
Route::get('/checkout/pedidos', [CheckoutController::class, 'getPedidos']);

// Carrinho
Route::prefix('cart')->group(function () {
    Route::post('/add', [CheckoutController::class, 'addToCart']);
    Route::post('/remove', [CheckoutController::class, 'removeFromCart']);
    Route::post('/update', [CheckoutController::class, 'updateCart']);
    Route::get('/session/{session_id}', [CheckoutController::class, 'getCart']);
    Route::delete('/session/{session_id}', [CheckoutController::class, 'clearCart']);
    Route::post('/reserve', [CheckoutController::class, 'reserveCartItems']);
});

// Pedidos
Route::prefix('orders')->group(function () {
    Route::get('/{id}/status', [CheckoutController::class, 'getOrderStatus']);
    Route::get('/{id}/track', [CheckoutController::class, 'trackOrder']);
    Route::patch('/{id}/mark-delivered', [CheckoutController::class, 'markAsDelivered']);
});

// Payment
Route::post('/payment/notify', [PaymentWebhookController::class, 'notify']);
Route::get('/payment/notify', [PaymentWebhookController::class, 'notify']);

// Customer
Route::get('/customer/last-order', [CheckoutController::class, 'getLastOrderCustomer']);

// Analytics
Route::get('/analytics', [AnalyticsController::class, 'index']);

// Stream (se implementado)
Route::prefix('stream')->group(function () {
    Route::get('/updates', [StreamController::class, 'streamUpdates']);
    Route::post('/trigger-stock-update', [StreamController::class, 'triggerStockUpdate']);
});

Route::get('/addresses/active', [AddressController::class, 'getActive']);

// Store Settings (public - apenas dados não sensíveis)
Route::get('/store/settings', [App\Http\Controllers\Api\Admin\StoreSettingController::class, 'public']);

// Engajamento (registro de eventos)
Route::post('/engagement/visitor', [EngagementController::class, 'registerVisitor']);
Route::post('/engagement/pwa-install', [EngagementController::class, 'registerPwaInstall']);
Route::post('/engagement/cart-with-product', [EngagementController::class, 'registerCartWithProduct']);

// ==========================================
// ROTAS ADMIN
// ==========================================
Route::prefix('admin')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::post('/logout', [AuthController::class, 'logout']);

                // Customer
                // Route::get('/customer/last-order', [CheckoutController::class, 'Customer']);
                Route::get('/customers/unique', [OrderAdminController::class, 'getUniqueCustomers']);
                Route::get('customers/analytics', [AnalyticsController::class, 'customerAnalytics']);

        // Products
             Route::prefix('products')->group(function () {
            Route::get('/', [ProductAdminController::class, 'index']);           // GET /api/admin/products
            Route::post('/', [ProductAdminController::class, 'store']);          // POST /api/admin/products
            Route::get('/{id}', [ProductAdminController::class, 'show']);        // GET /api/admin/products/{id}
            Route::put('/{id}', [ProductAdminController::class, 'update']);      // PUT /api/admin/products/{id}
            Route::delete('/{id}', [ProductAdminController::class, 'destroy']);  // DELETE /api/admin/products/{id}
            Route::patch('/{id}/stock', [ProductAdminController::class, 'updateStock']);     // PATCH /api/admin/products/{id}/stock
            Route::patch('/{id}/toggle', [ProductAdminController::class, 'toggleActive']);   // PATCH /api/admin/products/{id}/toggle
            Route::post('/sync-stock', [ProductAdminController::class, 'syncStock']);        // POST /api/admin/products/sync-stock
        });
        
        
        // Orders
        Route::prefix('orders')->group(function () {
        Route::get('/', [OrderAdminController::class, 'index']);
        Route::get('/{id}', [OrderAdminController::class, 'show']);
        Route::patch('/{id}/force-expire', [OrderAdminController::class, 'forceExpire']);
        Route::patch('/{id}/mark-delivered', [OrderAdminController::class, 'markAsDelivered']);
        // ✅ AÇÕES EM LOTE (sem /orders/ duplicado)
        Route::patch('/finish', [OrderAdminController::class, 'markAsCompleted']);
        Route::patch('/cancel-payment', [OrderAdminController::class, 'cancelPayment']);
        });
        
        // System
        Route::prefix('system')->group(function () {
            Route::post('/clean-expired-carts', [OrderAdminController::class, 'cleanExpiredCarts']);
            Route::get('/redis-stats', [OrderAdminController::class, 'redisStats']);
        });
        
            Route::patch('addresses/{id}/activate', [AddressController::class, 'activate']);
            Route::apiResource('addresses', AddressController::class);
            
            // Store Settings
            Route::get('settings', [App\Http\Controllers\Api\Admin\StoreSettingController::class, 'index']);
            Route::post('settings', [App\Http\Controllers\Api\Admin\StoreSettingController::class, 'update']);
            Route::put('settings', [App\Http\Controllers\Api\Admin\StoreSettingController::class, 'update']);
            Route::delete('settings', [App\Http\Controllers\Api\Admin\StoreSettingController::class, 'destroy']);
            
            // Courses Management
            Route::apiResource('courses', App\Http\Controllers\Api\Admin\CourseController::class);
            
            // Students Management
            Route::apiResource('students', App\Http\Controllers\Api\Admin\StudentController::class);
            Route::post('students/{student}/enroll', [App\Http\Controllers\Api\Admin\StudentController::class, 'enrollInCourse']);
            Route::patch('students/{student}/courses/{course}/payment', [App\Http\Controllers\Api\Admin\StudentController::class, 'updateEnrollmentPayment']);
            Route::delete('students/{student}/courses/{course}', [App\Http\Controllers\Api\Admin\StudentController::class, 'removeFromCourse']);
    });

    
});

// ==========================================
// ROTAS PÚBLICAS PARA CURSOS
// ==========================================

// Courses (public) - Qualquer pessoa pode ver os cursos e se inscrever
Route::prefix('courses')->group(function () {
    Route::get('/', [App\Http\Controllers\Api\Public\CourseController::class, 'index']); // Listar cursos ativos
    Route::get('/{course}', [App\Http\Controllers\Api\Public\CourseController::class, 'show']); // Ver detalhes do curso
    Route::post('/{course}/enroll', [App\Http\Controllers\Api\Public\CourseController::class, 'enroll']); // Inscrever-se no curso
});