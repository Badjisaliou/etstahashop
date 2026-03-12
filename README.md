# ETS Taha Shop

Ce depot est organise comme un mono-repo pour l'application e-commerce ETS Taha Shop.

## Structure

```text
etstahashop/
|- backend/      # API Laravel + logique metier e-commerce
|- storefront/   # Boutique web React pour les clients
|- admin/        # Back-office React pour l'administration
|- mobile/       # Application mobile Flutter
|- scripts/      # Scripts locaux de demarrage, verification et arret
```

## Separation frontend

Le frontend web est maintenant separe en deux applications distinctes :

- `storefront/` pour la boutique publique et l'espace client
- `admin/` pour le back-office administrateur

## API separee

Le backend Laravel expose deux espaces d'API distincts :

- `http://127.0.0.1:8000/api/storefront`
- `http://127.0.0.1:8000/api/admin`

## URLs locales stables

- Boutique web : `http://127.0.0.1:5173`
- Back-office admin : `http://127.0.0.1:5174`
- Backend Laravel : `http://127.0.0.1:8000`
- Health API : `http://127.0.0.1:8000/api/health`

## Demarrage local rapide

Depuis la racine du projet :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
```

Verifier les services :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-local.ps1
```

Verifier les parcours critiques :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-critical.ps1
```

Arreter les services :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-dev.ps1
```

## Configuration locale detaillee

### Backend

Dans `backend/` :

```bash
php artisan migrate
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

### Storefront

Dans `storefront/`, copier `.env.example` vers `.env` puis utiliser :

```bash
npm install
npm run dev
```

### Admin

Dans `admin/`, copier `.env.example` vers `.env` puis utiliser :

```bash
npm install
npm run dev
```

## Regles metier actuelles

- Le panier, le catalogue, les commandes et le back-office admin sont relies.
- Les images produit sont televersees depuis l'admin React.
- Les commandes decrementent le stock au moment de la creation.
- Les statuts de commande et de paiement sont geres dans l'admin.
- Aucun frais de livraison ni taxe n'est applique dans le systeme pour le moment.
- Le paiement est externe a l'application via `Wave` ou `Orange Money`, puis valide manuellement dans le back-office.
- Un email de confirmation est envoye au client apres commande.
- Un email de notification peut etre envoye a l'administrateur pour chaque nouvelle commande.

## Notes de stabilisation

- `storefront` utilise le port `5173` en dev.
- `admin` utilise le port `5174` en dev.
- `APP_URL` du backend doit pointer vers `http://127.0.0.1:8000` pour des URLs d'images correctes.
- L'application mobile est alignee sur `api/storefront`.
- Le smoke test critique suppose la presence du compte admin seed `admin@etstaha.shop` / `admin12345`.
