<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\CatalogCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Cache::remember(CatalogCache::categoriesKey(), CatalogCache::ttl(), function () {
            return Category::query()
                ->where('is_active', true)
                ->withCount('products')
                ->orderBy('name')
                ->get()
                ->toArray();
        });

        return response()->json([
            'data' => $categories,
        ]);
    }
}
