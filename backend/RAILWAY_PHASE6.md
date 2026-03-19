# Railway + Vercel (Phase 6)

Ce guide finalise Redis + Cloudinary en production.

## 1) Service backend web (Railway)

Build command:

```bash
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
```

Start command:

```bash
php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan serve --host=0.0.0.0 --port=$PORT
```

## 2) Service worker queue (Railway)

Creez un 2e service Railway depuis le meme repo backend.

Build command:

```bash
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist
```

Start command:

```bash
php artisan config:cache && php artisan queue:work redis --sleep=1 --tries=3 --timeout=120
```

## 3) Variables d'environnement backend (Railway)

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://<votre-backend>.up.railway.app

LOG_CHANNEL=stack
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=...
DB_PORT=3306
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...

CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

REDIS_CLIENT=predis
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...
REDIS_DB=0
REDIS_CACHE_DB=1
REDIS_QUEUE=default

FILESYSTEM_DISK=local
MEDIA_DISK=cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=products/uploads
```

Notes:
- `REDIS_CLIENT=predis` evite la dependance a l'extension PHP redis.
- `MEDIA_DISK=cloudinary` active l'upload images via l'API Cloudinary.

## 4) Variables d'environnement Vercel (storefront + admin)

Storefront:

```env
VITE_API_URL=https://<votre-backend>.up.railway.app/api/storefront
VITE_ADMIN_APP_URL=https://<votre-admin>.vercel.app
VITE_BRAND_LOGO_URL=https://res.cloudinary.com/<cloud_name>/image/upload/<public_id>.png
```

Admin:

```env
VITE_API_URL=https://<votre-backend>.up.railway.app/api/admin
```

## 5) Verification post-deploiement

1. `GET /api/health` doit retourner `services.redis.status = up`
2. `GET /api/health` doit retourner `services.storage.status = up`
3. Upload image depuis admin -> image visible dans storefront
4. Creation commande -> job traite par le worker queue
