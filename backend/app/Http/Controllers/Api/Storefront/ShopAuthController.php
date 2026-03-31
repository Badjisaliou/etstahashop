<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Symfony\Component\HttpKernel\Exception\HttpException;

class ShopAuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->merge([
            'email' => $request->filled('email') ? Str::lower(trim((string) $request->input('email'))) : null,
            'phone' => $request->filled('phone') ? $this->normalizePhone((string) $request->input('phone')) : null,
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'required_without:phone', 'email:rfc,dns', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'required_without:email', 'string', 'max:30', Rule::unique('users', 'phone')],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $email = isset($validated['email']) ? Str::lower(trim($validated['email'])) : null;
        $phone = isset($validated['phone']) ? $this->normalizePhone($validated['phone']) : null;

        if ($phone === '') {
            $phone = null;
        }

        if (! $email && ! $phone) {
            throw new HttpException(422, 'Veuillez renseigner un email ou un numero de telephone.');
        }

        $plainTextToken = Str::random(64);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $email,
            'phone' => $phone,
            'password' => $validated['password'],
            'shop_api_token' => hash('sha256', $plainTextToken),
        ]);

        return response()->json([
            'message' => 'Compte client cree avec succes.',
            'data' => [
                'token' => $plainTextToken,
                'user' => $this->formatUser($user),
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->merge([
            'email' => $request->filled('email') ? Str::lower(trim((string) $request->input('email'))) : null,
            'phone' => $request->filled('phone') ? $this->normalizePhone((string) $request->input('phone')) : null,
            'login' => $request->filled('login') ? trim((string) $request->input('login')) : null,
        ]);

        $validated = $request->validate([
            'login' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string'],
        ]);

        $login = trim((string) ($validated['login'] ?? $validated['email'] ?? $validated['phone'] ?? ''));

        if ($login === '') {
            throw new HttpException(422, 'Email ou numero de telephone requis.');
        }

        $userQuery = User::query()->where('is_admin', false);

        if (filter_var($login, FILTER_VALIDATE_EMAIL)) {
            $userQuery->where('email', Str::lower($login));
        } else {
            $userQuery->where('phone', $this->normalizePhone($login));
        }

        $user = $userQuery->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Identifiants client invalides.',
            ], 422);
        }

        $plainTextToken = Str::random(64);
        $user->update([
            'shop_api_token' => hash('sha256', $plainTextToken),
        ]);

        return response()->json([
            'message' => 'Connexion client reussie.',
            'data' => [
                'token' => $plainTextToken,
                'user' => $this->formatUser($user),
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->formatUser($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->update([
            'shop_api_token' => null,
        ]);

        return response()->json([
            'message' => 'Deconnexion client reussie.',
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
        ];
    }

    private function normalizePhone(string $value): string
    {
        $trimmed = trim($value);
        $normalized = preg_replace('/[^\d+]/', '', $trimmed) ?? '';

        if (str_starts_with($normalized, '00')) {
            $normalized = '+' . substr($normalized, 2);
        }

        if ($normalized !== '' && $normalized[0] !== '+') {
            $normalized = '+' . $normalized;
        }

        return $normalized;
    }
}
