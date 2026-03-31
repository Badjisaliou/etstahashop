# Release + Auto-update

## Principe

- L'application desktop verifie les mises a jour au demarrage.
- Le flux utilise `electron-updater` avec un provider `generic`.
- URL de mise a jour par defaut:
  - `https://downloads.etstahashop.com/admin-desktop/`
- Surcharge possible au runtime:
  - variable Windows `ETS_DESKTOP_UPDATE_URL`

## Fichiers attendus sur le serveur d'updates

- `latest.yml`
- `ETS Taha Admin Setup <version>.exe`
- `ETS Taha Admin Setup <version>.exe.blockmap`

Ces fichiers sont generes dans `admin-desktop/release/`.

## Procedure manuelle locale

1. Incrementer la version dans `admin-desktop/package.json`.
2. Lancer:
```powershell
cd admin-desktop
npm run release:win
```
3. Publier le contenu de `admin-desktop/release/` vers votre serveur `admin-desktop/`.

Exemple courant:

- version package: `0.1.1`
- artefact: `ETS Taha Admin Setup 0.1.1.exe`

## Procedure CI (GitHub Actions)

- Workflow: `.github/workflows/admin-desktop-release.yml`
- Lancement manuel avec:
  - `publish=false` pour juste builder
  - `publish=true` pour build + publication electron-builder

Secrets recommandes:

- `CSC_LINK`
- `CSC_KEY_PASSWORD`
- `GITHUB_TOKEN` (natif Actions)
