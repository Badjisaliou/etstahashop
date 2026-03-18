<?php

use App\Http\Controllers\Api\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::prefix('storefront')->group(function () {
    require base_path('routes/storefront.php');
});

Route::prefix('admin')->group(function () {
    require base_path('routes/admin.php');
});
