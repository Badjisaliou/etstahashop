<?php

return [
    'wave' => [
        'label' => env('PAYMENT_WAVE_LABEL', 'Wave'),
        'account_name' => env('PAYMENT_WAVE_ACCOUNT_NAME', 'ETS Taha Shop'),
        'account_number' => env('PAYMENT_WAVE_ACCOUNT_NUMBER', ''),
        'instructions' => env('PAYMENT_WAVE_INSTRUCTIONS', 'Effectuez le transfert Wave puis conservez la reference.'),
    ],
    'orange_money' => [
        'label' => env('PAYMENT_ORANGE_MONEY_LABEL', 'Orange Money'),
        'account_name' => env('PAYMENT_ORANGE_MONEY_ACCOUNT_NAME', 'ETS Taha Shop'),
        'account_number' => env('PAYMENT_ORANGE_MONEY_ACCOUNT_NUMBER', ''),
        'instructions' => env('PAYMENT_ORANGE_MONEY_INSTRUCTIONS', 'Effectuez le transfert Orange Money puis conservez la reference.'),
    ],
];
