<?php

namespace App\Http\Controllers\Api\Concerns;

use App\Models\User;
use Illuminate\Http\Request;

trait ResolvesShopApiUser
{
    protected function resolveShopApiUser(Request $request): ?User
    {
        $token = $request->bearerToken();

        if (! $token) {
            return null;
        }

        return User::query()
            ->where('is_admin', false)
            ->where('shop_api_token', hash('sha256', $token))
            ->first();
    }
}
