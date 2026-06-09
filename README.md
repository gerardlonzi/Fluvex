# Fluvex

**Plateforme de gestion de flotte et de livraisons** pour les entreprises logistiques. Fluvex centralise véhicules, chauffeurs, livraisons, cartographie en temps réel, analytique et suivi de l'impact environnemental.

---

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Tableau de bord** | Vue d'ensemble : livraisons actives, flotte, revenus, indicateurs CO₂ |
| **Flotte & chauffeurs** | Gestion des conducteurs, véhicules et affectations |
| **Carte temps réel** | Suivi géolocalisé via Mapbox |
| **Livraisons** | Création, suivi, expiration automatique des statuts |
| **Analytique** | Graphiques et exports CSV |
| **Impact écologique** | Métriques de durabilité et routes optimisées |
| **Paramètres** | Profil entreprise, notifications, thème clair/sombre, FR/EN |

---

## Stack technique

- **Framework** — [Next.js 16](https://nextjs.org) (App Router)
- **UI** — React 19, Tailwind CSS, Lucide Icons
- **Base de données** — MongoDB Atlas via [Prisma](https://www.prisma.io)
- **Auth** — Sessions signées (cookie HTTP-only `fluvex_session`)
- **Validation** — Zod + React Hook Form
- **Cartes** — Mapbox GL / react-map-gl
- **Médias** — Cloudinary
- **Graphiques** — Recharts

---

## Architecture

```
Visiteur non connecté  →  /  →  redirect /login
Utilisateur connecté   →  /  →  redirect /dashboard

middleware.ts          Protection des routes (cookie)
app/dashboard/layout   requireAuth() côté serveur
lib/auth.ts            Sessions, hash mot de passe (scrypt)
lib/api-auth.ts        requireSession() pour les routes API
```

L'authentification repose sur **deux niveaux** :

1. **Middleware** (`middleware.ts`) — redirige `/` vers `/login` ou `/dashboard`, protège `/dashboard/*`.
2. **Layout serveur** (`app/dashboard/layout.tsx`) — appelle `requireAuth()` avant tout rendu du dashboard.

Les pages dashboard utilisent `requireAuth()` pour obtenir `userId` et `companyId` sans logique client redondante.

---

## Structure du projet

```
app/
├── (auth)/              Login & inscription
├── api/                 Routes REST (auth, livraisons, flotte, exports…)
├── dashboard/           Pages protégées (Server + Client Components)
├── driver/              Suivi chauffeur
└── page.tsx             Redirect racine

lib/
├── auth.ts              Sessions & mots de passe
├── db.ts                Client Prisma singleton
├── api-auth.ts          Garde API
└── validations/         Schémas Zod

prisma/
└── schema.prisma        Modèles MongoDB

src/
├── components/          UI, layout, cartes, notifications
└── contexts/            Thème, langue, sidebar

middleware.ts            Protection des routes
```

---

## Prérequis

- **Node.js** 20+
- **npm** (ou pnpm / yarn)
- Compte **[MongoDB Atlas](https://www.mongodb.com/atlas)** (cluster gratuit disponible)
- Token **[Mapbox](https://account.mapbox.com/)** (cartes)
- Compte **[Cloudinary](https://cloudinary.com/)** (uploads — optionnel au démarrage)

---

## Installation

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd Fluvex

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditez .env avec vos identifiants

# 4. Générer le client Prisma et pousser le schéma
npx prisma generate
npx prisma db push

# 5. Lancer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) — vous serez redirigé vers `/login`.

---

## Variables d'environnement

| Variable | Obligatoire | Description |
|----------|:-----------:|-------------|
| `DATABASE_URL` | ✅ | URI MongoDB Atlas (`mongodb+srv://…`) |
| `SESSION_SECRET` | ✅ | Secret HMAC pour les sessions (longue chaîne aléatoire en prod) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | ✅ | Token public Mapbox |
| `CLOUDINARY_CLOUD_NAME` | ⚪ | Cloudinary — nom du cloud |
| `CLOUDINARY_API_KEY` | ⚪ | Cloudinary — clé API |
| `CLOUDINARY_API_SECRET` | ⚪ | Cloudinary — secret API |

### MongoDB Atlas — erreurs fréquentes

Si login/register renvoie *« Connexion à la base de données impossible »* ou `SCRAM failure: bad auth` :

1. Vérifiez **utilisateur / mot de passe** dans Atlas → Database Access.
2. Autorisez votre IP dans **Network Access** (ou `0.0.0.0/0` en dev).
3. **Encodez** les caractères spéciaux du mot de passe dans l'URL (`@` → `%40`, `#` → `%23`, etc.).
4. Une seule ligne `DATABASE_URL=` active dans `.env` (pas de doublons commentés).

Exemple :

```env
DATABASE_URL="mongodb+srv://monuser:MonM%40tDePasse@cluster0.xxxxx.mongodb.net/fluvex?retryWrites=true&w=majority"
```

---

## Scripts npm

| Commande | Action |
|----------|--------|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | Analyse ESLint |
| `npx prisma studio` | Interface visuelle de la base |
| `npx prisma db push` | Synchroniser le schéma Prisma → MongoDB |

---

## Routes principales

| Route | Accès | Rôle |
|-------|-------|------|
| `/` | Public | Redirect → `/login` ou `/dashboard` |
| `/login` | Public | Connexion |
| `/register` | Public | Inscription entreprise |
| `/dashboard` | Protégé | Tableau de bord |
| `/dashboard/fleet` | Protégé | Flotte & chauffeurs |
| `/dashboard/map` | Protégé | Carte temps réel |
| `/dashboard/deliveries` | Protégé | Livraisons |
| `/dashboard/analytics` | Protégé | Analytique |
| `/dashboard/drivers` | Protégé | Performance chauffeurs |
| `/dashboard/sustainability` | Protégé | Impact écologique |
| `/dashboard/settings` | Protégé | Paramètres |

---

## API (aperçu)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | Connexion |
| `/api/auth/register` | POST | Inscription |
| `/api/auth/logout` | POST | Déconnexion |
| `/api/auth/me` | GET | Utilisateur courant |
| `/api/deliveries` | GET, POST | Livraisons |
| `/api/drivers` | GET, POST | Chauffeurs |
| `/api/vehicles` | GET, POST | Véhicules |
| `/api/telemetry/locations` | GET | Positions GPS |
| `/api/export/*` | GET | Exports CSV |
| `/api/upload` | POST | Upload Cloudinary |

Toutes les routes API métier exigent une session valide (`requireSession` dans `lib/api-auth.ts`).

---

## Déploiement

1. Build : `npm run build`
2. Définir toutes les variables d'environnement sur la plateforme (Vercel, Railway, etc.).
3. `SESSION_SECRET` : valeur unique et sécurisée en production.
4. MongoDB Atlas : autoriser les IP du serveur de production.
5. Démarrer : `npm run start`

---

## Licence

Projet privé — tous droits réservés.
