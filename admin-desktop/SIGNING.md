# Signature Windows (Release)

Cette etape permet d'avoir un installateur desktop de confiance (moins d'alertes SmartScreen).

## Prerequis

- certificat code-signing (`.pfx`)
- mot de passe du certificat

## Variables d'environnement

Dans PowerShell:

```powershell
$env:CSC_LINK="C:\chemin\vers\votre-certificat.pfx"
$env:CSC_KEY_PASSWORD="mot_de_passe_du_certificat"
```

Optionnel (horodatage):

```powershell
$env:WIN_CSC_LINK=$env:CSC_LINK
$env:WIN_CSC_KEY_PASSWORD=$env:CSC_KEY_PASSWORD
```

## Build signe

```powershell
cd admin-desktop
npm run build
```

## Resultat

- installateur: `admin-desktop/release/ETS Taha Admin Setup 0.1.0.exe`
- executable: `admin-desktop/release/win-unpacked/ETS Taha Admin.exe`

Si les variables de certificat ne sont pas definies, le build peut fonctionner mais sans signature de confiance metier.
