# 🚀 GUIDE DE PUBLICATION WAQQTI — de zéro à en ligne

Ce guide te fait passer d'un dossier de fichiers à **waqqti.com en ligne et testé**.
Suis-le dans l'ordre, de haut en bas.

> 🆕 **Mise à jour (aujourd'hui)** : ce guide intègre désormais les nouvelles
> fonctionnalités livrées — **acompte + RIB**, **preuve de paiement**,
> **authentification client (Google + email)**, **annuaire + géolocalisation**, et
> **notifications WhatsApp automatiques**. Les étapes concernées sont marquées 🆕.
> Le détail technique complet est dans `GUIDE-NOUVELLES-FONCTIONNALITES.md`.

---

## 🧭 Comprendre le principe (2 minutes)

Ton site a **deux moitiés** qui se parlent :

- **Le FRONTEND** = tes fichiers `.html` (ce que les gens voient). Il vit sur **GitHub**, branché sur **Vercel** (l'hébergeur).
- **Le BACKEND** = base de données, comptes, stockage, notifications. Il vit sur **Supabase**.
- **Le pont** = `assets/config.js`, qui contient l'adresse et la clé anon de ton Supabase.

**Règle d'or :** chaque envoi sur GitHub → Vercel remet le site à jour tout seul.
**Exception 🆕 :** l'Edge Function WhatsApp ne se déploie **pas** via GitHub, mais avec la CLI Supabase (voir Étape 6).

---

## ✅ ÉTAPE 0 — Ce qu'il te faut

- [ ] **GitHub** → https://github.com (héberge le code)
- [ ] **Vercel** → https://vercel.com (héberge le site)
- [ ] **Supabase** → https://supabase.com (base de données)
- [ ] **Accès au domaine** waqqti.com (OVH, Namecheap, GoDaddy…)
- [ ] 🆕 **Compte développeur Meta** → https://developers.facebook.com (WhatsApp auto — peut se faire après le lancement)
- [ ] 🆕 **Compte Google Cloud** → https://console.cloud.google.com (connexion Google — peut se faire après)

---

## 📁 ÉTAPE 1 — Organiser tes fichiers

Arborescence **à jour** (les 🆕 sont nouveaux) :

```
waqqti/
├── index.html                     ← landing (liens Annuaire / Espace client / Espace Pro)
├── admin.html                     ← TON outil interne (créer/lier les salons)
├── auth.html                      🆕 espace client (inscription/connexion Google + email)
├── annuaire.html                  🆕 annuaire public (recherche + « Autour de moi »)
├── manifest.json                  ← PWA
├── service-worker.js              ← PWA
├── assets/
│   ├── config.js                  ← connexion Supabase (+ helpers acompte/auth/géoloc)
│   └── i18n.js                    ← moteur FR/AR
├── client/
│   └── salon.html                 ← réservation cliente (+ acompte + upload reçu)
├── pro/
│   └── dashboard.html             ← espace gérant (+ RIB, config acompte, vue Acomptes)
└── supabase/
    ├── schema.sql                 ← schéma de base (tables, RLS, Kill Switch, bucket)
    ├── migration_features.sql     🆕 ajouts (acompte, RIB, profiles, annuaire, géoloc, admin)
    └── functions/
        └── whatsapp-notify/
            └── index.ts           🆕 Edge Function notifications WhatsApp
```

> ⚠️ Les fichiers dans `client/` et `pro/` appellent `../assets/config.js`.
> Ceux à la racine (`index.html`, `admin.html`, `auth.html`, `annuaire.html`) appellent `assets/config.js` (sans `../`). C'est déjà correct dans les fichiers livrés.

---

## 🗄️ ÉTAPE 2 — Configurer Supabase (le backend)

### 2.1 — Le projet
Ton projet existe déjà (`zsbbemdbjoaurywkoshx`). Sinon : https://supabase.com → **New project**, région **Europe / Frankfurt**, note le mot de passe de la base.

### 2.2 — Créer les tables et la sécurité (dans l'ordre)
1. Menu → **SQL Editor** → **New query**.
2. Colle **tout** `schema.sql` → **Run**. (tables, RLS, Kill Switch, anti-surbooking, bucket `justificatifs`.)
3. 🆕 Nouvelle requête → colle **tout** `migration_features.sql` → **Run**. (acompte, RIB, `profiles`, annuaire, géoloc, policy admin, RPC WhatsApp.)
4. Tu dois voir *« Success »* à chaque fois. C'est ré-exécutable sans risque.

### 2.3 — Devenir administrateur 🆕 (nouvelle méthode)
> ⚠️ L'ancienne méthode (table `admins`) n'existe plus. On utilise `profiles.role`.

1. Inscris-toi **une fois** avec ton email : ouvre `pro/dashboard.html` (ou `auth.html`) → **Créer un compte**. (En local/test, désactive la confirmation d'email — voir 2.5.)
2. Menu Supabase → **SQL Editor** → exécute :
   ```sql
   update public.profiles set role = 'admin' where email = 'TON_EMAIL';
   ```
   → C'est ce qui t'autorise, toi seul, à créer/lier des salons dans `admin.html`.

### 2.4 — Récupérer tes clés
**Project Settings → API** : note **Project URL** et **anon public**.
⚠️ Ne touche **jamais** à `service_role` — elle ne va nulle part dans le site (sauf dans les secrets de l'Edge Function, côté serveur, cf. Étape 6).

### 2.5 — Réglages Auth (email)
**Authentication → Providers → Email** : activé par défaut.
Pour tester vite : **Authentication → … → Email → décoche « Confirm email »** (à **réactiver en production**).

---

## 🔌 ÉTAPE 3 — Brancher le site à Supabase

Ouvre `assets/config.js` et vérifie les deux valeurs (déjà renseignées pour ton projet) :
```js
var SUPABASE_URL      = "https://zsbbemdbjoaurywkoshx.supabase.co";
var SUPABASE_ANON_KEY = "TA_CLE_ANON_PUBLIC";
```
Une clé fausse/vide = « chargement… » infini partout.

---

## 🔐 ÉTAPE 4 🆕 — Connexion Google (pour tes CLIENTS)

> La connexion Google et la création de compte servent à **l'utilisateur final (le client)**
> qui navigue dans l'appli (`auth.html`). Le même bouton est aussi dispo sur l'espace gérant.

1. **Google Cloud Console** → nouveau projet → **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
2. **Authorized redirect URIs** → ajoute :
   `https://zsbbemdbjoaurywkoshx.supabase.co/auth/v1/callback`
3. Copie **Client ID** + **Client Secret**.
4. Supabase → **Authentication → Providers → Google** → colle-les, active.
5. Supabase → **Authentication → URL Configuration** → ajoute tes URLs autorisées :
   `https://waqqti.com/auth.html`, `https://waqqti.com/`, et en test `https://waqqti-xxxx.vercel.app/...`.

Le Nom/Prénom sont enregistrés automatiquement dans la table `profiles`.

---

## 📤 ÉTAPE 5 — Mettre le code sur GitHub

Ton dépôt existe déjà : **MarwaMalik2000/WAQQTI-MALIK-MARWA**. Pour appliquer les
nouveautés, voir la **section « APPLIQUER LES CHANGEMENTS (git) »** plus bas. ⤵

*(Premier envoi seulement, si tu repars de zéro :)*
```bash
cd waqqti
git init
git add .
git commit -m "Waqqti v1"
git branch -M main
git remote add origin https://github.com/MarwaMalik2000/WAQQTI-MALIK-MARWA.git
git push -u origin main
```

---

## 🌐 ÉTAPE 6 — Déployer

### 6.1 Le site (Vercel)
1. https://vercel.com → connecte-toi **avec GitHub** → **Add New → Project** → importe `WAQQTI-MALIK-MARWA`.
2. **Framework Preset : Other** (site statique) → **Deploy**.
3. Tu obtiens `waqqti-xxxx.vercel.app` (ton site de TEST). Chaque push GitHub le met à jour.

### 6.2 🆕 L'Edge Function WhatsApp (CLI Supabase, séparément)
> Prérequis Meta : app **Business** + produit **WhatsApp**, **Phone Number ID**, **token permanent**, et 4 **templates approuvés** (`waqqti_confirmation`, `waqqti_demande_acompte`, `waqqti_acompte_valide`, `waqqti_nouveau_rdv`). Détails et textes des templates dans `GUIDE-NOUVELLES-FONCTIONNALITES.md` §6.

```bash
npm i -g supabase
supabase login
supabase link --project-ref zsbbemdbjoaurywkoshx
supabase functions deploy whatsapp-notify --no-verify-jwt
supabase secrets set WHATSAPP_TOKEN="EAAG..." WHATSAPP_PHONE_ID="123456789" WEBHOOK_SECRET="un-secret-long-aleatoire"
```

Puis branche le déclencheur : Supabase → **Database → Webhooks → Create a new hook** :
- Table `reservations`, événements **Insert** + **Update**
- Type **Supabase Edge Function** → `whatsapp-notify`
- Header `x-webhook-secret` = la même valeur que `WEBHOOK_SECRET`.

---

## 🏷️ ÉTAPE 7 — Brancher le domaine waqqti.com

1. Projet Vercel → **Settings → Domains** → ajoute `waqqti.com` et `www.waqqti.com`.
2. Copie les DNS affichés par Vercel (souvent A `76.76.21.21` + CNAME `cname.vercel-dns.com`) chez ton registrar.
3. Attends que Vercel passe au vert. La propagation prend quelques minutes à quelques heures.

---

## 📥 APPLIQUER LES CHANGEMENTS (git) 🆕

Tu as déjà un dépôt en ligne. Voici comment y pousser le travail d'aujourd'hui.

**1. Récupère ton dépôt en local (si pas déjà fait) :**
```bash
git clone https://github.com/MarwaMalik2000/WAQQTI-MALIK-MARWA.git
cd WAQQTI-MALIK-MARWA
```

**2. Copie les fichiers livrés par-dessus**, en respectant l'arborescence. Fichiers concernés :

- *Modifiés* : `index.html`, `admin.html`, `assets/config.js`, `client/salon.html`, `pro/dashboard.html`, `GUIDE-PUBLICATION.md`
- *Nouveaux* : `auth.html`, `annuaire.html`, `supabase/migration_features.sql`, `supabase/functions/whatsapp-notify/index.ts`, `GUIDE-NOUVELLES-FONCTIONNALITES.md`

**3. Commite et pousse** (sur une branche, recommandé) :
```bash
git checkout -b feat-acompte-auth-whatsapp

git add index.html admin.html auth.html annuaire.html \
        assets/config.js client/salon.html pro/dashboard.html \
        supabase/migration_features.sql \
        supabase/functions/whatsapp-notify/index.ts \
        GUIDE-PUBLICATION.md GUIDE-NOUVELLES-FONCTIONNALITES.md

git commit -m "feat: acompte+RIB, preuve de paiement, auth client Google/email, annuaire+geoloc, WhatsApp auto"

git push -u origin feat-acompte-auth-whatsapp
```

**4. Fusionne** : ouvre la Pull Request sur GitHub et clique **Merge** — Vercel redéploie.
*(Ou pour aller direct sur `main` : remplace les 2 dernières commandes par `git commit -m "..."` puis `git push origin main`.)*

> ⚠️ Rappel : le `git push` déploie le **site** ; il ne déploie **pas** l'Edge Function WhatsApp (Étape 6.2) ni n'exécute la migration SQL (Étape 2.2). Ces deux-là se font une fois, à la main.

---

## 🧪 TEST COMPLET

Fais tout sur `.vercel.app` d'abord, puis sur `waqqti.com`.

### A. Landing & navigation 🆕
- [ ] `index.html` s'affiche ; bascule **FR / ع** OK.
- [ ] Menu : **Annuaire des salons**, **Espace client**, **Espace Pro** mènent aux bonnes pages.
- [ ] Console (**F12**) : **aucune** erreur rouge (surtout pas `Cannot set properties of null`).

### B. Admin
- [ ] `admin.html` → connecte-toi (compte admin, cf. 2.3) → crée « Salon Démo » → il apparaît + dans Supabase `salons`.
- [ ] Change sa formule → OK (nécessite la policy admin de la migration).

### C. Client : réservation + acompte 🆕
- [ ] Gérant : **Paramètres** → renseigne le RIB ; **Prestations** → active un acompte (ex : 20 %).
- [ ] Client : `client/salon.html?s=demo` → choisis cette prestation → l'**acompte** et les **coordonnées de paiement** s'affichent.
- [ ] Termine la réservation → un champ d'**upload photo** apparaît → envoie une image → « Reçu envoyé ✅ ».
- [ ] Supabase → `reservations` : `acompte_montant`, `acompte_statut='en_attente'`, `justificatif_url` remplis.
- [ ] **Anti-surbooking** : sur un salon 1 siège, re-réserve le même créneau → refusé.

### D. Gérant : validation acompte 🆕
- [ ] Espace gérant → menu **Acomptes** → **🖼 Voir le reçu** (image s'ouvre) → **Valider** → statut passe à « Validé ».
- [ ] **Isolation** : un gérant ne voit **que** ses propres réservations/acomptes.

### E. Auth client 🆕
- [ ] `auth.html` → **Créer un compte** (Prénom, Nom, email, mot de passe, confirmation) → arrivée sur l'espace client.
- [ ] Connexion **Google** fonctionne (après Étape 4).
- [ ] Supabase → `profiles` : le Nom/Prénom sont enregistrés.

### F. Annuaire & géoloc 🆕
- [ ] Gérant : **Paramètres → Localisation** → « Utiliser ma position » → Enregistrer.
- [ ] `annuaire.html` : la recherche par nom/ville marche ; **📍 Autour de moi** demande la position et trie par distance.

### G. Kill Switch (ton modèle B2B)
- [ ] Supabase → un salon test → mets `trial_end_date` à **il y a 1 jour** (Table Editor).
- [ ] Recharge son espace gérant → l'interface se **bloque**.
- [ ] Étanchéité : supprime le blocage via la console (**F12**) → les données doivent **rester** inaccessibles (RLS). Sinon, préviens-moi.

### H. WhatsApp auto 🆕 (après Étape 6.2)
- [ ] Une nouvelle réservation déclenche : confirmation au client + notif au gérant (+ demande d'acompte si requis).
- [ ] Valider un acompte → message de confirmation au client.

---

## 🟢 GO-LIVE
- [ ] Tout est vert sur `waqqti.com`.
- [ ] Réactive « Confirm email » dans Supabase Auth.
- [ ] Supprime/garde « Salon Démo ». Prêt pour le terrain. 🚀

---

## 🛠️ DÉPANNAGE

| Symptôme | Cause probable | Solution |
|---|---|---|
| **Page blanche** partout | Clé anon absente/fausse dans `config.js` | Recolle la clé **anon public** (Étape 3) |
| **« Chargement… » infini** admin/dashboard | Pas connecté, ou pas admin | Refais 2.3 (`update profiles set role='admin'`) |
| **admin.html : impossible de créer un salon** | `migration_features.sql` pas exécutée (policy admin manquante) | Exécute la migration (2.2) puis reconnecte-toi |
| **`new row violates row-level security`** | Action sans les droits | Connecte-toi avec le bon compte (admin/gérant) |
| **Le reçu ne s'affiche pas côté gérant** | Bucket privé / pas connecté | Vérifie que tu es le gérant propriétaire du salon |
| **Google renvoie une erreur redirect** | URL callback non autorisée | Ajoute l'URI exacte (Étape 4.2) |
| **WhatsApp ne part pas** | Template non approuvé / secret webhook différent | Vérifie templates Meta + `x-webhook-secret` (Étape 6.2) |
| **404 sur waqqti.com** mais `.vercel.app` OK | DNS pas propagé | Attends, revérifie l'onglet Domains |

> 🔎 Réflexe n°1 : ouvre la **console (F12)**, lis le message rouge, envoie-le moi.

---

## 📌 Les 3 secrets à ne JAMAIS exposer
1. La clé **`service_role`** (uniquement dans les secrets de l'Edge Function, jamais dans le site).
2. Le **mot de passe de la base** Supabase.
3. Le **WHATSAPP_TOKEN** et le **WEBHOOK_SECRET** (secrets Edge Function).

La seule clé autorisée dans `config.js` : **anon public**.

---

*Guide Waqqti — mis à jour avec : acompte/RIB, preuve de paiement, auth client Google/email, annuaire+géoloc, WhatsApp automatique.*
