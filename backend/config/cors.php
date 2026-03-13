<?php

return [

    'paths' => [
        'api/*',
        'storefront/*',
        'admin/*',
        'health',
        'sanctum/csrf-cookie',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://etstahashop.vercel.app',
        'https://etstahashopadmin.vercel.app',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];