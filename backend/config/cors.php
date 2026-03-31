<?php

return [
    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        static fn ($origin) => trim($origin),
        explode(',', (string) env(
            'CORS_ALLOWED_ORIGINS',
            'https://etstahashop.vercel.app,https://etstahashop.com,https://etstahashopamin.vercel.app,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5173,http://localhost:5174,null'
        ))
    ), static fn ($origin) => $origin !== '')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => (bool) env('CORS_SUPPORTS_CREDENTIALS', false),
];
