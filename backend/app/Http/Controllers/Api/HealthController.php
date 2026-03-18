<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $mediaDisk = (string) config('filesystems.media_disk', 'public');

        return response()->json([
            'message' => 'ETS Taha Shop API is running.',
            'services' => [
                'redis' => $this->checkRedis(),
                'storage' => $this->checkStorage($mediaDisk),
            ],
        ]);
    }

    private function checkRedis(): array
    {
        try {
            Redis::connection()->ping();

            return [
                'status' => 'up',
            ];
        } catch (Throwable $exception) {
            return [
                'status' => 'down',
                'error' => $exception->getMessage(),
            ];
        }
    }

    private function checkStorage(string $disk): array
    {
        try {
            Storage::disk($disk)->files('');

            return [
                'status' => 'up',
                'disk' => $disk,
            ];
        } catch (Throwable $exception) {
            return [
                'status' => 'down',
                'disk' => $disk,
                'error' => $exception->getMessage(),
            ];
        }
    }
}
