import 'package:etstahashop_mobile/models/category.dart';
import 'package:etstahashop_mobile/models/product.dart';
import 'package:etstahashop_mobile/services/api_exception.dart';
import 'package:etstahashop_mobile/services/api_service.dart';
import 'package:etstahashop_mobile/widgets/info_card.dart';
import 'package:etstahashop_mobile/widgets/product_card.dart';
import 'package:flutter/material.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({
    super.key,
    required this.apiService,
    required this.onOpenCatalog,
    required this.onOpenProduct,
  });

  final ApiService apiService;
  final VoidCallback onOpenCatalog;
  final ValueChanged<Product> onOpenProduct;

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  List<Category> _categories = const [];
  List<Product> _featured = const [];
  bool _loading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        widget.apiService.fetchCategories(),
        widget.apiService.fetchProducts(featured: true),
      ]);
      if (!mounted) {
        return;
      }
      setState(() {
        _categories = results[0] as List<Category>;
        _featured = results[1] as List<Product>;
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
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Boutique mobile connectee', style: Theme.of(context).textTheme.headlineSmall),
                  const SizedBox(height: 12),
                  const Text('Catalogue, panier, checkout Wave/Orange Money et suivi de commande reposent deja sur l API Laravel du projet.'),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: widget.onOpenCatalog,
                    child: const Text('Ouvrir le catalogue'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text('Categories', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          ..._categories.map((category) => InfoCard(
                title: category.name,
                subtitle: '${category.productsCount} produits disponibles',
              )),
          const SizedBox(height: 16),
          Text('Produits en vedette', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          SizedBox(
            height: 320,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemBuilder: (context, index) {
                final product = _featured[index];
                return SizedBox(
                  width: 240,
                  child: ProductCard(
                    product: product,
                    onTap: () => widget.onOpenProduct(product),
                  ),
                );
              },
              separatorBuilder: (_, _) => const SizedBox(width: 12),
              itemCount: _featured.length,
            ),
          ),
        ],
      ),
    );
  }
}
