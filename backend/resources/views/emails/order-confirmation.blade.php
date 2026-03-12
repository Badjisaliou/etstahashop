<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Confirmation de commande</title>
</head>
<body style="font-family: Arial, sans-serif; color: #11203b; line-height: 1.5;">
    <h1>Commande {{ $order->order_number }}</h1>
    <p>Bonjour {{ $order->address->full_name }},</p>
    <p>Votre commande a bien ete enregistree pour un montant total de <strong>{{ $order->total_amount }} {{ $order->currency }}</strong>.</p>

    <h2>Mode de paiement</h2>
    <p>{{ $paymentOption['label'] ?? $order->payment_method }}</p>
    @if (!empty($paymentOption['account_name']))
        <p>Beneficiaire : {{ $paymentOption['account_name'] }}</p>
    @endif
    @if (!empty($paymentOption['account_number']))
        <p>Numero : {{ $paymentOption['account_number'] }}</p>
    @endif
    @if (!empty($paymentOption['instructions']))
        <p>{{ $paymentOption['instructions'] }}</p>
    @endif
    @if ($order->payment_reference)
        <p>Reference transmise : {{ $order->payment_reference }}</p>
    @endif

    <h2>Recapitulatif</h2>
    <ul>
        @foreach ($order->items as $item)
            <li>{{ $item->product_name }} x {{ $item->quantity }} - {{ $item->line_total }} {{ $order->currency }}</li>
        @endforeach
    </ul>

    <p>Le paiement sera valide manuellement des reception du transfert.</p>
    <p>Merci pour votre confiance.</p>
</body>
</html>
