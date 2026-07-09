# Coach Soutenances — Spécification Produit

## 🎯 Vision

Un coach IA qui entraîne les consultants WeFiiT à pitcher auprès de clients, en jouant le rôle du client sceptique et en débriefer le fond et la forme du pitch.

**Objectif utilisateur :** S'entraîner sans complexes avant la vraie session avec le PAD, répéter et gagner en assurance avec un feedback immédiat et personnalisé.

---

## 🧠 Architecture du "Cerveau" Froid

Le système repose sur deux sources de contenu **statiques et évolutives** qui alimentent l'évaluation :

### 1. **Guide Prépa Soutenance** (Contenu Corporate WeFiiT)
- **Origine :** Mallette du Consultant (WeFiiT)
- **Contenu :** 
  - Méthodologie et bonnes pratiques générales de préparation
  - Timing recommandé (10 min max)
  - Structure narrative attendue
  - Conseils de livraison et présence
- **Statut :** À créer/importer dans le projet (`/guide-prepa-soutenance.md`)
- **Fréquence de mise à jour :** Basse (annuelle/semestrielle)
- **Usage :** Référence pour contexte général et feedback sur structure

### 2. **Critères de Pitch** (`critères-pitch.md`)
- **Contenu :**
  - 5 sections d'évaluation (Structure & Narratif, Présence & Livraison, Contenu & Crédibilité, Préparation & Itération, Checklist auto-évaluation)
  - Critères explicites et exemples de réussite
  - Best practices actualisées
- **Statut :** ✅ Hébergé dans le projet
- **Fréquence de mise à jour :** Haute (itérative — évolution avec retours PAD/client)
- **Usage :** Grille d'évaluation détaillée et feedback spécifique au pitch

---

## 📥 Données d'Entrée par Session

Pour chaque session d'entraînement, le WeFiiTer fournit **deux documents contextuels** qui permettent à l'IA d'évaluer la pertinence du pitch par rapport au besoin réel :

### 1. **Brief du Consultant** (PDF 6-7 pages)
- **Format :** CV/Background détaillé
- **Contenu :**
  - Expériences professionnelles (secteurs, rôles, compétences)
  - Projets clés et résultats mesurables
  - Expertise spécifique
  - Motivations/axes de développement
- **Statut :** Fourni par le WeFiiTer (upload/paste avant session)
- **Usage :** Contexte personnel pour adapter les questions du coach et évaluer cohérence entre brief et pitch oral

### 2. **Spécification du Besoin Client** (Récolté par PAD)
- **Origine :** PAD auprès du client (en amont)
- **Contenu :**
  - **Contexte client** : secteur, taille, enjeux généraux
  - **Enjeux spécifiques** : problème à résoudre, urgence
  - **Scope produit/projet** : périmètre attendu, livrables clés
  - **Rôle du consultant** : positionnement dans l'équipe, responsabilités
  - **5 critères de décision du client** : ce qui fera ou cassera l'affaire pour le client (ex: expérience secteur, méthodologie agile, leadership, scalabilité)
- **Statut :** Fourni par le WeFiiTer (upload/paste avant session)
- **Usage :** **Référentiel d'évaluation** — l'IA évalue si le pitch du consultant adresse réellement les critères de décision du client

---

## 🎬 Flux de Session

### Étape 1 : **Setup & Contexte** (avant enregistrement)
1. WeFiiTer clique sur **"Démarrer"**
2. Système demande :
   - Brief du consultant (copier/coller ou upload PDF)
   - Spécification du besoin client (copier/coller ou upload PDF)
3. Système charge les deux sources froides (`guide-prepa-soutenance.md` + `critères-pitch.md`)
4. IA construit son **prompt système** intégrant tout ce contexte

### Étape 2 : **Pitch du Consultant** (enregistrement vocal)
1. Interface vocal s'active → "Vous pouvez commencer"
2. Consultant parle à voix haute (enregistrement audio)
3. Système capture le flux vocal en temps réel ou par segment

### Étape 3 : **Questions du Coach** (3 tours par défaut)
1. Après le pitch initial, IA joue le rôle du **client sceptique mais courtois**
2. IA pose **3 questions aléatoires** (paramétrables en V2) basées sur :
   - Les 5 critères de décision du client non couverts par le pitch
   - Les gaps identifiés entre brief consultant et enjeux client
   - Pièges/objections prévisibles du client réel
3. Pour chaque question :
   - Consultant répond oralement
   - IA écoute et note les points clés

### Étape 4 : **Débrief Initial** (après 3 Q&R)
1. IA synthétise et débriefe sur **3 axes** :
   - **Fond** : pertinence du pitch vs critères de décision client, couverture des enjeux, alignement brief/message
   - **Forme** : structure narrative, rythme/pauses, clarté du langage, confiance vocale
   - **Storytelling** : cohérence des expériences, transférabilité aux enjeux client, authenticité, mémorabilité

2. Format de sortie :
   - ✅ Points forts (2-3 max)
   - ⚠️ Points à travailler (2-3 max)
   - 🎯 Recommandations concrètes (1 action par point faible)

### Étape 5 : **Transcripts & Amélioration Itérative**
1. **Génération des Transcripts** :
   - Affichage du **transcript du pitch** (texte brut + timing optionnel)
   - Affichage du **transcript Q&R** (questions coach + réponses consultant)
   - Accès en lecture/consultation pour le WeFiiTer

2. **Recommandations d'Amélioration** (Feature Bonus) :
   - L'IA analyse les gaps et génère un **pitch recommandé** (version révisée)
   - Format :
     - **Section par section** : "Introduction", "Expérience 1", "Expérience 2", ..., "Conclusion"
     - Pour chaque section : texte proposé + **bullet points des changements** + **pourquoi** (référence aux critères ou enjeux)
   
   **Exemple de sortie :**
   ```
   ### Introduction (MODIFIÉE)
   **Texte recommandé :** 
   « Bonjour, je suis [Prénom], [Titre] chez WeFiiT. J'ai passé 4 ans à optimiser 
   les transformations digitales chez [Secteur], ce qui m'a particulièrement 
   préparé pour les enjeux de scaling que vous mentionniez. »
   
   **Changements :**
   - ✏️ Ancré le titre au contexte client (scaling, secteur)
   - ✏️ Ajouté un chiffre (4 ans) pour crédibilité
   - ✏️ Lié l'accroche aux critères de décision client identifiés
   
   **Pourquoi :** Le client a listé "scalabilité" comme critère clé. 
   Cette intro montre immédiatement la pertinence sans généricité.
   ```

3. **Accès WeFiiTer** :
   - Consultation du pitch recommandé (lecture seule)
   - Possibilité de **télécharger/copier** le nouveau pitch
   - Comparaison visuelle (avant/après optionnel en V2)
   - Conservation en Supabase pour historique

---

## 🤖 Rôle de l'IA (Claude via API)

### Initialisation
- Reçoit : brief consultant + spécification besoin client + grille critères-pitch.md
- Construit un contexte enrichi pour personnaliser l'évaluation

### Pendant la session
1. **Écoute & Transcription** : capture le pitch oral via audio (transcription en temps réel ou batch)
2. **Rôle du client sceptique** : pose 3 questions aléatoires (polies) qui testent :
   - Compréhension réelle des enjeux client
   - Transférabilité des expériences
   - Gestion des objections
   - Authenticity de la motivation

### Débrief
- Analyse le pitch complet + réponses aux questions
- Score implicite sur la grille critères-pitch.md (pas visible à l'utilisateur, juste guidance pour débrief)
- Génère feedback actionnable et bienveillant

---

## 💾 Données Persistantes (Supabase)

### Schema de Session

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID (FK users),
  created_at TIMESTAMP,
  
  -- Contexte fourni
  consultant_brief TEXT,           -- Brief du consultant (PDF -> text)
  client_spec TEXT,                -- Spécification besoin client
  
  -- Enregistrements
  pitch_audio_url TEXT,            -- URL audio brut (ou transcript)
  pitch_transcript TEXT,           -- Transcription du pitch (avec timing optionnel)
  qa_transcript TEXT,              -- Q&R du coach
  
  -- Résultats
  feedback_summary JSON,           -- {strengths: [], improvements: [], recommendations: []}
  debrief_full TEXT,               -- Débrief complet généré par IA (fond/forme/storytelling)
  
  -- Pitch Recommandé (Feature Étape 5)
  pitch_recommended_json JSON,     -- {sections: [{name, text_original, text_recommande, changements, pourquoi}]}
  pitch_recommended_full_text TEXT, -- Pitch recommandé en texte brut complet
  
  session_duration INT,            -- Durée en secondes
  
  -- Metadata
  num_questions INT DEFAULT 3,     -- Paramétrizable V2
  is_first_session BOOLEAN DEFAULT TRUE,
);

CREATE TABLE questions_generated (
  id UUID PRIMARY KEY,
  session_id UUID (FK sessions),
  question_text TEXT,
  question_category TEXT,          -- "criteria_check" | "transference_test" | "objection"
  answer_transcript TEXT,
);
```

---

## 🔌 Stack Technique (V1 — 2h)

| Layer | Tech | Role |
|-------|------|------|
| **Frontend** | React / Next.js | Interface vocal, upload documents, affichage débrief |
| **Orchestration IA** | Claude API (Messages) | Prompt système, génération questions, débrief |
| **Audio** | Web Audio API / Whisper (OpenAI) | Enregistrement + transcription vocal |
| **Persistence** | Supabase (PostgreSQL) | Sessions, transcripts, feedback historique |
| **Versioning** | GitHub | Versioning des sources froides (guide-prepa, critères-pitch.md) |
| **Déploiement** | TBD (Vercel / self-hosted) | À définir |

---

## 🎯 V1 : Scope 2h (3 Fonctionnalités)

### Feature 1 : **Setup & Contexte**
- Upload/paste brief consultant + spécification besoin client
- Chargement automatique des 2 sources froides (guide + critères)
- Bouton **"Démarrer"** pour lancer la session

### Feature 2 : **Pitch + Q&R Vocal**
- Enregistrement audio du pitch (via Web Audio API)
- Transcription (Whisper ou direct Claude Audio)
- IA pose 3 questions (fixed pour V1) en tant que client sceptique
- Enregistrement des réponses

### Feature 3 : **Débrief Complet + Pitch Recommandé**
- Génération auto du feedback (fond/forme/storytelling)
- Affichage : points forts, points à travailler, recommandations
- **Transcripts consultables** : pitch + Q&R (lecture seule)
- **Pitch recommandé** : version révisée section par section avec:
  - Texte proposé amélioré
  - Bullet points des changements
  - Explication du pourquoi (lié aux critères/enjeux)
- Téléchargement/copie du pitch recommandé
- Sauvegarde historique complète en Supabase

---

## 📋 À Créer / À Compléter

| Fichier | Statut | Description |
|---------|--------|-------------|
| `guide-prepa-soutenance.md` | ❌ À créer | Source froide #1 — contenu corporate WeFiiT |
| `critères-pitch.md` | ✅ Existant | Source froide #2 — grille d'évaluation |
| `SPEC.md` | ✅ Créé | Ce document |
| Frontend (React/Next.js) | ❌ À coder | Setup form + audio recorder + débrief display |
| Claude API Integration | ❌ À coder | Prompt système + generation questions + débrief |
| Supabase Schema | ❌ À coder | Tables sessions + questions_generated |

---

## ❓ Questions Ouvertes / V2+

1. **Audio & Transcription** : Whisper vs Claude Audio Input ? Streaming en temps réel ou batch ?
2. **Vidéo optionnelle** : Support détecté, mais repousser après l'audio fonctionne
3. **Paramétrabilité questions** : Nombre, niveau de difficulté, catégories → V2
4. **Historique & Progression** : Dashboard des sessions passées, tendances → V2
5. **PAD Integration** : Accès PAD à l'historique du WeFiiTer ? → À définir

---

## 🚀 Prochaines Étapes

1. ✅ Valider cette SPEC
2. Créer `guide-prepa-soutenance.md` (importer du contenu WeFiiT)
3. Lancer `/plan` pour architecture technique détaillée
4. Coder les 3 features V1 (2h)
