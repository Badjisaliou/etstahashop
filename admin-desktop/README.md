# Admin Desktop (Phase 1)

Ce dossier contient le socle desktop de l'application `admin` avec Electron, en mode **zero impact production**.

Version actuelle: `0.1.1`

## Objectif

- Reutiliser le back-office React existant (`../admin`)
- Garder le deploy web actuel (Vercel + Railway) intact
- Preparer un executable bureau Windows

## Prerequis

- Node.js 20+
- Le backend API deja accessible (local ou Railway)

## Installation

```powershell
cd admin-desktop
npm install
```

## Lancement developpement

```powershell
npm run dev
```

Ce script lance:

- `admin` web en Vite sur `http://127.0.0.1:5174`
- la fenetre Electron qui charge cette URL

## Build desktop

```powershell
npm run build
```

Ce flux:

1. build l'application web `admin`
2. copie `../admin/dist` vers `admin-desktop/web-dist`
3. genere un installateur desktop dans `admin-desktop/release`

## Notes securite

- `nodeIntegration` desactive
- `contextIsolation` active
- API consommee par l'app React existante (via les variables Vite)

## Logs et diagnostic

- Les logs Electron sont ecrits via `electron-log`.
- Chemin Windows:
  - `%APPDATA%\ETS Taha Admin\logs\main.log`
- Les erreurs runtime importantes (chargement renderer, crash process, auto-update) y sont enregistrees.

## Auto-update

- Le check se lance au demarrage en mode package.
- Provider `generic` configure dans `package.json`.
- URL par defaut:
  - `https://downloads.etstahashop.com/admin-desktop/`
- Option de surcharge:
  - variable d'environnement `ETS_DESKTOP_UPDATE_URL`

## Branding

- Icône appliquee a l'application et a l'installateur:
  - `admin-desktop/build/icons/icon.ico`

## Signature Windows

- Guide dedie: `admin-desktop/SIGNING.md`
- Guide release et auto-update: `admin-desktop/RELEASE.md`
- Notes de version: `admin-desktop/CHANGELOG.md`
