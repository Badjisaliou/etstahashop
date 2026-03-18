<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Support\CatalogCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = Cache::remember(
            CatalogCache::productsIndexKey($request),
            CatalogCache::ttl(),
            function () use ($request) {
                return Product::query()
                    ->with(['category', 'images'])
                    ->where('is_active', true)
                    ->when($request->filled('category'), function ($query) use ($request) {
                        $query->whereHas('category', function ($categoryQuery) use ($request) {
                            $categoryQuery->where('slug', $request->string('category'));
                        });
                    })
                    ->when($request->boolean('featured'), function ($query) {
                        $query->where('is_featured', true);
                    })
                    ->when($request->filled('search'), function ($query) use ($request) {
                        $term = '%' . $request->string('search') . '%';
                        $query->where(function ($builder) use ($term) {
                            $builder
                                ->where('name', 'like', $term)
                                ->orWhere('sku', 'like', $term)
                                ->orWhere('short_description', 'like', $term);
                        });
                    })
                    ->latest()
                    ->paginate(12)
                    ->withQueryString()
                    ->toArray();
            }
        );

        return response()->json($products);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Cache::remember(CatalogCache::productShowKey($slug), CatalogCache::ttl(), function () use ($slug) {
            return Product::query()
                ->with(['category', 'images'])
                ->where('slug', $slug)
                ->where('is_active', true)
                ->firstOrFail()
                ->toArray();
        });

        return response()->json([
            'data' => $product,
        ]);
    }
}
