import 'dart:math';

import 'package:etstahashop_mobile/models/cart.dart';
import 'package:etstahashop_mobile/models/payment_option.dart';
import 'package:etstahashop_mobile/models/product.dart';
import 'package:etstahashop_mobile/models/track_order.dart';
import 'package:etstahashop_mobile/screens/cart_tab.dart';
import 'package:etstahashop_mobile/screens/catalog_tab.dart';
import 'package:etstahashop_mobile/screens/checkout_screen.dart';
import 'package:etstahashop_mobile/screens/home_tab.dart';
import 'package:etstahashop_mobile/screens/product_detail_screen.dart';
import 'package:etstahashop_mobile/screens/track_order_tab.dart';
import 'package:etstahashop_mobile/services/api_exception.dart';
import 'package:etstahashop_mobile/services/api_service.dart';
import 'package:flutter/material.dart';

class ShopShellScreen extends StatefulWidget {
  const ShopShellScreen({super.key});

  @override
  State<ShopShellScreen> createState() => _ShopShellScreenState();
}

class _ShopShellScreenState extends State<ShopShellScreen> {
  late final ApiService _apiService;
  late final String _sessionId;
  int _currentIndex = 0;
  CartModel? _cart;
  Map<String, PaymentOption> _paymentOptions = const {};
  bool _cartLoading = true;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    _sessionId = 'mobile-${DateTime.now().millisecondsSinceEpoch}-${Random().nextInt(9999)}';
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    await Future.wait([
      _refreshCart(),
      _loadPaymentOptions(),
    ]);
  }

  Future<void> _loadPaymentOptions() async {
    try {
      final options = await _apiService.fetchPaymentOptions();
      if (!mounted) {
        return;
      }
      setState(() {
        _paymentOptions = options;
      });
    } catch (_) {
      // Keep UI usable with empty payment options.
    }
  }

  Future<void> _refreshCart() async {
    try {
      final cart = await _apiService.fetchCart(_sessionId);
      if (!mounted) {
        return;
      }
      setState(() {
        _cart = cart;
        _cartLoading = false;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _cartLoading = false;
      });
    }
  }

  Future<void> _addToCart(Product product, {int quantity = 1}) async {
    final cart = await _apiService.addToCart(_sessionId, product.id, quantity);
    if (!mounted) {
      return;
    }
    setState(() {
      _cart = cart;
    });
    _showMessage('${product.name} ajoute au panier.');
  }

  Future<void> _updateCartItem(CartItemModel item, int quantity) async {
    final cart = await _apiService.updateCartItem(_sessionId, item.id, quantity);
    if (!mounted) {
      return;
    }
    setState(() {
      _cart = cart;
    });
  }

  Future<void> _removeCartItem(CartItemModel item) async {
    final cart = await _apiService.removeCartItem(_sessionId, item.id);
    if (!mounted) {
      return;
    }
    setState(() {
      _cart = cart;
    });
  }

  Future<void> _clearCart() async {
    await _apiService.clearCart(_sessionId);
    if (!mounted) {
      return;
    }
    setState(() {
      _cart = null;
    });
  }

  Future<void> _openProduct(BuildContext context, Product product) async {
    try {
      final details = await _apiService.fetchProductDetail(product.slug);
      if (!context.mounted) {
        return;
      }
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => ProductDetailScreen(
            product: details,
            onAddToCart: (quantity) => _addToCart(details, quantity: quantity),
          ),
        ),
      );
    } on ApiException catch (error) {
      _showMessage(error.message, isError: true);
    }
  }

  Future<void> _openCheckout(BuildContext context) async {
    final cart = _cart;
    if (cart == null || cart.isEmpty) {
      _showMessage('Le panier est vide.', isError: true);
      return;
    }

    final result = await Navigator.of(context).push<TrackOrderModel>(
      MaterialPageRoute<TrackOrderModel>(
        builder: (_) => CheckoutScreen(
          apiService: _apiService,
          cart: cart,
          sessionId: _sessionId,
          paymentOptions: _paymentOptions,
        ),
      ),
    );

    if (!mounted || result == null) {
      return;
    }

    await _clearCart();
    setState(() {
      _currentIndex = 3;
    });
    _showMessage('Commande ${result.orderNumber} creee avec succes.');
  }

  void _showMessage(String message, {bool isError = false}) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red.shade700 : const Color(0xFF11203B),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      HomeTab(
        apiService: _apiService,
        onOpenCatalog: () => setState(() => _currentIndex = 1),
        onOpenProduct: (product) => _openProduct(context, product),
      ),
      CatalogTab(
        apiService: _apiService,
        onOpenProduct: (product) => _openProduct(context, product),
        onAddToCart: _addToCart,
      ),
      CartTab(
        cart: _cart,
        loading: _cartLoading,
        onUpdateItem: _updateCartItem,
        onRemoveItem: _removeCartItem,
        onCheckout: () => _openCheckout(context),
      ),
      TrackOrderTab(
        apiService: _apiService,
        paymentOptions: _paymentOptions,
      ),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('ETS Taha Shop Mobile'),
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: pages,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        destinations: [
          const NavigationDestination(icon: Icon(Icons.storefront_outlined), selectedIcon: Icon(Icons.storefront), label: 'Accueil'),
          const NavigationDestination(icon: Icon(Icons.grid_view_outlined), selectedIcon: Icon(Icons.grid_view), label: 'Catalogue'),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: (_cart?.itemsCount ?? 0) > 0,
              label: Text('${_cart?.itemsCount ?? 0}'),
              child: const Icon(Icons.shopping_bag_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: (_cart?.itemsCount ?? 0) > 0,
              label: Text('${_cart?.itemsCount ?? 0}'),
              child: const Icon(Icons.shopping_bag),
            ),
            label: 'Panier',
          ),
          const NavigationDestination(icon: Icon(Icons.receipt_long_outlined), selectedIcon: Icon(Icons.receipt_long), label: 'Suivi'),
        ],
      ),
    );
  }
}
