# Revue architecture et sécurité – Fluvex SaaS

## 1. Architecture – points propres et recommandations

### Ce qui est bien en place
- **Séparation claire** : pages serveur (page.tsx) qui chargent les données et passent des props aux clients (Client.tsx).
- **API cohérente** : routes sous `app/api/` avec `requireSession()` systématique sur les endpoints protégés.
- **Isolation par entreprise** : les requêtes Prisma filtrent par `companyId: session.companyId`.
- **Layout centralisé** : `DashboardShell` + `DashboardAuthGuard` pour toutes les routes dashboard.
- **Composants réutilisables** : `DateRangePicker`, `ConfirmDialog`, squelettes de chargement.

### Recommandations pour une architecture plus propre
1. **Typage des réponses API** : définir des types partagés (ex. `GetDeliveriesResponse`) et les utiliser côté client pour éviter les décalages (ex. tableau vs `{ deliveries }`).
2. **Couche API client** : créer un petit module `lib/api-client.ts` avec des fonctions `getDeliveries(params)`, `getCompany()`, etc. pour centraliser les appels et la gestion d’erreurs.
3. **Constantes partagées** : regrouper les labels de statuts (PENDING, COMPLETED, etc.) dans un seul fichier (ex. `utils/constants.ts`) au lieu de les dupliquer dans plusieurs clients.
4. **Parsing des query params** : réutiliser une même fonction `parseYmd` / `parseDateRange` entre `dashboard/page.tsx`, `analytics/page.tsx`, `deliveries/page.tsx` (ex. dans `lib/date-utils.ts`).

---

## 2. Sécurité – vérifications et bonnes pratiques

### Déjà en place
- **Authentification** : session signée (HMAC SHA-256), cookie `httpOnly`, `sameSite: 'lax'`, `secure` en production.
- **Mots de passe** : scrypt + comparaison `timingSafeEqual` pour éviter les timing attacks.
- **Protection des routes** : `getSession()` / `requireSession()` sur les pages et APIs ; `DashboardAuthGuard` côté client pour rediriger vers `/login`.
- **Isolation des données** : toutes les requêtes métier utilisent `session.companyId`, pas d’accès cross-company.

### Points d’attention
1. **SESSION_SECRET** : en production, utiliser une vraie clé forte (env) et ne jamais commiter la valeur par défaut (`fluvex-dev-secret-change-in-production`).
2. **Validation des entrées** : les schémas Zod (ex. `createDeliverySchema`) sont utilisés sur les POST/PATCH ; à garder systématiquement sur tous les endpoints qui modifient des données.
3. **Upload** : l’API `/api/upload` doit rester protégée par `requireSession` et limiter types/tailles de fichiers (déjà vérifié).
4. **CORS** : si un front externe appelle les APIs, configurer CORS de façon explicite et restrictive.

### Recommandations
- **Rate limiting** : envisager un rate limit sur login et sur les APIs sensibles (export, upload).
- **Logs d’audit** : pour les actions sensibles (suppression livraison, changement statut), logger `userId`, `companyId`, action et id cible (sans données personnelles sensibles).
- **Headers de sécurité** : activer des headers comme `X-Content-Type-Options: nosniff`, `X-Frame-Options`, et un CSP adapté (Next.js peut les gérer dans `next.config.js`).

---

## 3. Résumé des changements effectués (cette session)

- **DashboardShell** : graphe en courbes (Livraisons, Terminées, Revenu, CO₂) affiché uniquement quand un filtre par date est actif sur `/dashboard` ; tooltip aligné avec les stats.
- **Analytics** : utilisation de `DateRangePicker` comme sur le dashboard, filtrage par `from`/`to` dans l’URL ; stats et graphiques mis à jour selon la période.
- **Pages Dashboard et Settings** : format aligné avec les autres pages (contenu dans le shell, sans wrapper `min-h-screen` redondant).
- **Loading / animations** : keyframes et classes d’animation (fade-in, slide-in, zoom-in, pulse) ajoutés dans `tailwind.config.js` et `globals.css` pour que les squelettes et modales s’animent correctement.
- **Correction** : lecture de la réponse de `/api/deliveries` (tableau ou `{ deliveries }`) dans `DashboardClient` pour éviter des erreurs lors du filtrage.

---

*Document généré dans le cadre de la revue architecture et sécurité du projet Fluvex.*
