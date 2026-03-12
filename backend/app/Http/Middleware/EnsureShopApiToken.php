<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureShopApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json([
                'message' => 'Token client requis.',
            ], 401);
        }

        $user = User::query()
            ->where('is_admin', false)
            ->where('shop_api_token', hash('sha256', $token))
            ->first();

        if (! $user) {
            return response()->json([
                'message' => 'Token client invalide.',
            ], 401);
        }

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
