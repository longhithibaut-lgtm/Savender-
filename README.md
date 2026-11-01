# Savender

Plateforme de **réservation de créneaux** et de **codes d'accès VIP** — inspirée du modèle « slot booking », construite en React + Vite.

> ⚠️ **Usage prévu.** Savender est une marketplace de réservation **neutre et légale**.
> Elle est destinée à louer/partager des accès que **vous détenez ou avez le droit de partager**
> (votre propre serveur, API, logiciel sous licence revendeur, service de coaching, espace, etc.).
> Elle **ne contient aucun mécanisme** d'injection de cookies ou de contournement de la
> protection d'un service tiers, et ne doit pas être utilisée pour revendre des comptes
> dont le partage viole les conditions d'utilisation du service concerné.

## Fonctionnalités

- 🗂️ **Catalogue d'offres** — chaque offre a un prix, une durée de créneau, des horaires d'ouverture, une catégorie et une couleur d'accent.
- 📅 **Réservation instantanée** — sélection du jour (7 jours glissants) et du créneau libre, sans création de compte.
- 🎟️ **Codes d'accès** — chaque réservation génère un code unique ; l'hôte peut aussi générer des codes VIP autonomes (avec note d'accès et expiration optionnelle).
- 🔎 **Mes réservations** — recherche par identifiant, annulation.
- 💸 **Remise globale** — promo configurable appliquée à tout le catalogue.
- 🔐 **Panneau admin** (PIN) — CRUD des offres, limitation de disponibilité (override), gestion des codes, suivi des réservations, réglages de marque.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
```

Build de production :

```bash
npm run build
npm run preview
```

## Déploiement

Le projet est un SPA statique (`dist/`). Il se déploie tel quel sur Replit, Vercel, Netlify, GitHub Pages, etc.

## Stockage des données

Pour cette version, toutes les données (offres, réservations, codes, réglages) sont **persistées dans le `localStorage`** du navigateur via `src/store.js`. La couche de données est isolée derrière des fonctions d'action, ce qui permet de la remplacer plus tard par une vraie API HTTP + base de données sans toucher à l'interface.

### Panneau admin

Accès via l'onglet **Admin** — PIN de démo : `2468` (modifiable dans l'onglet Réglages).

## Structure

```
src/
  store.js        # couche de données (localStorage) + actions
  useStore.js     # hook de synchronisation React
  router.js       # routeur minimal basé sur le hash
  App.jsx         # layout, navigation, routage
  pages/
    Home.jsx      # hero + catalogue
    Book.jsx      # réservation d'un créneau
    Bookings.jsx  # recherche / annulation
    Redeem.jsx    # validation d'un code
    Admin.jsx     # panneau d'administration
  styles.css      # design system
```
