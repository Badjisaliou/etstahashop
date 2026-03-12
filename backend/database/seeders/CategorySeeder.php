<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Mode',
                'description' => 'Vetements, chaussures et accessoires pour toute la famille.',
                'children' => [
                    ['name' => 'Homme', 'description' => 'Mode homme et accessoires.'],
                    ['name' => 'Femme', 'description' => 'Mode femme et accessoires.'],
                    ['name' => 'Enfant', 'description' => 'Vetements et chaussures enfant.'],
                ],
            ],
            [
                'name' => 'Electronique',
                'description' => 'Smartphones, audio, accessoires et equipements connectes.',
                'children' => [
                    ['name' => 'Smartphones', 'description' => 'Telephones et accessoires mobiles.'],
                    ['name' => 'Audio', 'description' => 'Ecouteurs, enceintes et casques.'],
                    ['name' => 'Accessoires', 'description' => 'Chargeurs, coques et cables.'],
                ],
            ],
            [
                'name' => 'Maison',
                'description' => 'Articles utiles pour la maison et la cuisine.',
                'children' => [
                    ['name' => 'Cuisine', 'description' => 'Ustensiles, conservation et cuisson.'],
                    ['name' => 'Decoration', 'description' => 'Decoration et amenagement interieur.'],
                ],
            ],
            [
                'name' => 'Beaute',
                'description' => 'Soins, parfums et produits de beaute.',
                'children' => [
                    ['name' => 'Soins', 'description' => 'Soins visage et corps.'],
                    ['name' => 'Parfums', 'description' => 'Parfums et senteurs.'],
                ],
            ],
        ];

        foreach ($categories as $categoryData) {
            $parent = Category::updateOrCreate(
                ['slug' => Str::slug($categoryData['name'])],
                [
                    'name' => $categoryData['name'],
                    'description' => $categoryData['description'],
                    'parent_id' => null,
                    'is_active' => true,
                ],
            );

            foreach ($categoryData['children'] as $childData) {
                Category::updateOrCreate(
                    ['slug' => Str::slug($categoryData['name'] . ' ' . $childData['name'])],
                    [
                        'name' => $childData['name'],
                        'description' => $childData['description'],
                        'parent_id' => $parent->id,
                        'is_active' => true,
                    ],
                );
            }
        }
    }
}
