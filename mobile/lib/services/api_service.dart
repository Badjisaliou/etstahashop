import 'dart:convert';

import 'package:etstahashop_mobile/core/app_config.dart';
import 'package:etstahashop_mobile/models/cart.dart';
import 'package:etstahashop_mobile/models/category.dart';
import 'package:etstahashop_mobile/models/payment_option.dart';
import 'package:etstahashop_mobile/models/product.dart';
import 'package:etstahashop_mobile/models/track_order.dart';
import 'package:etstahashop_mobile/services/api_exception.dart';
import 'package:http/http.dart' as http;

class CheckoutPayload {
  const CheckoutPayload({
    required this.fullName,
    required this.email,
    required this.phone,
    required this.addressLine1,
    required this.addressLine2,
    required this.city,
    required this.state,
    required this.postalCode,
    required this.country,
    required this.paymentMethod,
    required this.paymentReference,
    required this.notes,
  });

  final String fullName;
  final String email;
  final String phone;
  final String addressLine1;
  final String addressLine2;
  final String city;
  final String state;
  final String postalCode;
  final String country;
  final String paymentMethod;
  final String paymentReference;
  final String notes;
}

class ApiService {
  ApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<List<Category>> fetchCategories() async {
    final payload = await _getJson('/categories');
    final items = payload['data'] as List<dynamic>? ?? const [];
    return items.map((item) => Category.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<List<Product>> fetchProducts({String? categorySlug, bool featured = false}) async {
    final query = <String, String>{
      if (categorySlug != null && categorySlug.isNotEmpty) 'category': categorySlug,
      if (featured) 'featured': '1',
    };
    final payload = await _getJson('/products', query: query);
    final items = payload['data'] as List<dynamic>? ?? const [];
    return items.map((item) => Product.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<Product> fetchProductDetail(String slug) async {
    final payload = await _getJson('/products/$slug');
    return Product.fromJson(payload['data'] as Map<String, dynamic>);
  }

  Future<Map<String, PaymentOption>> fetchPaymentOptions() async {
    final payload = await _getJson('/payment-options');
    final data = payload['data'] as Map<String, dynamic>? ?? const {};
    return data.map((key, value) => MapEntry(key, PaymentOption.fromJson(value as Map<String, dynamic>)));
  }

  Future<CartModel?> fetchCart(String sessionId) async {
    final payload = await _getJson('/cart', query: {'session_id': sessionId});
    final data = payload['data'];
    if (data == null) {
      return null;
    }
    return CartModel.fromJson(data as Map<String, dynamic>);
  }

  Future<CartModel?> addToCart(String sessionId, int productId, int quantity) async {
    final payload = await _sendJson(
      'POST',
      '/cart/items',
      body: {
        'session_id': sessionId,
        'product_id': productId,
        'quantity': quantity,
      },
    );
    final data = payload['data'];
    if (data == null) {
      return null;
    }
    return CartModel.fromJson(data as Map<String, dynamic>);
  }

  Future<CartModel?> updateCartItem(String sessionId, int cartItemId, int quantity) async {
    final payload = await _sendJson(
      'PATCH',
      '/cart/items/$cartItemId',
      body: {
        'session_id': sessionId,
        'quantity': quantity,
      },
    );
    final data = payload['data'];
    if (data == null) {
      return null;
    }
    return CartModel.fromJson(data as Map<String, dynamic>);
  }

  Future<CartModel?> removeCartItem(String sessionId, int cartItemId) async {
    final payload = await _sendJson(
      'DELETE',
      '/cart/items/$cartItemId',
      body: {
        'session_id': sessionId,
      },
    );
    final data = payload['data'];
    if (data == null) {
      return null;
    }
    return CartModel.fromJson(data as Map<String, dynamic>);
  }

  Future<void> clearCart(String sessionId) async {
    await _sendJson(
      'DELETE',
      '/cart',
      body: {
        'session_id': sessionId,
      },
    );
  }

  Future<TrackOrderModel> checkout(String sessionId, CartModel cart, CheckoutPayload form) async {
    final payload = await _sendJson(
      'POST',
      '/orders',
      body: {
        'payment_method': form.paymentMethod,
        'payment_reference': form.paymentReference.isEmpty ? null : form.paymentReference,
        'notes': form.notes.isEmpty ? 'Commande mobile session $sessionId' : form.notes,
        'address': {
          'full_name': form.fullName,
          'email': form.email,
          'phone': form.phone.isEmpty ? null : form.phone,
          'address_line_1': form.addressLine1,
          'address_line_2': form.addressLine2.isEmpty ? null : form.addressLine2,
          'city': form.city,
          'state': form.state.isEmpty ? null : form.state,
          'postal_code': form.postalCode.isEmpty ? null : form.postalCode,
          'country': form.country,
        },
        'items': cart.items
            .map((item) => {
                  'product_id': item.productId,
                  'quantity': item.quantity,
                })
            .toList(),
      },
    );
    return TrackOrderModel.fromJson(payload['data'] as Map<String, dynamic>);
  }

  Future<TrackOrderModel> trackOrder(String orderNumber, String email) async {
    final payload = await _sendJson(
      'POST',
      '/orders/track',
      body: {
        'order_number': orderNumber,
        'email': email,
      },
    );
    return TrackOrderModel.fromJson(payload['data'] as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> _getJson(String path, {Map<String, String>? query}) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path').replace(queryParameters: query);
    final response = await _client.get(uri, headers: _headers);
    return _decodeResponse(response);
  }

  Future<Map<String, dynamic>> _sendJson(String method, String path, {required Map<String, dynamic> body}) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}$path');
    late http.Response response;

    switch (method) {
      case 'POST':
        response = await _client.post(uri, headers: _headers, body: jsonEncode(body));
        break;
      case 'PATCH':
        response = await _client.patch(uri, headers: _headers, body: jsonEncode(body));
        break;
      case 'DELETE':
        response = await _client.delete(uri, headers: _headers, body: jsonEncode(body));
        break;
      default:
        throw const ApiException('Methode HTTP non supportee.');
    }

    return _decodeResponse(response);
  }

  Map<String, String> get _headers => const {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

  Map<String, dynamic> _decodeResponse(http.Response response) {
    final payload = response.body.isEmpty ? <String, dynamic>{} : jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final errors = payload['errors'];
      final message = payload['message']?.toString() ??
          (errors is Map<String, dynamic>
              ? errors.values.expand((value) => (value as List<dynamic>)).join(' ')
              : 'Une erreur reseau est survenue.');
      throw ApiException(message);
    }

    return payload;
  }
}
