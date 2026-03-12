<?php

use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'message' => 'ETS Taha Shop API is running.',
    ]);
});

Route::prefix('storefront')->group(function () {
    require base_path('routes/storefront.php');
});

Route::prefix('admin')->group(function () {
    require base_path('routes/admin.php');
});
