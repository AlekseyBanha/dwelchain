<?php

return [

    /*
    |--------------------------------------------------------------------------
    | MVP city scope
    |--------------------------------------------------------------------------
    |
    | Public catalog / map / owner requests are limited to Kyiv in MVP.
    | Geo seed uses cities.id = 268, slug = kyyiv.
    |
    */

    'mvp_city_id' => (int) env('DWELCHAIN_MVP_CITY_ID', 268),
    'mvp_city_slug' => env('DWELCHAIN_MVP_CITY_SLUG', 'kyyiv'),
    'mvp_city_name' => env('DWELCHAIN_MVP_CITY_NAME', 'Київ'),

    /*
    |--------------------------------------------------------------------------
    | Email one-time codes
    |--------------------------------------------------------------------------
    */

    'auth' => [
        'code_length' => 6,
        'code_ttl_minutes' => 10,
        'resend_cooldown_seconds' => 60,
        // Per email — anti-abuse for a single mailbox.
        'max_codes_per_hour' => (int) env('DWELCHAIN_AUTH_MAX_CODES_PER_HOUR', 10),
        // Per IP — higher by default: behind Docker/NAT many requests share one address.
        'max_codes_per_ip_per_hour' => (int) env('DWELCHAIN_AUTH_MAX_CODES_PER_IP_PER_HOUR', 60),
        'max_verify_attempts' => 5,
        'password_min' => 8,
    ],

];
