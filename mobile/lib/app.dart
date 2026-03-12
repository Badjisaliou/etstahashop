import 'package:etstahashop_mobile/core/app_theme.dart';
import 'package:etstahashop_mobile/screens/shop_shell_screen.dart';
import 'package:flutter/material.dart';

class EtsTahaShopApp extends StatelessWidget {
  const EtsTahaShopApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ETS Taha Shop',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      home: const ShopShellScreen(),
    );
  }
}
