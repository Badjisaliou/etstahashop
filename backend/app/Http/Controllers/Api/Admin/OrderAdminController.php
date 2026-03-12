<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\HttpException;

class OrderAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(max($request->integer('per_page', 10), 1), 50);

        $orders = Order::query()
            ->with(['address', 'items.product'])
            ->when($request->filled('status'), function ($query) use ($request) {
                $query->where('status', $request->string('status')->toString());
            })
            ->when($request->filled('payment_status'), function ($query) use ($request) {
                $query->where('payment_status', $request->string('payment_status')->toString());
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = '%' . $request->string('search')->trim() . '%';

                $query->where(function ($builder) use ($term) {
                    $builder
                        ->where('order_number', 'like', $term)
                        ->orWhere('payment_method', 'like', $term)
                        ->orWhere('payment_reference', 'like', $term)
                        ->orWhereHas('address', function ($addressQuery) use ($term) {
                            $addressQuery
                                ->where('full_name', 'like', $term)
                                ->orWhere('phone', 'like', $term)
                                ->orWhere('city', 'like', $term);
                        });
                });
            })
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($orders);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json([
            'data' => $order->load(['address', 'items.product.images', 'user:id,name,email']),
        ]);
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(Order::STATUSES)],
            'payment_status' => ['sometimes', 'string', Rule::in(Order::PAYMENT_STATUSES)],
            'payment_method' => ['nullable', 'string', Rule::in(Order::PAYMENT_METHODS)],
            'payment_reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
        ]);

        $updatedOrder = DB::transaction(function () use ($validated, $order) {
            $order->loadMissing('items');

            $nextStatus = $validated['status'] ?? $order->status;
            $nextPaymentStatus = $validated['payment_status'] ?? $order->payment_status;
            $wasCancelled = $order->status === Order::STATUS_CANCELLED;
            $willBeCancelled = $nextStatus === Order::STATUS_CANCELLED;

            if (! $wasCancelled && $willBeCancelled) {
                foreach ($order->items as $item) {
                    if (! $item->product_id) {
                        continue;
                    }

                    Product::query()
                        ->whereKey($item->product_id)
                        ->lockForUpdate()
                        ->increment('stock_quantity', $item->quantity);
                }
            }

            if ($wasCancelled && ! $willBeCancelled) {
                $products = Product::query()
                    ->whereIn('id', $order->items->pluck('product_id')->filter())
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                foreach ($order->items as $item) {
                    if (! $item->product_id) {
                        continue;
                    }

                    $product = $products->get($item->product_id);

                    if (! $product || ! $product->is_active) {
                        throw new HttpException(422, 'Impossible de reactiver une commande avec un produit indisponible.');
                    }

                    if ($product->stock_quantity < $item->quantity) {
                        throw new HttpException(422, "Stock insuffisant pour reactiver la commande du produit {$product->name}.");
                    }
                }

                foreach ($order->items as $item) {
                    if (! $item->product_id) {
                        continue;
                    }

                    $products->get($item->product_id)?->decrement('stock_quantity', $item->quantity);
                }
            }

            $paymentValidatedAt = $order->payment_validated_at;

            if ($nextPaymentStatus === Order::PAYMENT_PAID && ! $paymentValidatedAt) {
                $paymentValidatedAt = Carbon::now();
            }

            if ($nextPaymentStatus !== Order::PAYMENT_PAID) {
                $paymentValidatedAt = null;
            }

            $order->update([
                'status' => $nextStatus,
                'payment_status' => $nextPaymentStatus,
                'payment_method' => array_key_exists('payment_method', $validated) ? $validated['payment_method'] : $order->payment_method,
                'payment_reference' => array_key_exists('payment_reference', $validated) ? $validated['payment_reference'] : $order->payment_reference,
                'payment_validated_at' => $paymentValidatedAt,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $order->notes,
            ]);

            return $order->refresh()->load(['address', 'items.product.images', 'user:id,name,email']);
        });

        return response()->json([
            'message' => 'Commande mise a jour avec succes.',
            'data' => $updatedOrder,
            'meta' => [
                'available_statuses' => Order::STATUSES,
                'available_payment_statuses' => Order::PAYMENT_STATUSES,
                'available_payment_methods' => Order::PAYMENT_METHODS,
            ],
        ]);
    }
}
