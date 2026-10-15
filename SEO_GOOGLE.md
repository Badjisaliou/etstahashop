# Indexation et Google Ads — etstahashop.com

## Changements préparés

- Titres, descriptions, canonical et Open Graph par route publique.
- Fiches produit : nom en H1, données Product/Offer (prix XOF et stock réels).
- Pages client, recherche et filtres de tri/pagination exclus de l'index via noindex,follow. Le catalogue principal et les catégories valides sans autres paramètres restent indexables, avec canonical propre à chaque catégorie et titre spécifique.
- robots.txt autorise les robots ; les pages noindex restent explorables pour que Google lise cette directive.
- sitemap.xml généré à chaque build, incluant les catégories et tous les produits actifs obtenus par pagination de l'API publique. Utiliser les URL avec le slug réel fourni par l'API, pas le nom saisi manuellement.
- Les erreurs de chargement produit n'affichent plus les données du produit précédent.
- Page introuvable visible pour les routes inconnues, avec noindex.

## Configuration et publication

Configurer VITE_SITE_URL=https://etstahashop.com et VITE_API_URL avec l'API publique de production dans l'hébergement storefront. Ne pas fournir une API locale au build de production. La génération échoue si l'API configurée est inaccessible afin de ne pas publier un sitemap produits incomplet. Reconstruire et redéployer après les changements du catalogue pour actualiser le sitemap.

Après déploiement : vérifier /robots.txt et /sitemap.xml (HTTP 200 et bons types texte/XML), ainsi que des fiches produit avec liens directs et sur mobile. Vérifier que www redirige vers le domaine canonique HTTPS choisi et qu'aucune protection d'hébergement ne bloque Googlebot ou AdsBot.

## Travail restant avant validation complète

La boutique est une SPA React : le HTML initial contient peu de contenu. Google peut exécuter JavaScript, mais il faut contrôler le HTML rendu dans Search Console. Ajouter un rendu serveur ou un prérendu des pages publiques reste une amélioration importante, particulièrement pour les produits et les robots publicitaires. Les routes inconnues et les produits inexistants doivent à terme retourner un vrai HTTP 404 côté serveur ; noindex côté client ne corrige pas le statut HTTP 200 du fallback Vercel.

Compléter avec les informations réelles du commerçant : identité et adresse, zones/délais/frais de livraison, politique de retour/remboursement, conditions de vente et confidentialité. Les rendre accessibles dans le pied de page. Vérifier la cohérence de ces informations avec le paiement externe Wave/Orange Money et sa confirmation manuelle. Ne pas annoncer une livraison gratuite ou un délai sans confirmation commerciale.

## Google Search Console

1. Ajouter une propriété Domaine et vérifier la propriété par enregistrement DNS TXT.
2. Soumettre https://etstahashop.com/sitemap.xml.
3. Inspecter l'accueil, le catalogue et plusieurs produits ; tester l'URL publiée et consulter le rendu.
4. Demander l'indexation des pages principales et surveiller les rapports Pages et résultats enrichis.

Un sitemap facilite la découverte ; il ne garantit ni indexation ni classement.

## Google Ads

L'indexation organique et l'acceptation des annonces sont deux processus distincts. Un compte Ads doit être configuré avec le domaine final, la zone ciblée, les annonces et un budget approuvé par le propriétaire. Aucune campagne ni dépense n'a été créée dans cette intervention.

Avant lancement : vérifier les pages de destination accessibles à AdsBot, la navigation mobile, le catalogue, le panier et la commande. Préparer les informations commerciales ci-dessus. Définir ensuite les conversions et la gestion du consentement avant d'ajouter des balises publicitaires. Avec un paiement confirmé manuellement, une commande créée ne doit pas être comptée automatiquement comme achat payé. Les annonces Shopping nécessitent également un travail Merchant Center et un flux produits ; le sitemap SEO ne remplace pas ce flux.

Références :
- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://support.google.com/adspolicy/answer/6368661

## Vérification locale

Compilation de production réussie avec génération effective de robots.txt et sitemap.xml. La validation du rendu Google et de l'état réellement publié reste à faire après déploiement.
