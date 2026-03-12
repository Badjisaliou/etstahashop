class ProductImage {
  const ProductImage({
    required this.path,
    required this.url,
    required this.altText,
  });

  final String path;
  final String url;
  final String altText;

  factory ProductImage.fromJson(Map<String, dynamic> json) {
    return ProductImage(
      path: json['path'] as String? ?? '',
      url: json['url'] as String? ?? '',
      altText: json['alt_text'] as String? ?? '',
    );
  }
}

class Product {
  const Product({
    required this.id,
    required this.categoryId,
    required this.name,
    required this.slug,
    required this.sku,
    required this.shortDescription,
    required this.description,
    required this.price,
    required this.stockQuantity,
    required this.isFeatured,
    required this.images,
    required this.categoryName,
  });

  final int id;
  final int? categoryId;
  final String name;
  final String slug;
  final String sku;
  final String shortDescription;
  final String description;
  final double price;
  final int stockQuantity;
  final bool isFeatured;
  final List<ProductImage> images;
  final String categoryName;

  String get primaryImageUrl => images.isNotEmpty ? images.first.url : '';

  factory Product.fromJson(Map<String, dynamic> json) {
    final imagesJson = json['images'] as List<dynamic>? ?? const [];
    final categoryJson = json['category'] as Map<String, dynamic>? ?? const {};

    return Product(
      id: json['id'] as int,
      categoryId: json['category_id'] as int?,
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      sku: json['sku'] as String? ?? '',
      shortDescription: json['short_description'] as String? ?? '',
      description: json['description'] as String? ?? '',
      price: double.tryParse(json['price'].toString()) ?? 0,
      stockQuantity: json['stock_quantity'] as int? ?? 0,
      isFeatured: json['is_featured'] as bool? ?? false,
      images: imagesJson.map((item) => ProductImage.fromJson(item as Map<String, dynamic>)).toList(),
      categoryName: categoryJson['name'] as String? ?? '',
    );
  }
}
