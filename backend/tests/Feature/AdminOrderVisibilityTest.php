<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminOrderVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_and_view_storefront_orders(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin ETS Taha',
            'email' => 'admin@etstaha.shop',
            'password' => Hash::make('admin12345'),
            'is_admin' => true,
        ]);

        $customer = User::factory()->create([
            'email' => 'buyer@example.com',
            'is_admin' => false,
        ]);

        $address = Address::create([
            'user_id' => $customer->id,
            'full_name' => 'Buyer Example',
            'email' => 'buyer@example.com',
            'phone' => '770000000',
            'address_line_1' => 'Rue test',
            'city' => 'Dakar',
            'country' => 'SN',
        ]);

        $product = Product::create([
            'name' => 'Produit admin test',
            'slug' => 'produit-admin-test',
            'sku' => 'ADM-TEST-001',
            'price' => 5000,
            'stock_quantity' => 3,
            'is_active' => true,
            'is_featured' => false,
        ]);

        $order = Order::create([
            'user_id' => $customer->id,
            'address_id' => $address->id,
            'order_number' => 'ETS-ADMIN-ORDER',
            'status' => Order::STATUS_PENDING,
            'payment_status' => Order::PAYMENT_PENDING,
            'payment_method' => Order::PAYMENT_METHOD_WAVE,
            'subtotal_amount' => 5000,
            'shipping_amount' => 0,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => 5000,
            'currency' => 'XOF',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'product_sku' => $product->sku,
            'quantity' => 1,
            'unit_price' => $product->price,
            'line_total' => $product->price,
        ]);

        $loginResponse = $this->postJson('/api/admin/login', [
            'email' => 'admin@etstaha.shop',
            'password' => 'admin12345',
        ]);

        $loginResponse
            ->assertOk()
            ->assertJsonPath('data.user.id', $admin->id);

        $token = $loginResponse->json('data.token');
        $headers = [
            'Authorization' => "Bearer {$token}",
        ];

        $this->getJson('/api/admin/orders?per_page=10', $headers)
            ->assertOk()
            ->assertJsonFragment([
                'order_number' => 'ETS-ADMIN-ORDER',
            ]);

        $this->getJson("/api/admin/orders/{$order->id}", $headers)
            ->assertOk()
            ->assertJsonPath('data.user.email', 'buyer@example.com')
            ->assertJsonPath('data.items.0.product_name', 'Produit admin test');
    }
}
