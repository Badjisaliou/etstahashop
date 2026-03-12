<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class PaymentOptionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => config('payment'),
        ]);
    }
}
