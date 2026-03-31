<?php

use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentOptionController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\Storefront\ShopAuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:5,1')->group(function () {
    Route::post('/auth/register', [ShopAuthController::class, 'register']);
    Route::post('/auth/login', [ShopAuthController::class, 'login']);
});

Route::middleware('shop.api')->group(function () {
    Route::get('/auth/me', [ShopAuthController::class, 'me']);
    Route::post('/auth/logout', [ShopAuthController::class, 'logout']);
    Route::get('/auth/orders', [OrderController::class, 'index']);
});

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/payment-options', [PaymentOptionController::class, 'index']);
Route::get('/cart', [CartController::class, 'show']);
Route::post('/cart/items', [CartController::class, 'addItem']);
Route::patch('/cart/items/{cartItem}', [CartController::class, 'updateItem']);
Route::delete('/cart/items/{cartItem}', [CartController::class, 'removeItem']);
Route::delete('/cart', [CartController::class, 'clear']);
Route::post('/orders', [OrderController::class, 'store']);
Route::post('/orders/track', [OrderController::class, 'track'])->middleware('throttle:20,1');
