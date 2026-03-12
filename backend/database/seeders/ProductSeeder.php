<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'category_slug' => 'electronique-smartphones',
                'name' => 'Infinix Note 40',
                'sku' => 'PHONE-INF-040',
                'short_description' => 'Smartphone 256 Go avec ecran AMOLED et charge rapide.',
                'description' => 'Un smartphone polyvalent concu pour la photo, le streaming et un usage quotidien intensif.',
                'price' => 189900,
                'compare_price' => 209900,
                'stock_quantity' => 18,
                'is_featured' => true,
                'images' => [
                    'products/infinix-note-40/front.jpg',
                    'products/infinix-note-40/back.jpg',
                ],
            ],
            [
                'category_slug' => 'electronique-audio',
                'name' => 'Ecouteurs Bluetooth Pro',
                'sku' => 'AUD-BTPRO-001',
                'short_description' => 'Ecouteurs sans fil avec boitier de charge et reduction de bruit.',
                'description' => 'Parfaits pour les appels, la musique et les deplacements avec une excellente autonomie.',
                'price' => 24900,
                'compare_price' => 29900,
                'stock_quantity' => 42,
                'is_featured' => true,
                'images' => [
                    'products/ecouteurs-pro/main.jpg',
                ],
            ],
            [
                'category_slug' => 'mode-homme',
                'name' => 'Polo Premium Homme',
                'sku' => 'MOD-H-POL-001',
                'short_description' => 'Polo coton coupe moderne, confortable et respirant.',
                'description' => 'Ideal pour le quotidien ou les sorties avec une finition soignee et un tissu durable.',
                'price' => 12900,
                'compare_price' => 15900,
                'stock_quantity' => 30,
                'is_featured' => false,
                'images' => [
                    'products/polo-premium-homme/main.jpg',
                ],
            ],
            [
                'category_slug' => 'mode-femme',
                'name' => 'Sac a Main Elegance',
                'sku' => 'MOD-F-BAG-002',
                'short_description' => 'Sac a main structure avec finition elegante.',
                'description' => 'Un modele chic pour les sorties et le bureau avec plusieurs compartiments interieurs.',
                'price' => 21900,
                'compare_price' => 25900,
                'stock_quantity' => 15,
                'is_featured' => true,
                'images' => [
                    'products/sac-elegance/main.jpg',
                ],
            ],
            [
                'category_slug' => 'maison-cuisine',
                'name' => 'Set de Casseroles Inox',
                'sku' => 'HOM-KIT-INOX',
                'short_description' => 'Batterie de cuisine inox 6 pieces.',
                'description' => 'Convient a une cuisine quotidienne avec une bonne diffusion de chaleur et un nettoyage facile.',
                'price' => 45900,
                'compare_price' => 51900,
                'stock_quantity' => 11,
                'is_featured' => false,
                'images' => [
                    'products/casseroles-inox/main.jpg',
                ],
            ],
            [
                'category_slug' => 'beaute-soins',
                'name' => 'Coffret Soin Visage',
                'sku' => 'BEAUTY-SKIN-01',
                'short_description' => 'Routine complete hydratation et eclat.',
                'description' => 'Coffret de soins pour une routine simple avec nettoyant, serum et creme hydratante.',
                'price' => 18900,
                'compare_price' => 22900,
                'stock_quantity' => 24,
                'is_featured' => true,
                'images' => [
                    'products/coffret-soin-visage/main.jpg',
                ],
            ],
            [
                'category_slug' => 'mode-enfant',
                'name' => 'Baskets Junior Street',
                'sku' => 'KID-SNK-004',
                'short_description' => 'Baskets confortables pour l ecole et les loisirs.',
                'description' => 'Semelle souple, fermeture pratique et design moderne pour enfants actifs.',
                'price' => 16900,
                'compare_price' => 19900,
                'stock_quantity' => 20,
                'is_featured' => false,
                'images' => [
                    'products/baskets-junior/main.jpg',
                ],
            ],
            [
                'category_slug' => 'electronique-accessoires',
                'name' => 'Chargeur Rapide USB-C 33W',
                'sku' => 'ACC-USBC-33W',
                'short_description' => 'Chargeur compact compatible smartphone et tablette.',
                'description' => 'Charge stable et rapide avec protection contre la surchauffe et les surtensions.',
                'price' => 9900,
                'compare_price' => 11900,
                'stock_quantity' => 60,
                'is_featured' => false,
                'images' => [
                    'products/chargeur-usbc/main.jpg',
                ],
            ],
        ];

        foreach ($products as $productData) {
            $category = Category::where('slug', $productData['category_slug'])->first();

            if (! $category) {
                continue;
            }

            $product = Product::updateOrCreate(
                ['slug' => Str::slug($productData['name'])],
                [
                    'category_id' => $category->id,
                    'name' => $productData['name'],
                    'sku' => $productData['sku'],
                    'short_description' => $productData['short_description'],
                    'description' => $productData['description'],
                    'price' => $productData['price'],
                    'compare_price' => $productData['compare_price'],
                    'stock_quantity' => $productData['stock_quantity'],
                    'is_active' => true,
                    'is_featured' => $productData['is_featured'],
                ],
            );

            foreach ($productData['images'] as $imageIndex => $path) {
                ProductImage::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'path' => $path,
                    ],
                    [
                        'alt_text' => $product->name,
                        'position' => $imageIndex,
                        'is_primary' => $imageIndex === 0,
                    ],
                );
            }
        }
    }
}
