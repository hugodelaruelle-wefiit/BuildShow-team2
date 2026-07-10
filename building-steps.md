# 🛠️ Building Steps — Coach Soutenances (V1)

> Plan de construction séquencé pour la V1 (cible ~2h). Chaque étape a un **objectif**, les **fichiers** concernés, et un **critère de validation** ("Done when").

## 🧭 Décisions d'architecture (verrouillées)

| Sujet | Choix V1 |
|-------|----------|
| **Voix** | Web Speech API navigateur — STT pour capter le pitch/réponses, TTS pour faire "parler" le client. Le transcript **texte** est envoyé à Claude (pas d'audio). Dictée live sur **Chrome, Edge et Safari** ; sur les navigateurs sans STT (Firefox), repli **saisie/collage** dans une zone de texte (toujours présente et éditable). |
| **Interaction** | **Turn-based** : pitch complet → valider → 3 questions posées une par une → débrief. |
| **Frontend** | Next.js (App Router) + TypeScript + Tailwind. |
| **Backend** | API routes Next.js (`/app/api/...`) — la clé Claude reste **côté serveur**. |
| **IA** | Claude API (Messages), modèle `claude-sonnet-5` par défaut. |
| **Persistance** | Supabase (PostgreSQL) — tables `sessions` + `questions_generated`. |
| **Auth** | **SSO Microsoft 365 / Azure AD** (chemin principal, single-tenant WeFiiT) + **magic-link e-mail Supabase** en secours, restreint aux adresses `@wefiit.com` — voir Phase 1. |
| **Déploiement** | Vercel. |
| **Sources froides** | `guide-prepa-soutenance.md` + `critères-pitch.md` chargés côté serveur et injectés dans le prompt système. |
| **Design System** | **Design System WeFiiT obligatoire** — dossier `Design System - WeFiiT 1`. Toute l'UI suit la charte de marque (couleurs, typo Geomanist, composants). |

> ### 🎨 Design System WeFiiT — règle transverse (s'applique à TOUTES les étapes UI)
>
> L'interface **doit** utiliser le design system WeFiiT fourni dans le dossier `Design System - WeFiiT 1`. Ce n'est pas optionnel.
>
> - **Source de vérité** : `colors_and_type.css` — tokens couleurs, `@font-face` Geomanist, échelle typo, radii, ombres, classes utilitaires (`.wf-h1`, `.wf-eyebrow`, `.wf-dot`, `.wf-lead`…). **À importer dans l'app** (copié dans `app/` ou `public/`, chargé dans `app/layout.tsx`).
> - **Polices** : copier `fonts/` (Geomanist Light→Ultra) dans `public/fonts/`.
> - **Assets** : logo We.FiiT (`assets/logo/`), pictos navy (`assets/icons/`), patterns (`assets/patterns/`) → copier dans `public/`.
> - **UI kit de référence** : `ui_kits/website/` (composants) et `slides/` pour s'inspirer des layouts.
> - **Cues de marque à respecter** :
>   - **Bleu Marine `#002882`** dominant, fond **blanc** par défaut, **Orange Soleil `#F98F03`** en accent (le « point » orange après les titres via `.wf-dot`), **Bleu Électrique `#0042FF`** pour les CTA.
>   - Typo **Geomanist** partout ; titres en **sentence case** clos par un **point orange** ; eyebrows **ALL-CAPS** lettre-espacées.
>   - Boutons **pills** arrondis, cartes radius 16–24px, ombres douces teintées navy (`rgba(0,40,130,…)`), rythme d'espacement 8pt.
>   - **Voix FR** avec jargon Product en anglais ; ton consultant senior ; **pas d'emoji** dans l'UI produit.
> - **Astuce** : invoquer la skill `wefiit-design` pour designer en expert de la marque. Tailwind = mapper les tokens du CSS sur le thème (`tailwind.config.ts`) pour rester cohérent.

---

## Phase 0 — Setup projet (~15 min)

### Étape 0.1 — Scaffold Next.js
- **Objectif** : initialiser le projet.
- **Actions** :
  - `npx create-next-app@latest` (App Router, TypeScript, Tailwind, ESLint).
  - Installer deps : `@anthropic-ai/sdk`, `@supabase/supabase-js`, `@supabase/ssr`.
- **Fichiers** : `package.json`, `tsconfig.json`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`.
- **Done when** : `npm run dev` sert une page vide sans erreur.

### Étape 0.2 — Variables d'environnement
- **Objectif** : centraliser les secrets.
- **Fichiers** : `.env.local` (+ `.env.example` commité, sans valeurs).
  ```
  ANTHROPIC_API_KEY=
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  ```
- **Done when** : `.env.local` est dans `.gitignore` et lisible côté serveur.

### Étape 0.3 — Intégrer le Design System WeFiiT
- **Objectif** : brancher la charte de marque avant toute UI.
- **Actions** :
  - Copier `Design System - WeFiiT 1/colors_and_type.css` → `app/wefiit.css` (ou `public/`), l'importer dans `app/layout.tsx`.
  - Copier `fonts/` → `public/fonts/` (vérifier les chemins `@font-face`).
  - Copier `assets/logo/`, `assets/icons/`, `assets/patterns/` → `public/wefiit/`.
  - Mapper les tokens (marine, électrique, orange, jade, radii, ombres) dans `tailwind.config.ts` pour les réutiliser en classes Tailwind.
  - Créer un mini-layout de base (header avec logo We.FiiT, fond blanc) réutilisé par toutes les pages.
- **Fichiers** : `app/wefiit.css`, `app/layout.tsx`, `tailwind.config.ts`, `components/AppShell.tsx`.
- **Done when** : une page de test affiche un `.wf-h1` en Geomanist avec le point orange et un bouton pill Marine, conformes à la charte.

### Étape 0.4 — Charger les sources froides
- **Objectif** : rendre le "cerveau froid" accessible au serveur.
- **Actions** : helper `lib/coldContext.ts` qui lit `guide-prepa-soutenance.md` et `critères-pitch.md` (via `fs` au build/runtime serveur) et les expose en string.
- **Fichiers** : `lib/coldContext.ts`.
- **Done when** : un test rapide log les 2 contenus côté serveur.

---

## Phase 1 — Auth WeFiiT (~15 min) — ✅ FAIT (SSO Azure + magic-link)

> **🔁 Historique de décision** :
> - *2026-07-10 (build)* : SSO Microsoft/Azure **reporté** faute de droits Azure ; la V1 démarre sur **magic-link e-mail Supabase**. Code de garde de route et callback écrits **agnostiques du provider** dès le départ.
> - *2026-07-10 (activation)* : droits Azure obtenus → **SSO Microsoft 365 / Azure activé** et testé OK en local (localhost:3000). C'est désormais le **chemin principal** ; le magic-link est **conservé en secours**. La bascule n'a touché que `app/login/page.tsx` (ajout du bouton) — `proxy.ts`, callback et clients Supabase inchangés, comme prévu.
>
> **⚠️ Note Next.js 16** : le fichier `middleware.ts` est renommé **`proxy.ts`** (fonction exportée `proxy`). C'est la convention utilisée ici.

### Étape 1.1 — Clients Supabase ✅
- **Objectif** : accès Supabase côté navigateur et serveur, clé service-role jamais exposée.
- **Actions** :
  - `lib/supabase/client.ts` (browser, `createBrowserClient`, anon key uniquement).
  - `lib/supabase/server.ts` (server, cookies via `@supabase/ssr`, `cookies()` **async** en Next 16).
- **Fichiers** : `lib/supabase/client.ts`, `lib/supabase/server.ts`.
- **Done when** : ✅ les deux clients compilent et lisent la session via cookies.

### Étape 1.2 — Flux login magic-link + garde de route ✅
- **Objectif** : protéger l'app, connexion réservée à `@wefiit.com`.
- **Actions** :
  - Page login : saisie e-mail → `signInWithOtp({ email, options: { emailRedirectTo } })`. Domaine `@wefiit.com` vérifié **avant l'envoi**.
  - `proxy.ts` (+ helper `lib/supabase/proxy.ts`) : rafraîchit la session et redirige les non-authentifiés vers `/login` (conserve la destination dans `?redirect=`). No-op propre si Supabase non configuré.
  - `app/auth/callback/route.ts` : établit la session (gère `?code=` PKCE **et** `?token_hash=`), **re-vérifie `@wefiit.com`** côté serveur (sinon `signOut` + retour login), protège contre les open-redirects.
  - Bonus : `app/auth/signout/route.ts` + e-mail connecté affiché dans `AppShell` (header).
- **Fichiers** : `app/login/page.tsx`, `proxy.ts`, `lib/supabase/proxy.ts`, `app/auth/callback/route.ts`, `app/auth/signout/route.ts`, `components/AppShell.tsx`.
- **Done when** : ✅ un compte `@wefiit.com` reçoit un lien, se connecte et atteint `/` ; une adresse externe est refusée avant envoi et re-bloquée au callback. (Garde de route testée : `/` et `/session/new` → `/login` ; `/login` → 200.)

### Étape 1.3 — SSO Microsoft / Azure — ✅ FAIT
- **Objectif** : SSO Entra ID comme chemin de connexion principal, magic-link conservé en secours.
- **Actions réalisées** :
  - App registration Azure **single-tenant WeFiiT**, redirect URI `<supabase-url>/auth/v1/callback`, client secret généré.
  - Provider **Azure** activé dans Supabase (client ID + secret + Tenant URL `https://login.microsoftonline.com/<tenant-id>`).
  - Page login : bouton "Se connecter avec Microsoft" → `signInWithOAuth({ provider: 'azure', options: { redirectTo, scopes: 'email' } })`, magic-link passé en secondaire.
- **Fichiers impactés** : `app/login/page.tsx` (uniquement) + config Supabase/Azure. `proxy.ts`, `lib/supabase/server.ts` et le callback inchangés (déjà agnostiques ; le callback gérait déjà `?code=` PKCE).
- **Done when** : ✅ un compte `@wefiit.com` se connecte via Microsoft (testé en local, localhost:3000) ; un compte externe est refusé par le tenant single-tenant.
- **Reste pour la prod** : ajouter le domaine Vercel dans Supabase → Authentication → URL Configuration (redirect URLs) lors du déploiement (Étape 5.3).

---

## Phase 2 — Feature 1 : Setup & Contexte (~15 min)

### Étape 2.1 — Formulaire de contexte de session
- **Objectif** : collecter les 2 documents d'entrée.
- **Actions** :
  - UI avec 2 zones : **Brief consultant** et **Spécification besoin client** (textarea paste ; upload PDF = bonus V2).
  - Bouton **"Démarrer"** désactivé tant que les 2 champs ne sont pas remplis.
- **Fichiers** : `app/session/new/page.tsx`, `components/ContextForm.tsx`.
- **Done when** : cliquer "Démarrer" crée une session en mémoire et route vers l'écran pitch.

### Étape 2.2 — Création de la session en base
- **Objectif** : persister le contexte dès le démarrage.
- **Actions** : API route `POST /api/session` → insert `sessions` (user_id, consultant_brief, client_spec, created_at).
- **Fichiers** : `app/api/session/route.ts`.
- **Done when** : une ligne apparaît dans `sessions` avec le bon `user_id`.

---

## Phase 3 — Feature 2 : Pitch + Q&R Vocal (~40 min) — cœur produit

### Étape 3.1 — Hook Web Speech (STT + TTS)
- **Objectif** : capter la voix et faire parler le client.
- **Actions** :
  - `useSpeechRecognition` : wrapper `SpeechRecognition` (fr-FR, `continuous`, `interimResults`) → renvoie transcript live + final.
  - `useSpeechSynthesis` : `speechSynthesis.speak()` pour lire les questions du client (voix fr).
  - Gérer la compat navigateur : dictée live sur Chrome/Edge/Safari ; sur les navigateurs sans STT (Firefox), afficher un encart neutre invitant à saisir/coller le texte (la zone de texte reste toujours disponible). Détection via `useSyncExternalStore` (SSR-safe, pas de mismatch d'hydratation).
- **Fichiers** : `hooks/useSpeechRecognition.ts`, `hooks/useSpeechSynthesis.ts`.
- **Done when** : parler affiche le transcript en direct ; un texte de test est lu à voix haute.

### Étape 3.2 — Écran Pitch (enregistrement)
- **Objectif** : capter le pitch initial.
- **Actions** :
  - UI : bouton micro (Démarrer/Arrêter), transcript live, timer (repère 10 min), bouton **"Valider mon pitch"**.
  - Au valider : envoyer `pitch_transcript` → sauvegarde + déclenche génération des questions.
- **Fichiers** : `app/session/[id]/pitch/page.tsx`, `components/MicRecorder.tsx`, `components/PitchTimer.tsx`.
- **Done when** : le pitch parlé est transcrit et persisté sur la session.

### Étape 3.3 — Génération des 3 questions (Claude)
- **Objectif** : le client sceptique interroge sur les gaps.
- **Actions** :
  - API route `POST /api/questions` : prompt système = sources froides + brief + spec client + pitch_transcript. Consigne : **3 questions polies mais sceptiques** ciblant les 5 critères de décision client non couverts, la transférabilité, et les objections prévisibles.
  - **Sortie structurée** via tool-use Claude : `[{ question_text, question_category }]` (`criteria_check` | `transference_test` | `objection`).
  - Insert dans `questions_generated`.
- **Fichiers** : `app/api/questions/route.ts`, `lib/prompts.ts`, `lib/anthropic.ts`.
- **Done when** : 3 questions pertinentes et ancrées au contexte reviennent en JSON et sont stockées.

### Étape 3.4 — Écran Q&R (turn-based)
- **Objectif** : dérouler les 3 questions une par une.
- **Actions** :
  - Pour chaque question : TTS lit la question → micro capte la réponse → transcript → "Suivant".
  - Stocker chaque `answer_transcript` (update `questions_generated`).
  - Indicateur de progression (Q1/3, Q2/3, Q3/3) → bouton **"Voir mon débrief"** au bout.
- **Fichiers** : `app/session/[id]/qa/page.tsx`, `components/QuestionTurn.tsx`.
- **Done when** : les 3 réponses vocales sont transcrites et persistées.

---

## Phase 4 — Feature 3 : Débrief + Pitch Recommandé (~30 min)

### Étape 4.1 — Génération du débrief (Claude)
- **Objectif** : feedback actionnable et bienveillant sur 3 axes.
- **Actions** :
  - API route `POST /api/debrief` : prompt = sources froides + brief + spec + pitch + Q&R.
  - Consigne : évaluer implicitement sur `critères-pitch.md`, débriefer **Fond / Forme / Storytelling**.
  - **Sortie structurée** : `{ strengths[], improvements[], recommendations[], debrief_full }` (2-3 items max par liste).
  - Persister `feedback_summary` (JSON) + `debrief_full`.
- **Fichiers** : `app/api/debrief/route.ts` (+ prompt dans `lib/prompts.ts`).
- **Done when** : le débrief JSON revient et est sauvegardé.

### Étape 4.2 — Génération du pitch recommandé (Claude)
- **Objectif** : version révisée section par section.
- **Actions** :
  - API route `POST /api/recommended-pitch` : produit `{ sections: [{ name, text_original, text_recommande, changements[], pourquoi }] }` + `full_text`.
  - Chaque changement référence un critère de décision client ou un enjeu.
  - Persister `pitch_recommended_json` + `pitch_recommended_full_text`.
- **Fichiers** : `app/api/recommended-pitch/route.ts`.
- **Done when** : le pitch révisé structuré est généré et stocké.

### Étape 4.3 — Écran Débrief
- **Objectif** : afficher le résultat + transcripts + export.
- **Actions** :
  - Sections : ✅ Points forts / ⚠️ À travailler / 🎯 Recommandations.
  - Transcripts consultables (pitch + Q&R, lecture seule, accordéon).
  - Pitch recommandé section par section (texte + bullets changements + pourquoi).
  - Boutons **Copier** / **Télécharger** (.md ou .txt) le pitch recommandé.
- **Fichiers** : `app/session/[id]/debrief/page.tsx`, `components/DebriefCard.tsx`, `components/RecommendedPitch.tsx`.
- **Done when** : un utilisateur voit son débrief complet et télécharge le pitch recommandé.

---

## Phase 5 — Persistance & finitions (~15 min)

### Étape 5.1 — Schéma Supabase
- **Objectif** : créer les tables + RLS.
- **Actions** :
  - Migration SQL : tables `sessions` et `questions_generated` (cf. SPEC).
  - **RLS** : chaque user ne lit/écrit que ses propres sessions (`auth.uid() = user_id`).
- **Fichiers** : `supabase/migrations/0001_init.sql`.
- **Done when** : les tables existent, RLS activée, un user ne voit que ses sessions.

### Étape 5.2 — État & navigation de session
- **Objectif** : parcours fluide new → pitch → qa → debrief.
- **Actions** : routing par `session.id`, garde-fous si étape précédente incomplète, écrans de chargement pendant les appels Claude.
- **Done when** : le parcours complet s'enchaîne sans état incohérent.

### Étape 5.3 — Déploiement Vercel
- **Objectif** : mettre en ligne.
- **Actions** : lier le repo GitHub, configurer les env vars sur Vercel, mettre à jour la redirect URL Azure/Supabase avec le domaine prod.
- **Done when** : la démo tourne sur l'URL Vercel avec login SSO fonctionnel.

---

## ✅ Definition of Done (V1)

Un WeFiiTer `@wefiit.com` peut, de bout en bout :
1. Se connecter via **SSO Microsoft 365 / Azure** (magic-link e-mail conservé en secours).
2. Coller son brief + la spec client et démarrer une session.
3. Pitcher à voix haute (transcrit en direct).
4. Répondre oralement à 3 questions d'un client sceptique.
5. Recevoir un débrief Fond/Forme/Storytelling + un pitch recommandé téléchargeable.
6. Retrouver sa session persistée en Supabase.

**+ Toute l'UI est conforme au Design System WeFiiT** (couleurs, Geomanist, composants pills/cartes, point orange, pas d'emoji).

---

## 🔭 Hors scope V1 (backlog V2)

- Upload/parsing PDF du brief et de la spec.
- Conversation vocale temps réel (interruptions, streaming).
- Transcription haute fidélité (Whisper / audio natif Claude).
- Paramétrabilité des questions (nombre, difficulté, catégories).
- Comparaison visuelle avant/après du pitch.
- Dashboard d'historique et de progression.
- Support vidéo (posture, regard).

---

## ⚠️ Risques & garde-fous

| Risque | Mitigation |
|--------|------------|
| Web Speech API (STT) absente sur Firefox | ✅ Traité : dictée live sur Chrome/Edge/Safari ; repli **saisie/collage** (zone de texte toujours présente) sur les autres navigateurs, avec message dédié. Bascule serveur (Whisper/Deepgram) possible plus tard sans refonte si Firefox devient un besoin. |
| Setup Azure SSO long | ✅ Traité : **SSO Azure activé** (Étape 1.3), testé OK en local. Magic-link Supabase conservé en secours (limite e-mail intégré ~3-4/h + risque spam → OK pour démo si besoin de repli). |
| Latence Claude (questions/débrief) | Écrans de chargement + `claude-sonnet-5` ; streaming en option. |
| Clé Claude exposée | Tous les appels Claude via API routes serveur, jamais côté client. |
| Accents fr / transcription imparfaite | Langue `fr-FR`, transcript éditable avant validation. |
| UI hors charte de marque | Design System WeFiiT branché dès l'étape 0.3 (`colors_and_type.css` + tokens Tailwind) ; skill `wefiit-design` en renfort. |
