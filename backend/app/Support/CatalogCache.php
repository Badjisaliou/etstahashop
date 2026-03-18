<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class CatalogCache
{
    public const VERSION_KEY = 'catalog:version';

    public static function ttl(): int
    {
        return max((int) env('CATALOG_CACHE_TTL_SECONDS', 300), 10);
    }

    public static function version(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 1);
    }

    public static function bust(): void
    {
        $version = self::version();
        Cache::forever(self::VERSION_KEY, $version + 1);
    }

    public static function categoriesKey(): string
    {
        return sprintf('catalog:v%d:categories:index', self::version());
    }

    public static function productsIndexKey(Request $request): string
    {
        $query = $request->query();
        ksort($query);

        return sprintf(
            'catalog:v%d:products:index:%s',
            self::version(),
            md5(json_encode($query, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))
        );
    }

    public static function productShowKey(string $slug): string
    {
        return sprintf('catalog:v%d:products:show:%s', self::version(), $slug);
    }
}
