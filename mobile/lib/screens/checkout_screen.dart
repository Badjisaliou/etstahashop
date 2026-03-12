import 'package:etstahashop_mobile/models/cart.dart';
import 'package:etstahashop_mobile/models/payment_option.dart';
import 'package:etstahashop_mobile/models/track_order.dart';
import 'package:etstahashop_mobile/services/api_exception.dart';
import 'package:etstahashop_mobile/services/api_service.dart';
import 'package:flutter/material.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({
    super.key,
    required this.apiService,
    required this.cart,
    required this.sessionId,
    required this.paymentOptions,
  });

  final ApiService apiService;
  final CartModel cart;
  final String sessionId;
  final Map<String, PaymentOption> paymentOptions;

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _address1Controller = TextEditingController();
  final _address2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _postalController = TextEditingController();
  final _countryController = TextEditingController(text: 'SN');
  final _referenceController = TextEditingController();
  final _notesController = TextEditingController();

  String _paymentMethod = 'wave';
  bool _saving = false;
  String _error = '';

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _address1Controller.dispose();
    _address2Controller.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _postalController.dispose();
    _countryController.dispose();
    _referenceController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final payment = widget.paymentOptions[_paymentMethod];

    return Scaffold(
      appBar: AppBar(title: const Text('Checkout mobile')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_error.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_error, style: TextStyle(color: Colors.red.shade700)),
              ),
            TextFormField(controller: _fullNameController, decoration: const InputDecoration(labelText: 'Nom complet'), validator: _required),
            const SizedBox(height: 12),
            TextFormField(controller: _emailController, decoration: const InputDecoration(labelText: 'Email'), validator: _required),
            const SizedBox(height: 12),
            TextFormField(controller: _phoneController, decoration: const InputDecoration(labelText: 'Telephone')),
            const SizedBox(height: 12),
            TextFormField(controller: _address1Controller, decoration: const InputDecoration(labelText: 'Adresse'), validator: _required),
            const SizedBox(height: 12),
            TextFormField(controller: _address2Controller, decoration: const InputDecoration(labelText: 'Complement d adresse')),
            const SizedBox(height: 12),
            TextFormField(controller: _cityController, decoration: const InputDecoration(labelText: 'Ville'), validator: _required),
            const SizedBox(height: 12),
            TextFormField(controller: _stateController, decoration: const InputDecoration(labelText: 'Region / Etat')),
            const SizedBox(height: 12),
            TextFormField(controller: _postalController, decoration: const InputDecoration(labelText: 'Code postal')),
            const SizedBox(height: 12),
            TextFormField(controller: _countryController, decoration: const InputDecoration(labelText: 'Pays (ISO 2)'), validator: _required),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _paymentMethod,
              items: const [
                DropdownMenuItem(value: 'wave', child: Text('Wave')),
                DropdownMenuItem(value: 'orange_money', child: Text('Orange Money')),
              ],
              onChanged: (value) => setState(() => _paymentMethod = value ?? 'wave'),
              decoration: const InputDecoration(labelText: 'Methode de paiement'),
            ),
            const SizedBox(height: 12),
            if (payment != null)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(payment.label, style: Theme.of(context).textTheme.titleMedium),
                      if (payment.accountName.isNotEmpty) Text('Beneficiaire: ${payment.accountName}'),
                      if (payment.accountNumber.isNotEmpty) Text('Numero: ${payment.accountNumber}'),
                      if (payment.instructions.isNotEmpty) Text(payment.instructions),
                    ],
                  ),
                ),
              ),
            const SizedBox(height: 12),
            TextFormField(controller: _referenceController, decoration: const InputDecoration(labelText: 'Reference de transfert')),
            const SizedBox(height: 12),
            TextFormField(controller: _notesController, decoration: const InputDecoration(labelText: 'Notes'), maxLines: 3),
            const SizedBox(height: 20),
            Text('Total a transferer: ${widget.cart.subtotalAmount.toStringAsFixed(0)} XOF', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _saving ? null : _submit,
              child: Text(_saving ? 'Validation...' : 'Creer la commande'),
            ),
          ],
        ),
      ),
    );
  }

  String? _required(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Champ requis';
    }
    return null;
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _saving = true;
      _error = '';
    });

    try {
      final order = await widget.apiService.checkout(
        widget.sessionId,
        widget.cart,
        CheckoutPayload(
          fullName: _fullNameController.text.trim(),
          email: _emailController.text.trim(),
          phone: _phoneController.text.trim(),
          addressLine1: _address1Controller.text.trim(),
          addressLine2: _address2Controller.text.trim(),
          city: _cityController.text.trim(),
          state: _stateController.text.trim(),
          postalCode: _postalController.text.trim(),
          country: _countryController.text.trim().toUpperCase(),
          paymentMethod: _paymentMethod,
          paymentReference: _referenceController.text.trim(),
          notes: _notesController.text.trim(),
        ),
      );
      if (!mounted) {
        return;
      }
      Navigator.of(context).pop<TrackOrderModel>(order);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
        _saving = false;
      });
    }
  }
}
