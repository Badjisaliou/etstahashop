<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Support\CatalogCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 10), 1), 50);

        $products = Product::query()
            ->with(['category:id,name,slug', 'images'])
            ->when($request->filled('category_id'), function ($query) use ($request) {
                $query->where('category_id', $request->integer('category_id'));
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                if ($request->string('status')->toString() === 'active') {
                    $query->where('is_active', true);
                }

                if ($request->string('status')->toString() === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->when($request->filled('featured'), function ($query) use ($request) {
                if ($request->string('featured')->toString() === '1') {
                    $query->where('is_featured', true);
                }
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%' . $request->string('search') . '%';
                $query->where(function ($builder) use ($term) {
                    $builder
                        ->where('name', 'like', $term)
                        ->orWhere('sku', 'like', $term)
                        ->orWhere('slug', 'like', $term)
                        ->orWhere('short_description', 'like', $term);
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($products);
    }

    public function show(Product $product): JsonResponse
    {
        $product->load(['category:id,name,slug', 'images']);

        return response()->json([
            'data' => $product,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateProduct($request);

        $product = DB::transaction(function () use ($validated) {
            $product = Product::create([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'slug' => $validated['slug'] ?? Str::slug($validated['name']),
                'sku' => $validated['sku'],
                'short_description' => $validated['short_description'] ?? null,
                'description' => $validated['description'] ?? null,
                'price' => $validated['price'],
                'compare_price' => $validated['compare_price'] ?? null,
                'stock_quantity' => $validated['stock_quantity'] ?? 0,
                'is_active' => $validated['is_active'] ?? true,
                'is_featured' => $validated['is_featured'] ?? false,
            ]);

            $this->syncImages($product, $validated['images'] ?? []);

            return $product->load(['category:id,name,slug', 'images']);
        });
        CatalogCache::bust();

        return response()->json([
            'message' => 'Produit cree avec succes.',
            'data' => $product,
        ], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->validateProduct($request, $product->id);

        $product = DB::transaction(function () use ($validated, $product) {
            $product->update([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'slug' => $validated['slug'] ?? Str::slug($validated['name']),
                'sku' => $validated['sku'],
                'short_description' => $validated['short_description'] ?? null,
                'description' => $validated['description'] ?? null,
                'price' => $validated['price'],
                'compare_price' => $validated['compare_price'] ?? null,
                'stock_quantity' => $validated['stock_quantity'] ?? 0,
                'is_active' => $validated['is_active'] ?? $product->is_active,
                'is_featured' => $validated['is_featured'] ?? $product->is_featured,
            ]);

            if (array_key_exists('images', $validated)) {
                $this->syncImages($product, $validated['images']);
            }

            return $product->refresh()->load(['category:id,name,slug', 'images']);
        });
        CatalogCache::bust();

        return response()->json([
            'message' => 'Produit modifie avec succes.',
            'data' => $product,
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();
        CatalogCache::bust();

        return response()->json([
            'message' => 'Produit supprime avec succes.',
        ]);
    }

    public function toggleStatus(Product $product): JsonResponse
    {
        $product->update([
            'is_active' => ! $product->is_active,
        ]);
        CatalogCache::bust();

        return response()->json([
            'message' => $product->is_active ? 'Produit active avec succes.' : 'Produit desactive avec succes.',
            'data' => $product->refresh()->load(['category:id,name,slug', 'images']),
        ]);
    }

    private function validateProduct(Request $request, ?int $productId = null): array
    {
        return $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('products', 'slug')->ignore($productId)],
            'sku' => ['required', 'string', 'max:255', Rule::unique('products', 'sku')->ignore($productId)],
            'short_description' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'compare_price' => ['nullable', 'numeric', 'gte:price'],
            'stock_quantity' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
            'images' => ['sometimes', 'array'],
            'images.*.path' => ['required_with:images', 'string', 'max:255'],
            'images.*.alt_text' => ['nullable', 'string', 'max:255'],
            'images.*.position' => ['nullable', 'integer', 'min:0'],
            'images.*.is_primary' => ['nullable', 'boolean'],
        ], [
            'compare_price.gte' => 'Le prix compare doit etre superieur ou egal au prix de vente.',
        ]);
    }

    private function syncImages(Product $product, array $images): void
    {
        $product->images()->delete();

        foreach ($images as $index => $image) {
            $product->images()->create([
                'path' => $image['path'],
                'alt_text' => $image['alt_text'] ?? $product->name,
                'position' => $image['position'] ?? $index,
                'is_primary' => $image['is_primary'] ?? $index === 0,
            ]);
        }
    }
}
