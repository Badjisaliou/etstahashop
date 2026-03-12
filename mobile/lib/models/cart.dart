class CartItemModel {
  const CartItemModel({
    required this.id,
    required this.productId,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
    required this.productName,
    required this.productImageUrl,
  });

  final int id;
  final int productId;
  final int quantity;
  final double unitPrice;
  final double lineTotal;
  final String productName;
  final String productImageUrl;

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    final product = json['product'] as Map<String, dynamic>? ?? const {};
    final images = product['images'] as List<dynamic>? ?? const [];
    final firstImage = images.isNotEmpty ? images.first as Map<String, dynamic> : const <String, dynamic>{};

    return CartItemModel(
      id: json['id'] as int,
      productId: json['product_id'] as int,
      quantity: json['quantity'] as int? ?? 0,
      unitPrice: double.tryParse(json['unit_price'].toString()) ?? 0,
      lineTotal: double.tryParse(json['line_total'].toString()) ?? 0,
      productName: product['name'] as String? ?? 'Produit',
      productImageUrl: firstImage['url'] as String? ?? '',
    );
  }
}

class CartModel {
  const CartModel({
    required this.id,
    required this.sessionId,
    required this.itemsCount,
    required this.subtotalAmount,
    required this.items,
  });

  final int id;
  final String sessionId;
  final int itemsCount;
  final double subtotalAmount;
  final List<CartItemModel> items;

  bool get isEmpty => items.isEmpty;

  factory CartModel.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'] as List<dynamic>? ?? const [];

    return CartModel(
      id: json['id'] as int,
      sessionId: json['session_id'] as String? ?? '',
      itemsCount: json['items_count'] as int? ?? 0,
      subtotalAmount: double.tryParse(json['subtotal_amount'].toString()) ?? 0,
      items: itemsJson.map((item) => CartItemModel.fromJson(item as Map<String, dynamic>)).toList(),
    );
  }
}
