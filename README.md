# AsciiNote
AsciiNote est une application moderne de prise de notes en AsciiDoc, permettant de créer, éditer et visualiser des documents AsciiDoc avec une interface intuitive. L'application fonctionne aussi bien en ligne qu'hors ligne grâce à une synchronisation intelligente.
## Caractéristiques
- ✏️ Édition et prévisualisation AsciiDoc en temps réel
- 📱 Interface responsive adaptée aux ordinateurs et appareils mobiles
- 🔄 Synchronisation automatique avec sauvegarde des notes en local
- 🌙 Mode clair/sombre
- 📊 Tableaux de bord avec visualisation des données
- 🔍 Recherche avancée dans vos notes
- 📦 Application web progressive (PWA) pour utilisation hors ligne

## Prérequis
- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- [pnpm](https://pnpm.io/) (v8 ou supérieur)
- MongoDB (pour le stockage des données)

## Installation
### 1. Cloner le dépôt
``` bash
git clone https://github.com/Daemon0x00000000/asciinote.git
cd asciinote
```
### 2. Installer les dépendances
``` bash
pnpm install
```
### 3. Configuration
Créez un fichier `.env` à la racine du projet avec les variables suivantes :
``` env
# Configuration de la base de données
MONGODB_URI=mongodb://localhost:27017/asciinote?authSource=admin
# Secret pour les sessions et JWT
SECRET_KEY=votre_clef_secrete_tres_complexe
# Port de l'application (optionnel, par défaut 3000)
PORT=3000
# Mode de développement
NODE_ENV=development
```
### 4. Démarrer en mode développement
``` bash
pnpm dev
```
L'application sera disponible à l'adresse [http://localhost:5173](http://localhost:5173).
### 5. Construire pour la production
``` bash
pnpm build
```
### 6. Démarrer en mode production
``` bash
pnpm start
```
## Structure du projet
``` 
asciinote/
├── src/
│   ├── lib/
│   │   ├── components/   # Composants Svelte réutilisables
│   │   ├── services/     # Services (API, DB, etc.)
│   │   ├── stores/       # Stores Svelte
│   │   └── common/       # Types et utilitaires communs
│   ├── routes/           # Routes SvelteKit
│   │   ├── api/          # Points de terminaison API
│   │   └── app/          # Pages de l'application
│   └── app.html          # Template HTML principal
├── static/               # Fichiers statiques (images, favicon, etc.)
├── tests/                # Tests unitaires et d'intégration
├── vite.config.js        # Configuration Vite
└── svelte.config.js      # Configuration SvelteKit
```
## Technologies utilisées
- **Frontend** : [Svelte](https://svelte.dev/) (v5) / [SvelteKit](https://kit.svelte.dev/) (v2)
- **Backend** : SvelteKit API endpoints avec MongoDB
- **Base de données** : [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Styles** : [TailwindCSS](https://tailwindcss.com/)
- **PWA** : [Workbox](https://developers.google.com/web/tools/workbox) pour la gestion offline
- **Rendu AsciiDoc** : [Asciidoctor.js](https://github.com/asciidoctor/asciidoctor.js)

## Fonctionnement hors ligne
AsciiNote utilise une architecture PWA (Progressive Web App) pour fonctionner hors ligne :
1. Les notes sont stockées localement dans IndexedDB
2. Les modifications sont mises en file d'attente quand vous êtes hors ligne
3. La synchronisation se fait automatiquement lorsque la connexion est rétablie

Projet développé dans le cadre d'un cours.
