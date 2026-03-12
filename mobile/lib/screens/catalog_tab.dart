import 'package:etstahashop_mobile/models/product.dart';
import 'package:etstahashop_mobile/services/api_exception.dart';
import 'package:etstahashop_mobile/services/api_service.dart';
import 'package:etstahashop_mobile/widgets/product_card.dart';
import 'package:flutter/material.dart';

class CatalogTab extends StatefulWidget {
  const CatalogTab({
    super.key,
    required this.apiService,
    required this.onOpenProduct,
    required this.onAddToCart,
  });

  final ApiService apiService;
  final ValueChanged<Product> onOpenProduct;
  final Future<void> Function(Product product) onAddToCart;

  @override
  State<CatalogTab> createState() => _CatalogTabState();
}

class _CatalogTabState extends State<CatalogTab> {
  List<Product> _products = const [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final products = await widget.apiService.fetchProducts();
      if (!mounted) {
        return;
      }
      setState(() {
        _products = products;
        _loading = false;
      });
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _error = error.message;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error.isNotEmpty) {
      return Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error)));
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: GridView.builder(
        padding: const EdgeInsets.all(16),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 0.7,
        ),
        itemCount: _products.length,
        itemBuilder: (context, index) {
          final product = _products[index];
          return ProductCard(
            product: product,
            onTap: () => widget.onOpenProduct(product),
            onAdd: () async {
              try {
                await widget.onAddToCart(product);
              } on ApiException catch (error) {
                if (!context.mounted) {
                  return;
                }
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.message)));
              }
            },
          );
        },
      ),
    );
  }
}
