<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class CloudinaryUploader
{
    public function uploadProductImage(UploadedFile $file): array
    {
        $cloudName = (string) config('services.cloudinary.cloud_name');
        $apiKey = (string) config('services.cloudinary.api_key');
        $apiSecret = (string) config('services.cloudinary.api_secret');
        $folder = (string) config('services.cloudinary.folder', 'products/uploads');

        if ($cloudName === '' || $apiKey === '' || $apiSecret === '') {
            throw new RuntimeException('Configuration Cloudinary incomplete.');
        }

        $timestamp = time();
        $publicId = Str::uuid()->toString();
        $signature = $this->buildSignature([
            'folder' => $folder,
            'public_id' => $publicId,
            'timestamp' => $timestamp,
        ], $apiSecret);

        $endpoint = sprintf('https://api.cloudinary.com/v1_1/%s/image/upload', $cloudName);

        try {
            $response = Http::timeout(20)
                ->attach(
                    'file',
                    file_get_contents($file->getRealPath()),
                    $file->getClientOriginalName()
                )
                ->post($endpoint, [
                    'api_key' => $apiKey,
                    'timestamp' => $timestamp,
                    'signature' => $signature,
                    'folder' => $folder,
                    'public_id' => $publicId,
                ])
                ->throw();
        } catch (ConnectionException|RequestException $exception) {
            throw new RuntimeException('Upload Cloudinary echoue: '.$exception->getMessage(), 0, $exception);
        }

        $payload = $response->json();

        if (! is_array($payload) || ! isset($payload['secure_url'])) {
            throw new RuntimeException('Reponse Cloudinary invalide.');
        }

        return [
            'path' => (string) $payload['secure_url'],
            'url' => (string) $payload['secure_url'],
            'public_id' => (string) ($payload['public_id'] ?? $publicId),
        ];
    }

    public function ping(): array
    {
        $cloudName = (string) config('services.cloudinary.cloud_name');
        $apiKey = (string) config('services.cloudinary.api_key');
        $apiSecret = (string) config('services.cloudinary.api_secret');

        if ($cloudName === '' || $apiKey === '' || $apiSecret === '') {
            return [
                'status' => 'down',
                'provider' => 'cloudinary',
                'error' => 'Configuration Cloudinary incomplete.',
            ];
        }

        $endpoint = sprintf('https://api.cloudinary.com/v1_1/%s/resources/image', $cloudName);

        try {
            Http::timeout(10)
                ->withBasicAuth($apiKey, $apiSecret)
                ->get($endpoint, ['max_results' => 1])
                ->throw();

            return [
                'status' => 'up',
                'provider' => 'cloudinary',
            ];
        } catch (ConnectionException|RequestException $exception) {
            return [
                'status' => 'down',
                'provider' => 'cloudinary',
                'error' => $exception->getMessage(),
            ];
        }
    }

    private function buildSignature(array $parameters, string $apiSecret): string
    {
        ksort($parameters);

        $toSign = collect($parameters)
            ->map(fn ($value, $key) => sprintf('%s=%s', $key, $value))
            ->implode('&');

        return sha1($toSign.$apiSecret);
    }
}
