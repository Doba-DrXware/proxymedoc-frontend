Pré-bundling des tuiles (public/tiles)

But: Ce script télécharge un petit jeu de tuiles dans public/tiles/{z}/{x}/{y}.png.

Usage:

1. Installer dépendances (si nécessaire) et exécuter le script:

```bash
npm run download-tiles
```

2. Le script télécharge les tuiles autour de Total Melen (lat=3.8841 lon=11.4945) pour les zooms 12 et 13 (radius=1 par défaut).

3. Committez `public/tiles` si la taille est raisonnable, ou hébergez le dossier sur un CDN.

4. L'app utilise désormais `/tiles/{z}/{x}/{y}.png` dans `src/components/ItineraireMap.tsx`.

Important:
- Respectez la politique d'utilisation de tile.openstreetmap.org. Ne téléchargez pas de grandes quantités de tuiles depuis le service public pour redistribution.
- Pour production, préférez générer vos propres tuiles (MBTiles) et héberger sur un serveur de tuiles.
