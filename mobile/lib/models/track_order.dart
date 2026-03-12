class TrackOrderItem {
  const TrackOrderItem({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.lineTotal,
  });

  final int id;
  final String productName;
  final int quantity;
  final double lineTotal;

  factory TrackOrderItem.fromJson(Map<String, dynamic> json) {
    return TrackOrderItem(
      id: json['id'] as int,
      productName: json['product_name'] as String? ?? '',
      quantity: json['quantity'] as int? ?? 0,
      lineTotal: double.tryParse(json['line_total'].toString()) ?? 0,
    );
  }
}

class TrackOrderModel {
  const TrackOrderModel({
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.paymentReference,
    required this.paymentValidatedAt,
    required this.totalAmount,
    required this.currency,
    required this.customerName,
    required this.customerEmail,
    required this.items,
  });

  final String orderNumber;
  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final String paymentReference;
  final String paymentValidatedAt;
  final double totalAmount;
  final String currency;
  final String customerName;
  final String customerEmail;
  final List<TrackOrderItem> items;

  factory TrackOrderModel.fromJson(Map<String, dynamic> json) {
    final address = json['address'] as Map<String, dynamic>? ?? const {};
    final itemsJson = json['items'] as List<dynamic>? ?? const [];

    return TrackOrderModel(
      orderNumber: json['order_number'] as String? ?? '',
      status: json['status'] as String? ?? '',
      paymentStatus: json['payment_status'] as String? ?? '',
      paymentMethod: json['payment_method'] as String? ?? '',
      paymentReference: json['payment_reference'] as String? ?? '',
      paymentValidatedAt: json['payment_validated_at'] as String? ?? '',
      totalAmount: double.tryParse(json['total_amount'].toString()) ?? 0,
      currency: json['currency'] as String? ?? 'XOF',
      customerName: address['full_name'] as String? ?? '',
      customerEmail: address['email'] as String? ?? '',
      items: itemsJson.map((item) => TrackOrderItem.fromJson(item as Map<String, dynamic>)).toList(),
    );
  }
}
