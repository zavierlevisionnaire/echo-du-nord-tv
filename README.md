# Écho du Nord TV

**L’information qui résonne au-delà des frontières.**

Site public : https://zavierlevisionnaire.github.io/echo-du-nord-tv/

## Administration éditoriale

L’administration est gérée avec [Pages CMS](https://app.pagescms.org/), connecté au dépôt GitHub `zavierlevisionnaire/echo-du-nord-tv`.

- **Articles** : créer et modifier les publications.
- **Médias** : déposer les photos dans le dossier `media/`.
- **Page d’accueil (HTML)** : modifier la structure du site uniquement si nécessaire.

Pour publier un article :
1. Ouvrir Pages CMS et sélectionner le dépôt `echo-du-nord-tv`.
2. Ouvrir **Articles**, puis **Ajouter une entrée**.
3. Renseigner le titre, la date, la catégorie, la photo de couverture et le résumé.
4. Rédiger le contenu, puis enregistrer.
5. Attendre la mise à jour du site GitHub Pages et actualiser la page.

Les articles sont enregistrés dans `content/articles/` au format Markdown avec métadonnées YAML. La page d’accueil les récupère depuis le dépôt public et les affiche automatiquement.

## Fichiers principaux

- `index.html` : structure de la page d’accueil.
- `styles.css` : identité graphique et adaptation mobile.
- `script.js` : navigation, réseaux sociaux et affichage des articles.
- `.pages.yml` : configuration de Pages CMS.
- `media/` : photos et visuels.
- `content/articles/` : articles de la rédaction.

## Coordonnées officielles

- Rédaction : echodunordtv9@gmail.com
- WhatsApp : +241 74 61 91 27
- Facebook : https://www.facebook.com/share/1C2ddVXJ9V/

Le lien YouTube et le lecteur vidéo en direct seront activés dès que la chaîne et la source de diffusion officielles seront disponibles.

## Hébergement

Le site est un site statique hébergé avec GitHub Pages. Les modifications enregistrées sur la branche `main` sont publiées par le mécanisme GitHub Pages configuré pour ce dépôt. Pages CMS modifie les fichiers du dépôt ; il ne fournit pas à lui seul un serveur vidéo ni une base de données.
