<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StorefrontAuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_view_profile_and_logout(): void
    {
        $registerResponse = $this->postJson('/api/storefront/auth/register', [
            'name' => 'Client Smoke',
            'email' => 'client@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $registerResponse
            ->assertCreated()
            ->assertJsonPath('data.user.email', 'client@example.com');

        $token = $registerResponse->json('data.token');

        $this->getJson('/api/storefront/auth/me', [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.email', 'client@example.com');

        $this->postJson('/api/storefront/auth/logout', [], [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('message', 'Deconnexion client reussie.');

        $this->getJson('/api/storefront/auth/me', [
            'Authorization' => "Bearer {$token}",
        ])->assertUnauthorized();
    }

    public function test_authenticated_customer_can_checkout_and_see_order_history(): void
    {
        $customer = User::factory()->create([
            'email' => 'shopper@example.com',
            'is_admin' => false,
        ]);

        $token = 'shop-token-value';
        $customer->update([
            'shop_api_token' => hash('sha256', $token),
        ]);

        $product = $this->createProduct([
            'stock_quantity' => 5,
            'price' => 189900,
        ]);

        $headers = [
            'Authorization' => "Bearer {$token}",
        ];

        $this->postJson('/api/storefront/cart/items', [
            'session_id' => 'session-checkout',
            'product_id' => $product->id,
            'quantity' => 1,
        ], $headers)
            ->assertCreated()
            ->assertJsonPath('data.items_count', 1);

        $checkoutResponse = $this->postJson('/api/storefront/orders', [
            'payment_method' => 'wave',
            'payment_reference' => 'TEST-REF-001',
            'notes' => 'Order from automated test',
            'address' => [
                'full_name' => 'Shopper Example',
                'email' => 'shopper@example.com',
                'phone' => '770000000',
                'address_line_1' => 'Rue 1',
                'address_line_2' => null,
                'city' => 'Dakar',
                'state' => null,
                'postal_code' => null,
                'country' => 'SN',
            ],
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ],
            ],
        ], $headers);

        $checkoutResponse
            ->assertCreated()
            ->assertJsonPath('data.user_id', $customer->id)
            ->assertJsonPath('data.payment_method', 'wave');

        $orderNumber = $checkoutResponse->json('data.order_number');

        $this->assertDatabaseHas('orders', [
            'order_number' => $orderNumber,
            'user_id' => $customer->id,
        ]);

        $this->assertDatabaseHas('addresses', [
            'user_id' => $customer->id,
            'email' => 'shopper@example.com',
        ]);

        $product->refresh();
        $this->assertSame(4, $product->stock_quantity);

        $historyResponse = $this->getJson('/api/storefront/auth/orders', $headers);

        $historyResponse
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.order_number', $orderNumber);
    }

    private function createProduct(array $overrides = []): Product
    {
        $category = Category::create([
            'name' => 'Electronique',
            'slug' => 'electronique',
            'description' => 'Categorie test',
            'is_active' => true,
        ]);

        return Product::create(array_merge([
            'category_id' => $category->id,
            'name' => 'Produit test',
            'slug' => 'produit-test',
            'sku' => 'SKU-TEST-001',
            'short_description' => 'Produit de test',
            'description' => 'Produit de test complet',
            'price' => 1000,
            'compare_price' => 1500,
            'stock_quantity' => 10,
            'is_active' => true,
            'is_featured' => true,
        ], $overrides));
    }
}
