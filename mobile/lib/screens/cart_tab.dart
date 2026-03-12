import 'package:etstahashop_mobile/models/cart.dart';
import 'package:flutter/material.dart';

class CartTab extends StatelessWidget {
  const CartTab({
    super.key,
    required this.cart,
    required this.loading,
    required this.onUpdateItem,
    required this.onRemoveItem,
    required this.onCheckout,
  });

  final CartModel? cart;
  final bool loading;
  final Future<void> Function(CartItemModel item, int quantity) onUpdateItem;
  final Future<void> Function(CartItemModel item) onRemoveItem;
  final VoidCallback onCheckout;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final currentCart = cart;

    if (currentCart == null || currentCart.isEmpty) {
      return const Center(child: Padding(padding: EdgeInsets.all(24), child: Text('Le panier mobile est vide pour le moment.')));
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        ...currentCart.items.map(
          (item) => Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.productName, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text('${item.lineTotal.toStringAsFixed(0)} XOF'),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      IconButton(
                        onPressed: item.quantity <= 1 ? null : () => onUpdateItem(item, item.quantity - 1),
                        icon: const Icon(Icons.remove_circle_outline),
                      ),
                      Text('${item.quantity}'),
                      IconButton(
                        onPressed: () => onUpdateItem(item, item.quantity + 1),
                        icon: const Icon(Icons.add_circle_outline),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () => onRemoveItem(item),
                        child: const Text('Retirer'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Sous-total: ${currentCart.subtotalAmount.toStringAsFixed(0)} XOF', style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: onCheckout,
                  child: const Text('Passer au checkout'),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
