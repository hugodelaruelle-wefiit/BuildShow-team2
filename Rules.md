# 🎤 Coach Soutenances

## Contexte

La préparation soutenance avec les PADs, c'est l'un des rituels les plus sacrés et les plus appréciés chez WeFiiT.

### Problème

Comment s'entraîner sans complexes avant sa prépa soutenance avec un PAD ?

### Solution

Un coach IA, boosté par les capacités d'analyse vocale des LLM, qui débriefe le fond et la forme du pitch avant la prépa soutenance.

## Audiences et Ressources

### Utilisateurs cibles

Les WeFiiTers qui préparent leur soutenance client (le pitch où le consultant se présente au client avant d'être staffé), seuls et à leur rythme, pour répéter et gagner en assurance avant la prépa avec le PAD.

### Ressources à disposition

La Mallette du Consultant contient déjà tout le référentiel du coach :
- Guide Prépa Soutenance
- Questions Types Soutenance
- Guide Construire son Analyse Produit

## Démarrage du Projet

### Concept de session

Une vraie discussion orale : on parle à voix haute, l'IA joue le client, écoute le pitch et répond en direct.

### Stack et approche

On construit un coach IA d'entraînement à la soutenance : on lui parle à voix haute, il joue le client sceptique, envoie des questions pièges et débriefe sur le fond, la posture et le storytelling.

**Stack :** Claude, GitHub, Supabase

**Méthode :** Avant de coder, propose un plan : le déroulé d'une session et les 3 fonctionnalités d'une V1 en 2h. Valider avec `/plan`, puis coder.

## Guide : Bien démarrer avec Claude

### Trois réflexes essentiels

- 🎯 **Soignez votre prompt** — contexte, objectif et contraintes. Plus c'est précis, meilleur est le résultat.
- 🧭 **Lancez `/plan` avant de coder** — Claude propose une stratégie que vous validez et challengez.
- ♻️ **Pensez à `/compact` quand ça s'allonge** — ça résume l'historique et garde Claude concentré.

### Itération

Et surtout : itérez sans crainte. Reformulez, corrigez — c'est en dialoguant qu'on avance.