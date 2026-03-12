import 'package:etstahashop_mobile/models/payment_option.dart';
import 'package:etstahashop_mobile/models/track_order.dart';
import 'package:etstahashop_mobile/services/api_exception.dart';
import 'package:etstahashop_mobile/services/api_service.dart';
import 'package:flutter/material.dart';

class TrackOrderTab extends StatefulWidget {
  const TrackOrderTab({
    super.key,
    required this.apiService,
    required this.paymentOptions,
  });

  final ApiService apiService;
  final Map<String, PaymentOption> paymentOptions;

  @override
  State<TrackOrderTab> createState() => _TrackOrderTabState();
}

class _TrackOrderTabState extends State<TrackOrderTab> {
  final _orderController = TextEditingController();
  final _emailController = TextEditingController();
  TrackOrderModel? _order;
  bool _loading = false;
  String _message = '';

  @override
  void dispose() {
    _orderController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final order = _order;
    final payment = order == null ? null : widget.paymentOptions[order.paymentMethod];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: _orderController,
          decoration: const InputDecoration(labelText: 'Numero de commande'),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _emailController,
          decoration: const InputDecoration(labelText: 'Email'),
        ),
        const SizedBox(height: 12),
        FilledButton(
          onPressed: _loading ? null : _track,
          child: Text(_loading ? 'Recherche...' : 'Suivre la commande'),
        ),
        if (_message.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(_message, style: TextStyle(color: _order == null ? Colors.red.shade700 : Colors.green.shade700)),
        ],
        if (order != null) ...[
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(order.orderNumber, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text('Client: ${order.customerName}'),
                  Text('Statut commande: ${order.status}'),
                  Text('Statut paiement: ${order.paymentStatus}'),
                  Text('Total: ${order.totalAmount.toStringAsFixed(0)} ${order.currency}'),
                  if (payment != null) ...[
                    const SizedBox(height: 12),
                    Text('Paiement ${payment.label}', style: Theme.of(context).textTheme.titleMedium),
                    if (payment.accountNumber.isNotEmpty) Text('Numero: ${payment.accountNumber}'),
                    if (payment.instructions.isNotEmpty) Text(payment.instructions),
                  ],
                  if (order.paymentReference.isNotEmpty) Text('Reference: ${order.paymentReference}'),
                  if (order.paymentValidatedAt.isNotEmpty) Text('Paiement valide le: ${order.paymentValidatedAt}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          ...order.items.map(
            (item) => Card(
              child: ListTile(
                title: Text(item.productName),
                subtitle: Text('Quantite ${item.quantity}'),
                trailing: Text('${item.lineTotal.toStringAsFixed(0)} ${order.currency}'),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Future<void> _track() async {
    setState(() {
      _loading = true;
      _message = '';
    });

    try {
      final order = await widget.apiService.trackOrder(
        _orderController.text.trim(),
        _emailController.text.trim(),
      );
      if (!mounted) {
        return;
      }
      setState(() {
        _order = order;
        _loading = false;
        _message = 'Commande retrouvee avec succes.';
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _order = null;
        _loading = false;
        _message = error.message;
      });
    }
  }
}
