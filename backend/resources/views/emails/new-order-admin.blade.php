<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Nouvelle commande</title>
</head>
<body style="font-family: Arial, sans-serif; color: #11203b; line-height: 1.5;">
    <h1>Nouvelle commande {{ $order->order_number }}</h1>
    <p>Une nouvelle commande vient d'etre enregistree.</p>

    <h2>Client</h2>
    <p>{{ $order->address->full_name }}</p>
    <p>Email : {{ $order->address->email }}</p>
    @if ($order->address->phone)
        <p>Telephone : {{ $order->address->phone }}</p>
    @endif
    <p>Ville : {{ $order->address->city }}</p>

    <h2>Paiement</h2>
    <p>Methode : {{ $paymentOption['label'] ?? $order->payment_method }}</p>
    <p>Montant : {{ $order->total_amount }} {{ $order->currency }}</p>
    @if ($order->payment_reference)
        <p>Reference de transfert : {{ $order->payment_reference }}</p>
    @endif
    <p>Statut paiement : {{ $order->payment_status }}</p>

    <h2>Articles</h2>
    <ul>
        @foreach ($order->items as $item)
            <li>{{ $item->product_name }} x {{ $item->quantity }} - {{ $item->line_total }} {{ $order->currency }}</li>
        @endforeach
    </ul>

    <p>Pensez a verifier le transfert puis a valider le paiement dans le back-office.</p>
</body>
</html>
