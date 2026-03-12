<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();

        if (! $token) {
            return response()->json([
                'message' => 'Token administrateur requis.',
            ], 401);
        }

        $hashedToken = hash('sha256', $token);

        $user = User::query()
            ->where('is_admin', true)
            ->where('admin_api_token', $hashedToken)
            ->first();

        if (! $user) {
            return response()->json([
                'message' => 'Token administrateur invalide.',
            ], 401);
        }

        $request->setUserResolver(fn () => $user);

        return $next($request);
    }
}
