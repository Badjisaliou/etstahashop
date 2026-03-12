<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\CategoryAdminController;
use App\Http\Controllers\Api\Admin\OrderAdminController;
use App\Http\Controllers\Api\Admin\ProductAdminController;
use App\Http\Controllers\Api\Admin\ProductImageUploadController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AdminAuthController::class, 'login']);

Route::middleware('admin.api')->group(function () {
    Route::get('/me', [AdminAuthController::class, 'me']);
    Route::post('/logout', [AdminAuthController::class, 'logout']);
    Route::post('/uploads/products/images', [ProductImageUploadController::class, 'store']);
    Route::patch('/categories/{category}/toggle-status', [CategoryAdminController::class, 'toggleStatus']);
    Route::patch('/products/{product}/toggle-status', [ProductAdminController::class, 'toggleStatus']);
    Route::apiResource('categories', CategoryAdminController::class);
    Route::apiResource('products', ProductAdminController::class);
    Route::apiResource('orders', OrderAdminController::class)->only(['index', 'show', 'update']);
});
