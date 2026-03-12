<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesShopApiUser;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CartController extends Controller
{
    use ResolvesShopApiUser;

    public function show(Request $request): JsonResponse
    {
        $sessionId = $request->query('session_id');
        $user = $this->resolveShopApiUser($request);

        if (! $sessionId && ! $user) {
            return response()->json([
                'data' => null,
                'message' => 'Aucun panier actif pour cette session.',
            ]);
        }

        $this->synchronizeSessionCart($sessionId, $user);

        return response()->json([
            'data' => $this->findActiveCart($sessionId, $user),
        ]);
    }

    public function addItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['nullable', 'string', 'max:255'],
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $user = $this->resolveShopApiUser($request);
        $sessionId = $validated['session_id'] ?? null;

        if (! $sessionId && ! $user) {
            throw new HttpException(422, 'Une session active ou une connexion client est requise.');
        }

        $cart = DB::transaction(function () use ($validated, $sessionId, $user) {
            $product = Product::query()->lockForUpdate()->findOrFail($validated['product_id']);
            $this->ensureProductCanBeAdded($product, $validated['quantity']);
            $this->synchronizeSessionCart($sessionId, $user);

            $cart = $this->resolveMutableCart($sessionId, $user);

            $cartItem = CartItem::query()->firstOrNew([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
            ]);

            $nextQuantity = ($cartItem->exists ? $cartItem->quantity : 0) + $validated['quantity'];

            if ($product->stock_quantity < $nextQuantity) {
                throw new HttpException(422, "Stock insuffisant pour le produit {$product->name}.");
            }

            $cartItem->fill([
                'quantity' => $nextQuantity,
                'unit_price' => $product->price,
            ])->save();

            return $this->findActiveCart($sessionId, $user);
        });

        return response()->json([
            'message' => 'Produit ajoute au panier avec succes.',
            'data' => $cart,
        ], 201);
    }

    public function updateItem(Request $request, CartItem $cartItem): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['nullable', 'string', 'max:255'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $user = $this->resolveShopApiUser($request);
        $sessionId = $validated['session_id'] ?? null;

        $cart = DB::transaction(function () use ($validated, $cartItem, $sessionId, $user) {
            $cartItem->loadMissing(['cart', 'product']);
            $this->synchronizeSessionCart($sessionId, $user);
            $this->assertCartOwnership($cartItem, $sessionId, $user);

            $product = Product::query()->lockForUpdate()->findOrFail($cartItem->product_id);
            $this->ensureProductCanBeAdded($product, $validated['quantity']);

            $cartItem->update([
                'quantity' => $validated['quantity'],
                'unit_price' => $product->price,
            ]);

            return $this->findActiveCart($sessionId, $user);
        });

        return response()->json([
            'message' => 'Quantite du panier mise a jour avec succes.',
            'data' => $cart,
        ]);
    }

    public function removeItem(Request $request, CartItem $cartItem): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $this->resolveShopApiUser($request);
        $sessionId = $validated['session_id'] ?? null;

        $cart = DB::transaction(function () use ($cartItem, $sessionId, $user) {
            $cartItem->loadMissing('cart');
            $this->synchronizeSessionCart($sessionId, $user);
            $this->assertCartOwnership($cartItem, $sessionId, $user);
            $cartId = $cartItem->cart_id;
            $cartItem->delete();

            $cart = Cart::query()->find($cartId);

            if ($cart && $cart->items()->count() === 0) {
                $cart->delete();

                return null;
            }

            return $this->findActiveCart($sessionId, $user);
        });

        return response()->json([
            'message' => 'Produit retire du panier avec succes.',
            'data' => $cart,
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'session_id' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $this->resolveShopApiUser($request);
        $sessionId = $validated['session_id'] ?? null;

        if (! $sessionId && ! $user) {
            throw new HttpException(422, 'Une session active ou une connexion client est requise.');
        }

        $this->synchronizeSessionCart($sessionId, $user);

        $query = Cart::query()->where('status', 'active');

        if ($user) {
            $query->where('user_id', $user->id);
        } else {
            $query->where('session_id', $sessionId);
        }

        $query->delete();

        return response()->json([
            'message' => 'Panier vide avec succes.',
            'data' => null,
        ]);
    }

    private function findActiveCart(?string $sessionId, ?User $user): ?Cart
    {
        $baseQuery = Cart::query()
            ->with(['items.product.images'])
            ->where('status', 'active');

        if ($user) {
            $cart = (clone $baseQuery)
                ->where('user_id', $user->id)
                ->first();

            if ($cart) {
                return $cart;
            }
        }

        if (! $sessionId) {
            return null;
        }

        return $baseQuery
            ->where('session_id', $sessionId)
            ->first();
    }

    private function ensureProductCanBeAdded(Product $product, int $quantity): void
    {
        if (! $product->is_active) {
            throw new HttpException(422, 'Ce produit n est plus disponible.');
        }

        if ($product->stock_quantity < $quantity) {
            throw new HttpException(422, "Stock insuffisant pour le produit {$product->name}.");
        }
    }

    private function assertCartOwnership(CartItem $cartItem, ?string $sessionId, ?User $user): void
    {
        if (! $cartItem->cart || $cartItem->cart->status !== 'active') {
            throw new HttpException(404, 'Element de panier introuvable pour cette session.');
        }

        if ($user && $cartItem->cart->user_id === $user->id) {
            return;
        }

        if ($sessionId && $cartItem->cart->session_id === $sessionId) {
            return;
        }

        throw new HttpException(404, 'Element de panier introuvable pour cette session.');
    }

    private function resolveMutableCart(?string $sessionId, ?User $user): Cart
    {
        if ($user) {
            $cart = Cart::query()->firstOrCreate(
                [
                    'user_id' => $user->id,
                    'status' => 'active',
                ],
                [
                    'session_id' => $sessionId,
                ],
            );

            if ($sessionId && $cart->session_id !== $sessionId) {
                $cart->update(['session_id' => $sessionId]);
            }

            return $cart;
        }

        return Cart::query()->firstOrCreate([
            'session_id' => $sessionId,
            'status' => 'active',
        ]);
    }

    private function synchronizeSessionCart(?string $sessionId, ?User $user): void
    {
        if (! $sessionId || ! $user) {
            return;
        }

        $sessionCart = Cart::query()
            ->with('items')
            ->where('session_id', $sessionId)
            ->where('status', 'active')
            ->first();

        if (! $sessionCart) {
            Cart::query()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->whereNull('session_id')
                ->update(['session_id' => $sessionId]);

            return;
        }

        if ($sessionCart->user_id === $user->id) {
            return;
        }

        $userCart = Cart::query()
            ->with('items')
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->first();

        if (! $userCart || $userCart->id === $sessionCart->id) {
            $sessionCart->update(['user_id' => $user->id]);

            return;
        }

        foreach ($sessionCart->items as $sessionItem) {
            $existingItem = $userCart->items->firstWhere('product_id', $sessionItem->product_id);

            if ($existingItem) {
                $existingItem->update([
                    'quantity' => $existingItem->quantity + $sessionItem->quantity,
                    'unit_price' => $sessionItem->unit_price,
                ]);
                $sessionItem->delete();
            } else {
                $sessionItem->update([
                    'cart_id' => $userCart->id,
                ]);
            }
        }

        $userCart->update(['session_id' => $sessionId]);
        $sessionCart->delete();
    }
}
