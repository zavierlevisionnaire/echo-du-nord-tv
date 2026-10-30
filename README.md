# Écho du Nord TV

**L’information qui résonne au-delà des frontières.**

- Site public : https://zavierlevisionnaire.github.io/echo-du-nord-tv/
- Administration : https://zavierlevisionnaire.github.io/echo-du-nord-tv/admin/

## Administration éditoriale

Le site dispose désormais d'un tableau de bord privé connecté à Supabase.

- Connexion sécurisée par e-mail et mot de passe.
- Création, modification, publication et suppression d'articles.
- Import direct des photos de couverture depuis un téléphone ou un ordinateur.
- Gestion des publicités et des partenaires.
- Activation et désactivation du bandeau d'information urgente.
- Les articles non publiés restent privés ; seuls les articles publiés sont visibles publiquement.

L'administrateur autorisé est le compte zavierlevisionnaire@gmail.com. Il faut utiliser le mot de passe déjà défini pour ce compte Supabase. Aucun mot de passe n'est stocké dans le dépôt GitHub.

## Architecture et sécurité

Le CMS utilise le projet Supabase déjà configuré pour l'écosystème des sites, avec des tables dédiées préfixées echo_ et un bucket d'images echo-media. Les contenus Destination Gabon restent dans leurs propres tables et leur propre espace de stockage.

Les règles Row Level Security (RLS) limitent l'écriture aux administrateurs Écho du Nord TV. Les visiteurs peuvent uniquement lire les articles publiés, les publicités actives et l'alerte publique. La clé publishable présente dans le navigateur n'est pas une clé secrète ; aucune clé service_role n'est exposée.

Pages CMS reste disponible comme outil secondaire pour les anciens contenus Markdown du dépôt, mais le tableau de bord /admin/ devient l'interface recommandée pour les nouvelles publications.

## Fichiers principaux

- index.html : page d'accueil publique.
- styles.css : identité graphique et adaptation mobile.
- script.js : navigation et compatibilité avec les contenus historiques.
- echo-public.js : affichage des articles, publicités et alertes Supabase.
- admin/index.html : interface d'administration.
- admin.js : gestion des contenus et des médias.
- supabase-config.js : configuration publique du client Supabase.
- .pages.yml : configuration Pages CMS historique.
- media/ : anciens médias du site.

## Coordonnées officielles

- Rédaction : echodunordtv9@gmail.com
- WhatsApp : +241 74 61 91 27
- Facebook : https://www.facebook.com/share/1C2ddVXJ9V/

Le lien YouTube et le lecteur vidéo en direct seront activés dès que la chaîne et la source de diffusion officielles seront disponibles.

## Hébergement

Le site est hébergé avec GitHub Pages. Les fichiers du site sont publiés depuis la branche main. Les contenus créés depuis le nouveau tableau de bord sont enregistrés directement dans Supabase et apparaissent sur le site public après actualisation.