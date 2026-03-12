# Mobile App

Application mobile Flutter pour ETS Taha Shop.

## Etat actuel

Le projet Flutter est maintenant structure pour reutiliser l'API Laravel deja en place.

Le socle mobile couvre deja :
- accueil mobile connecte au catalogue
- liste des produits
- detail produit
- panier mobile avec session locale
- checkout Wave / Orange Money
- suivi de commande par numero + email

## Configuration API

Par defaut, l'application vise :

```text
http://10.0.2.2:8000/api
```

`10.0.2.2` est adapte a l'emulateur Android quand Laravel tourne en local sur la machine hote.

Pour changer l'URL API au lancement :

```bash
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:8000/api
```

## Demarrage

```bash
flutter pub get
flutter run
```

## Validation

```bash
flutter test
```

## Structure utile

```text
mobile/
|- lib/
|  |- app.dart
|  |- main.dart
|  |- core/
|  |- models/
|  |- services/
|  |- screens/
|  |- widgets/
|- test/
|  |- widget_test.dart
```

## Suite recommandee

- brancher une vraie persistance locale de session panier
- ajouter authentification client si necessaire
- preparer les builds Android / iOS
