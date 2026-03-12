import 'package:etstahashop_mobile/models/product.dart';
import 'package:flutter/material.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({
    super.key,
    required this.product,
    required this.onAddToCart,
  });

  final Product product;
  final Future<void> Function(int quantity) onAddToCart;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _quantity = 1;
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    final product = widget.product;

    return Scaffold(
      appBar: AppBar(title: Text(product.name)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          AspectRatio(
            aspectRatio: 1.1,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: product.primaryImageUrl.isEmpty
                  ? Container(color: const Color(0xFFF3EBDD), alignment: Alignment.center, child: const Icon(Icons.image_not_supported_outlined, size: 42))
                  : Image.network(product.primaryImageUrl, fit: BoxFit.cover),
            ),
          ),
          const SizedBox(height: 16),
          Text(product.categoryName, style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          Text(product.name, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text('${product.price.toStringAsFixed(0)} XOF', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Text(product.shortDescription.isEmpty ? product.description : product.shortDescription),
          if (product.description.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(product.description),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  initialValue: '1',
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Quantite'),
                  onChanged: (value) => _quantity = int.tryParse(value) ?? 1,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _saving
                      ? null
                      : () async {
                          setState(() => _saving = true);
                          try {
                            await widget.onAddToCart(_quantity < 1 ? 1 : _quantity);
                            if (!mounted) {
                              return;
                            }
                            Navigator.of(context).pop();
                          } finally {
                            if (mounted) {
                              setState(() => _saving = false);
                            }
                          }
                        },
                  child: Text(_saving ? 'Ajout...' : 'Ajouter'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
