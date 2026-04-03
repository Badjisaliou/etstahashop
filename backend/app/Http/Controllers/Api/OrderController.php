<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\ResolvesShopApiUser;
use App\Http\Controllers\Controller;
use App\Mail\NewOrderAdminMail;
use App\Mail\OrderConfirmationMail;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\HttpException;

class OrderController extends Controller
{
    use ResolvesShopApiUser;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Connexion client requise.',
            ], 401);
        }

        $perPage = min(max($request->integer('per_page', 10), 1), 50);

        $orders = Order::query()
            ->with(['address', 'items.product.images'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return response()->json($orders);
    }

    public function track(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_number' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email:rfc,dns', 'max:255'],
        ]);

        $order = Order::query()
            ->with(['address', 'items.product.images'])
            ->where('order_number', $validated['order_number'])
            ->whereHas('address', function ($query) use ($validated) {
                $query->whereRaw('LOWER(email) = ?', [Str::lower($validated['email'])]);
            })
            ->first();

        if (! $order) {
            throw new HttpException(404, 'Commande introuvable pour cet email.');
        }

        return response()->json([
            'data' => $order,
            'meta' => [
                'payment_option' => config('payment.' . $order->payment_method, []),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $shopUser = $this->resolveShopApiUser($request);

        $validated = $request->validate([
            'payment_method' => ['required', 'string', Rule::in(Order::PAYMENT_METHODS)],
            'payment_reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string'],
            'shipping_amount' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'address' => ['required', 'array'],
            'address.full_name' => ['required', 'string', 'max:255'],
            'address.email' => ['required', 'email:rfc,dns', 'max:255'],
            'address.phone' => ['nullable', 'string', 'max:50'],
            'address.address_line_1' => ['required', 'string', 'max:255'],
            'address.address_line_2' => ['nullable', 'string', 'max:255'],
            'address.city' => ['nullable', 'string', 'max:120'],
            'address.state' => ['nullable', 'string', 'max:120'],
            'address.postal_code' => ['nullable', 'string', 'max:50'],
            'address.country' => ['nullable', 'string', 'size:2'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $order = DB::transaction(function () use ($validated, $shopUser) {
            $groupedItems = collect($validated['items'])
                ->groupBy('product_id')
                ->map(fn ($items, $productId) => [
                    'product_id' => (int) $productId,
                    'quantity' => $items->sum('quantity'),
                ])
                ->values();

            $products = Product::query()
                ->whereIn('id', $groupedItems->pluck('product_id'))
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($groupedItems as $item) {
                $product = $products->get($item['product_id']);

                if (! $product || ! $product->is_active) {
                    throw new HttpException(422, 'Un ou plusieurs produits ne sont plus disponibles.');
                }

                if ($product->stock_quantity < $item['quantity']) {
                    throw new HttpException(422, "Stock insuffisant pour le produit {$product->name}.");
                }
            }

            $normalizedAddress = [
                ...$validated['address'],
                'city' => $validated['address']['city'] ?? 'Non renseignee',
                'country' => $validated['address']['country'] ?? 'SN',
            ];

            $address = Address::create([
                'user_id' => $shopUser?->id,
                ...$normalizedAddress,
            ]);

            $subtotal = $groupedItems->sum(function (array $item) use ($products) {
                $product = $products->get($item['product_id']);

                return (float) $product->price * $item['quantity'];
            });

            $shipping = (float) ($validated['shipping_amount'] ?? 0);
            $tax = (float) ($validated['tax_amount'] ?? 0);
            $discount = (float) ($validated['discount_amount'] ?? 0);
            $total = max($subtotal + $shipping + $tax - $discount, 0);

            $order = Order::create([
                'user_id' => $shopUser?->id,
                'address_id' => $address->id,
                'order_number' => 'ETS-' . strtoupper(Str::random(10)),
                'status' => Order::STATUS_PENDING,
                'payment_status' => Order::PAYMENT_PENDING,
                'payment_method' => $validated['payment_method'],
                'payment_reference' => $validated['payment_reference'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'subtotal_amount' => $subtotal,
                'shipping_amount' => $shipping,
                'tax_amount' => $tax,
                'discount_amount' => $discount,
                'total_amount' => $total,
                'currency' => strtoupper($validated['currency'] ?? 'XOF'),
            ]);

            foreach ($groupedItems as $item) {
                $product = $products->get($item['product_id']);
                $lineTotal = (float) $product->price * $item['quantity'];

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->price,
                    'line_total' => $lineTotal,
                ]);

                $product->decrement('stock_quantity', $item['quantity']);
            }

            return $order->load(['address', 'items.product.images']);
        });

        $paymentOption = config('payment.' . $order->payment_method, []);
        $adminEmail = config('mail.admin_notification_address');

        try {
            Mail::to($order->address->email)->send(new OrderConfirmationMail($order, $paymentOption));
        } catch (\Throwable $exception) {
            report($exception);
        }

        if ($adminEmail && filter_var($adminEmail, FILTER_VALIDATE_EMAIL)) {
            try {
                Mail::to($adminEmail)->send(new NewOrderAdminMail($order, $paymentOption));
            } catch (\Throwable $exception) {
                report($exception);
            }
        } elseif ($adminEmail) {
            Log::warning('MAIL_ADMIN_NOTIFICATION_ADDRESS invalide, notification admin non envoyee.', [
                'value' => $adminEmail,
            ]);
        }

        return response()->json([
            'message' => 'Commande creee avec succes.',
            'data' => $order,
        ], 201);
    }
}
