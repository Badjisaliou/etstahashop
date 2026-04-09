<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CloudinaryUploader;
use App\Services\WhatsAppNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;
use Throwable;

class HealthController extends Controller
{
    public function __construct(
        private readonly CloudinaryUploader $cloudinaryUploader,
        private readonly WhatsAppNotifier $whatsAppNotifier
    ) {
    }

    public function __invoke(): JsonResponse
    {
        $mediaDisk = (string) config('filesystems.media_disk', 'public');

        return response()->json([
            'message' => 'ETS Taha Shop API is running.',
            'services' => [
                'redis' => $this->checkRedis(),
                'storage' => $this->checkStorage($mediaDisk),
                'mail' => $this->checkMail(),
                'whatsapp' => $this->whatsAppNotifier->status(),
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
        if ($disk === 'cloudinary') {
            return $this->cloudinaryUploader->ping();
        }

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

    private function checkMail(): array
    {
        $mailer = (string) config('mail.default', 'log');

        if (in_array($mailer, ['log', 'array'], true)) {
            return [
                'status' => 'degraded',
                'mailer' => $mailer,
                'message' => 'Les emails ne sont pas envoyes reellement avec ce mailer.',
            ];
        }

        if ($mailer === 'smtp') {
            $host = (string) config('mail.mailers.smtp.host', '');
            $port = (int) config('mail.mailers.smtp.port', 0);
            $username = (string) config('mail.mailers.smtp.username', '');
            $from = (string) config('mail.from.address', '');
            $admin = (string) config('mail.admin_notification_address', '');

            if ($host === '' || $port === 0 || $username === '' || $from === '') {
                return [
                    'status' => 'down',
                    'mailer' => $mailer,
                    'message' => 'Configuration SMTP incomplete.',
                ];
            }

            return [
                'status' => 'up',
                'mailer' => $mailer,
                'from' => $from,
                'admin_notification_address' => $admin !== '' ? $admin : null,
            ];
        }

        return [
            'status' => 'up',
            'mailer' => $mailer,
        ];
    }
}
