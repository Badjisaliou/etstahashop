import 'package:etstahashop_mobile/app.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('app renders mobile shell title', (tester) async {
    await tester.pumpWidget(const EtsTahaShopApp());

    expect(find.text('ETS Taha Shop Mobile'), findsOneWidget);
    expect(find.text('Accueil'), findsOneWidget);
    expect(find.text('Catalogue'), findsOneWidget);
  });
}
