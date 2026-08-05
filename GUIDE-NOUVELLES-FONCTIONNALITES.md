# Waqqti — Guide des nouvelles fonctionnalités

Ce guide accompagne les modifications de code. Il couvre, étape par étape : la base
de données, le Storage, l'authentification (Google + email), les notifications
WhatsApp automatiques, la géolocalisation, et le déploiement.

Tout a été conçu pour rester dans ton architecture : **HTML5 + Tailwind CDN + JS
Vanilla + Supabase**, sans framework, sans passerelle de paiement (acompte
déclaratif avec preuve).

---

## 1. Fichiers modifiés / créés

**Créés :**

- `supabase/migration_features.sql` — tous les ajouts SQL (à exécuter après `schema.sql`).
- `supabase/functions/whatsapp-notify/index.ts` — Edge Function d'envoi WhatsApp.
- `annuaire.html` — annuaire public (recherche + « Autour de moi »).
- `auth.html` — espace client (inscription/connexion Google + email).

**Modifiés :**

- `assets/config.js` — helpers partagés (acompte, upload justificatif, URL signée, auth Google, distance GPS).
- `client/salon.html` — affichage de l'acompte + coordonnées de paiement + upload du reçu.
- `pro/dashboard.html` — RIB dans Paramètres, config acompte par prestation, vue **Acomptes** (valider/refuser + voir le reçu), Google + inscription au login.
- `index.html` — liens de menu (Annuaire, Espace client, Espace Pro).
- `admin.html` — bouton « 👤 Gérant » pour lier un salon à un compte.

---

## 2. Base de données (obligatoire, en premier)

1. Ouvre **Supabase → SQL Editor**.
2. Colle le contenu de `supabase/migration_features.sql` et exécute (**Run**).
3. C'est idempotent : tu peux le relancer sans risque.

Ce que ça ajoute :

- `salons` : `rib_type`, `rib_titulaire`, `rib_numero`, `rib_cle`, `rib_instructions`, `latitude`, `longitude`.
- `prestations` : `acompte_actif`, `acompte_type` (`pourcentage`/`fixe`), `acompte_valeur`.
- Table `profiles` (Nom/Prénom liés à `auth.users`) + trigger qui la remplit à chaque inscription.
- RPC : `creer_reservation` (calcule l'acompte côté serveur), `attacher_justificatif`, `statuer_acompte`, `annuaire_salons`, `salons_proches`, `distance_km`, `lier_salon_owner`.
- Policy Storage autorisant l'**upload anonyme** dans le bucket `justificatifs`.

Une fois inscrit avec ton email, deviens administrateur :

```sql
update public.profiles set role = 'admin' where email = 'TON_EMAIL';
```

---

## 3. Storage (bucket justificatifs)

Le bucket `justificatifs` est déjà créé par `schema.sql` (privé). La migration ajoute
la policy d'upload anonyme. Rien à faire de plus.

- **Lecture** : réservée au gérant propriétaire (il génère une URL signée d'1 h pour afficher le reçu). C'est fait automatiquement par le bouton « 🖼 Voir le reçu ».
- **Écriture** : le client (non connecté) dépose son reçu au chemin `justificatifs/{salon_id}/{reservation_id}.ext`.

---

## 4. Acompte + RIB (côté gérant et côté client)

**Gérant (`pro/dashboard.html`) :**

- **Paramètres → Coordonnées de paiement** : type (BaridiMob / CCP / RIB / Autre), titulaire, numéro, clé, instructions.
- **Prestations → (édition)** : coche « Demander un acompte », choisis *Pourcentage* (ex : `20` = 20 %) ou *Montant fixe* (ex : `500` DA).
- **Acomptes** (nouveau menu) : liste des réservations avec acompte, voir le reçu, **Valider** ou **Refuser**. Une pastille orange indique le nombre en attente.

**Client (`client/salon.html`) :**

- Si la prestation choisie a un acompte, le montant s'affiche dès la sélection puis à l'étape Coordonnées avec les coordonnées de paiement du salon.
- Après confirmation, un champ d'**upload photo** apparaît pour déposer le reçu. L'échéance de paiement est calculée automatiquement (grille 4 tranches déjà en base).

L'acompte est **recalculé côté serveur** dans `creer_reservation` : impossible pour un client de le contourner.

---

## 5. Authentification (Google + Email/Mot de passe)

### 5.1 Activer Email/Mot de passe
Supabase → **Authentication → Providers → Email** : activé par défaut.
Pour tester sans confirmation d'email : **Authentication → Sign In / Providers →
Email → désactive « Confirm email »** (à réactiver en production).

### 5.2 Activer Google OAuth
1. **Google Cloud Console** → crée un projet → **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
2. **Authorized redirect URIs** : ajoute l'URL callback de Supabase :
   `https://zsbbemdbjoaurywkoshx.supabase.co/auth/v1/callback`
3. Récupère le **Client ID** et **Client Secret**.
4. Supabase → **Authentication → Providers → Google** : colle Client ID + Secret, active.
5. Supabase → **Authentication → URL Configuration** : ajoute tes URLs de redirection autorisées (`https://waqqti.com/auth.html`, `https://waqqti.com/pro/dashboard.html`, et en dev `http://localhost:...`).

Les boutons « Continuer avec Google » sont déjà en place sur `auth.html` et `pro/dashboard.html`. Le Nom/Prénom sont stockés dans `profiles` automatiquement (via le trigger, y compris `given_name`/`family_name` de Google).

### 5.3 Lier un salon à un gérant
1. Le gérant s'inscrit via `pro/dashboard.html` (email ou Google).
2. Toi (admin) → `admin.html` → sur le salon → **👤 Gérant** → saisis l'email du gérant.
3. `lier_salon_owner` relie `salons.owner` au compte et passe son rôle à `gerant`.

---

## 6. Notifications WhatsApp automatiques

### 6.1 Quelle API : Meta WhatsApp Business Cloud API (recommandée)
C'est l'option **la moins chère et 100 % automatique** (le client ne fait rien) :

- **API directe de Meta** (pas de revendeur/BSP → pas de marge). Endpoint : `https://graph.facebook.com/v20.0/{PHONE_NUMBER_ID}/messages`.
- Les **conversations de service** et les **templates utilitaires** (confirmation, rappel, statut de paiement) bénéficient d'un quota gratuit généreux ; au-delà, la facturation est à la conversation.
- Alternative plus simple mais **non automatique** : liens `wa.me` pré-remplis (déjà utilisés pour le support). On garde Meta pour l'automatisation.

### 6.2 Créer l'app Meta
1. **developers.facebook.com** → crée une app type **Business** → ajoute le produit **WhatsApp**.
2. Note le **Phone Number ID** et le **WhatsApp Business Account ID**.
3. Génère un **token permanent** (via un System User dans Meta Business Suite → droits `whatsapp_business_messaging`).
4. Ajoute et vérifie ton numéro d'envoi.

### 6.3 Créer les templates (obligatoire, à faire approuver)
Dans **WhatsApp Manager → Message Templates**, crée en langue **Français (fr)**, catégorie *Utility* :

| Nom du template | Corps (avec variables) |
|---|---|
| `waqqti_confirmation` | Bonjour {{1}}, votre RDV chez {{2}} pour « {{3}} » le {{4}} est confirmé. ✅ |
| `waqqti_demande_acompte` | Pour garantir votre RDV chez {{1}}, un acompte de {{2}} est demandé. Paiement : {{3}}. Envoyez le reçu dans l'app. |
| `waqqti_acompte_valide` | Votre acompte pour le RDV chez {{1}} du {{2}} est validé. Merci ! ✅ |
| `waqqti_nouveau_rdv` | Nouveau RDV : {{1}} — {{2}} ({{3}}) le {{4}}. |

Le nombre de variables `{{n}}` doit correspondre exactement au code de la fonction.

### 6.4 Déployer l'Edge Function
Avec la CLI Supabase :

```bash
supabase functions deploy whatsapp-notify --no-verify-jwt
supabase secrets set WHATSAPP_TOKEN="EAAG..." WHATSAPP_PHONE_ID="123456789" WEBHOOK_SECRET="un-secret-long-aleatoire"
```

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement.

### 6.5 Brancher le déclencheur (Database Webhook)
Supabase → **Database → Webhooks → Create a new hook** :

- Table : `reservations`
- Événements : **Insert** et **Update**
- Type : **Supabase Edge Function** → `whatsapp-notify`
- HTTP Header : ajoute `x-webhook-secret` = la même valeur que `WEBHOOK_SECRET`.

Résultat automatique :

- Nouvelle réservation → confirmation au client + notification au gérant (+ demande d'acompte si requis).
- Justificatif reçu → alerte au gérant.
- Acompte validé/refusé → message au client.

---

## 7. Navigation & Annuaire (marketplace)

- `index.html` : liens **Annuaire des salons**, **Espace client**, **Espace Pro** ajoutés au menu et au pied de page.
- `annuaire.html` : barre de recherche (nom / ville / adresse via `annuaire_salons`) et bouton **📍 Autour de moi** (API `navigator.geolocation` du navigateur + RPC `salons_proches`, tri par distance Haversine).
- Pour qu'un salon apparaisse dans « Autour de moi », le gérant renseigne sa **latitude/longitude** dans Paramètres (bouton « Utiliser ma position actuelle »).

**Cartes / géoloc :** l'API `navigator.geolocation` (native, gratuite) suffit pour
« Autour de moi ». Tu n'as **pas besoin** d'une API payante. Si un jour tu veux
afficher une carte ou convertir une adresse en coordonnées, envisage **Leaflet +
OpenStreetMap** (gratuit) ou l'**API Google Maps/Geocoding** (payante au-delà d'un
quota). Ce n'est pas requis pour la fonctionnalité actuelle.

---

## 8. Déploiement (Vercel)

1. Commits + push sur `main` → Vercel redéploie automatiquement.
2. Vérifie que `assets/config.js` contient bien ta clé **anon** (jamais la `service_role`).
3. Ajoute tes domaines dans Supabase → Auth → URL Configuration.

---

## 9. Récapitulatif des API à intégrer

| Besoin | API / Service | Coût | Statut |
|---|---|---|---|
| Auth email + Google | Supabase Auth + Google OAuth | Gratuit | Configuration console |
| Base, RLS, RPC, Storage | Supabase | Gratuit (tier) | Déjà en place |
| WhatsApp automatique | Meta WhatsApp Business Cloud API | Quota gratuit puis /conversation | App Meta + templates |
| « Autour de moi » | `navigator.geolocation` (navigateur) | Gratuit | Déjà codé |
| Carte (optionnel) | Leaflet + OpenStreetMap | Gratuit | Non requis |
| SMS (existant) | Africala | DZD | Séparé |

---

## 10. Check-list de test

- [ ] Migration SQL exécutée sans erreur.
- [ ] Tu es `admin` dans `profiles`.
- [ ] Gérant : renseigner RIB + activer acompte sur une prestation.
- [ ] Client : réserver cette prestation → l'acompte et le RIB s'affichent → uploader une photo.
- [ ] Gérant : menu **Acomptes** → voir le reçu → Valider.
- [ ] Inscription email + Google fonctionnent sur `auth.html` et `pro/dashboard.html`.
- [ ] `admin.html` : lier un salon à l'email du gérant → le gérant voit son salon.
- [ ] Annuaire : recherche + « Autour de moi » (après avoir mis lat/lng sur un salon).
- [ ] WhatsApp : après déploiement + webhook, une nouvelle résa déclenche les messages.
