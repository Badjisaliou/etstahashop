return [

    'paths' => [
        'api/*',
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://etstahashop.vercel.app',
        'https://etstahashopamin.vercel.app',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];