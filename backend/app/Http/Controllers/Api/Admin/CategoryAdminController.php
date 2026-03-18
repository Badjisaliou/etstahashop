<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\CatalogCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 10), 1), 50);

        $categories = Category::query()
            ->with(['parent:id,name,slug', 'children:id,parent_id,name,slug,is_active'])
            ->withCount('products')
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%' . $request->string('search') . '%';

                $query->where(function ($builder) use ($term) {
                    $builder
                        ->where('name', 'like', $term)
                        ->orWhere('slug', 'like', $term)
                        ->orWhere('description', 'like', $term);
                });
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                if ($request->string('status')->toString() === 'active') {
                    $query->where('is_active', true);
                }

                if ($request->string('status')->toString() === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($categories);
    }

    public function show(Category $category): JsonResponse
    {
        $category->load(['parent:id,name,slug', 'children:id,parent_id,name,slug,is_active']);
        $category->loadCount('products');

        return response()->json([
            'data' => $category,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateCategory($request);

        $category = Category::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        $category->loadCount('products');
        CatalogCache::bust();

        return response()->json([
            'message' => 'Categorie creee avec succes.',
            'data' => $category,
        ], 201);
    }

    public function update(Request $request, Category $category): JsonResponse
    {
        $validated = $this->validateCategory($request, $category);

        $category->update([
            'name' => $validated['name'],
            'slug' => $validated['slug'] ?? Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'parent_id' => $validated['parent_id'] ?? null,
            'is_active' => $validated['is_active'] ?? $category->is_active,
        ]);

        $category->refresh()->loadCount('products');
        CatalogCache::bust();

        return response()->json([
            'message' => 'Categorie modifiee avec succes.',
            'data' => $category,
        ]);
    }

    public function destroy(Category $category): JsonResponse
    {
        if ($category->children()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer une categorie qui contient encore des sous-categories.',
            ], 422);
        }

        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Impossible de supprimer une categorie qui contient encore des produits.',
            ], 422);
        }

        $category->delete();
        CatalogCache::bust();

        return response()->json([
            'message' => 'Categorie supprimee avec succes.',
        ]);
    }

    public function toggleStatus(Category $category): JsonResponse
    {
        $category->update([
            'is_active' => ! $category->is_active,
        ]);
        CatalogCache::bust();

        return response()->json([
            'message' => $category->is_active ? 'Categorie activee avec succes.' : 'Categorie desactivee avec succes.',
            'data' => $category->refresh()->loadCount('products'),
        ]);
    }

    private function validateCategory(Request $request, ?Category $category = null): array
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($category?->id)],
            'description' => ['nullable', 'string'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id', Rule::notIn([$category?->id])],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validator->after(function ($validator) use ($request, $category) {
            if (! $category || ! $request->filled('parent_id')) {
                return;
            }

            $candidateParent = Category::find($request->integer('parent_id'));

            while ($candidateParent) {
                if ($candidateParent->id === $category->id) {
                    $validator->errors()->add('parent_id', 'Le parent choisi cree une boucle invalide dans l arborescence.');
                    break;
                }

                $candidateParent = $candidateParent->parent;
            }
        });

        return $validator->validate();
    }
}
