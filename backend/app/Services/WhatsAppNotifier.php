<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppNotifier
{
    public function status(): array
    {
        $provider = $this->provider();

        if (! $this->isEnabled()) {
            return [
                'status' => 'disabled',
                'provider' => $provider,
                'message' => 'Notifications WhatsApp desactivees.',
            ];
        }

        $missing = $this->missingConfigurationKeys();

        if ($missing !== []) {
            return [
                'status' => 'down',
                'provider' => $provider,
                'message' => 'Configuration WhatsApp incomplete.',
                'missing' => $missing,
            ];
        }

        return [
            'status' => 'up',
            'provider' => $provider,
            'admin_number' => config('services.whatsapp.admin_number'),
        ];
    }

    public function sendNewOrderToAdmin(Order $order, array $paymentOption = []): bool
    {
        if (! $this->isEnabled()) {
            return false;
        }

        $missing = $this->missingConfigurationKeys();

        if ($missing !== []) {
            Log::warning('Notification WhatsApp non envoyee: configuration incomplete.', [
                'missing' => $missing,
            ]);

            return false;
        }

        $message = $this->buildNewOrderMessage($order, $paymentOption);

        try {
            if ($this->provider() === 'twilio') {
                return $this->sendViaTwilio($order, $message);
            }

            return $this->sendViaMetaCloud($order, $message);
        } catch (\Throwable $exception) {
            report($exception);
        }

        return false;
    }

    private function buildNewOrderMessage(Order $order, array $paymentOption): string
    {
        $lines = $order->items
            ->take(5)
            ->map(function ($item) use ($order) {
                return sprintf('- %s x%d (%s %s)', $item->product_name, $item->quantity, $item->line_total, $order->currency);
            })
            ->all();

        $itemsSection = $lines === [] ? '- Aucun article' : implode("\n", $lines);

        $paymentLabel = (string) ($paymentOption['label'] ?? $order->payment_method ?? 'Non renseigne');
        $accountNumber = (string) ($paymentOption['account_number'] ?? 'Non renseigne');

        return implode("\n", [
            'Nouvelle commande ETS Taha Shop',
            'Commande: ' . ($order->order_number ?? ('#' . $order->id)),
            'Client: ' . ($order->address?->full_name ?? 'Non renseigne'),
            'Telephone: ' . ($order->address?->phone ?? 'Non renseigne'),
            'Email: ' . ($order->address?->email ?? 'Non renseigne'),
            'Adresse: ' . ($order->address?->address_line_1 ?? 'Non renseignee'),
            'Paiement: ' . $paymentLabel,
            'Numero de transfert: ' . $accountNumber,
            'Reference: ' . ($order->payment_reference ?? 'Non renseignee'),
            'Montant total: ' . $order->total_amount . ' ' . $order->currency,
            'Articles:',
            $itemsSection,
        ]);
    }

    private function normalizePhone(string $phone): string
    {
        $normalized = preg_replace('/\D+/', '', $phone) ?? '';

        return ltrim($normalized, '0');
    }

    private function provider(): string
    {
        $provider = (string) config('services.whatsapp.provider', 'meta');

        return in_array($provider, ['meta', 'twilio'], true) ? $provider : 'meta';
    }

    private function sendViaMetaCloud(Order $order, string $message): bool
    {
        $endpoint = sprintf(
            'https://graph.facebook.com/%s/%s/messages',
            config('services.whatsapp.meta.api_version', 'v21.0'),
            config('services.whatsapp.meta.phone_number_id')
        );

        $to = $this->normalizePhone((string) config('services.whatsapp.admin_number'));

        $response = Http::timeout((int) config('services.whatsapp.timeout_seconds', 10))
            ->withToken((string) config('services.whatsapp.meta.access_token'))
            ->post($endpoint, [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'text',
                'text' => [
                    'preview_url' => false,
                    'body' => $message,
                ],
            ]);

        if ($response->successful()) {
            return true;
        }

        Log::warning('Notification WhatsApp non envoyee: API Meta en erreur.', [
            'status' => $response->status(),
            'response' => $response->body(),
            'order_id' => $order->id,
        ]);

        return false;
    }

    private function sendViaTwilio(Order $order, string $message): bool
    {
        $sid = (string) config('services.whatsapp.twilio.account_sid');
        $token = (string) config('services.whatsapp.twilio.auth_token');
        $from = $this->formatTwilioWhatsappNumber((string) config('services.whatsapp.twilio.from_number'));
        $to = $this->formatTwilioWhatsappNumber((string) config('services.whatsapp.admin_number'));

        $endpoint = sprintf('https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json', $sid);

        $response = Http::timeout((int) config('services.whatsapp.timeout_seconds', 10))
            ->asForm()
            ->withBasicAuth($sid, $token)
            ->post($endpoint, [
                'From' => $from,
                'To' => $to,
                'Body' => $message,
            ]);

        if ($response->successful()) {
            return true;
        }

        Log::warning('Notification WhatsApp non envoyee: API Twilio en erreur.', [
            'status' => $response->status(),
            'response' => $response->body(),
            'order_id' => $order->id,
        ]);

        return false;
    }

    private function formatTwilioWhatsappNumber(string $phone): string
    {
        $normalized = $this->normalizePhone($phone);

        return 'whatsapp:+' . $normalized;
    }

    private function isEnabled(): bool
    {
        return filter_var(config('services.whatsapp.enabled', false), FILTER_VALIDATE_BOOL);
    }

    private function missingConfigurationKeys(): array
    {
        $required = [
            'services.whatsapp.admin_number' => config('services.whatsapp.admin_number'),
        ];

        if ($this->provider() === 'twilio') {
            $required['services.whatsapp.twilio.account_sid'] = config('services.whatsapp.twilio.account_sid');
            $required['services.whatsapp.twilio.auth_token'] = config('services.whatsapp.twilio.auth_token');
            $required['services.whatsapp.twilio.from_number'] = config('services.whatsapp.twilio.from_number');
        } else {
            $required['services.whatsapp.meta.phone_number_id'] = config('services.whatsapp.meta.phone_number_id');
            $required['services.whatsapp.meta.access_token'] = config('services.whatsapp.meta.access_token');
        }

        $missing = [];

        foreach ($required as $key => $value) {
            if (! is_string($value) || trim($value) === '') {
                $missing[] = $key;
            }
        }

        return $missing;
    }
}
