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
        $perPage = min(max($request->integer('per_page', 24), 1), 60);
        $sort = $request->string('sort')->toString();

        $products = Cache::remember(
            CatalogCache::productsIndexKey($request),
            CatalogCache::ttl(),
            function () use ($request, $perPage, $sort) {
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
                    ->when($request->boolean('in_stock'), function ($query) {
                        $query->where('stock_quantity', '>', 0);
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
                    ->when($sort === 'price_asc', fn ($query) => $query->orderBy('price'))
                    ->when($sort === 'price_desc', fn ($query) => $query->orderByDesc('price'))
                    ->when($sort === 'featured', fn ($query) => $query->orderByDesc('is_featured')->latest())
                    ->when(! in_array($sort, ['price_asc', 'price_desc', 'featured'], true), fn ($query) => $query->latest())
                    ->paginate($perPage)
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
