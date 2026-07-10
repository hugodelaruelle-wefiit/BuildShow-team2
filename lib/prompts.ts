import type { ColdContext } from "@/lib/coldContext";

/**
 * Prompt builders for the coach's Claude calls.
 *
 * The cold context (guide + criteria) is stable across sessions and goes in the
 * system prompt; the case-specific brief / spec / pitch go in the user turn.
 */

export const QUESTION_CATEGORIES = [
  "criteria_check",
  "transference_test",
  "objection",
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

export function buildQuestionsSystem(cold: ColdContext): string {
  return `Tu joues le rôle d'un **client** lors d'une soutenance commerciale WeFiiT : un consultant se présente à toi avant d'être staffé sur ta mission. Tu es courtois mais **sceptique et exigeant** — tu cherches à vérifier que ce consultant est réellement le bon choix pour ton besoin.

Tu t'appuies sur deux référentiels internes WeFiiT pour savoir ce qui fait une soutenance réussie et ce qu'un bon client vérifie.

=== GUIDE PRÉPA SOUTENANCE ===
${cold.guidePrepaSoutenance}

=== CRITÈRES D'UNE SOUTENANCE RÉUSSIE ===
${cold.criteresPitch}

Consignes pour tes questions :
- Pose exactement **3 questions**, polies mais sceptiques, comme un vrai client en soutenance.
- Ancre chaque question dans le contexte fourni (le brief consultant, la spécification de ton besoin, et le pitch entendu) — jamais générique.
- Cible en priorité : les **critères de décision client non couverts** par le pitch, la **transférabilité** des expériences à ton contexte, et les **objections prévisibles**.
- Une seule idée par question. Ton de consultant senior, français avec le jargon Product en anglais si besoin. Pas d'emoji.
- Catégorise chaque question :
  - "criteria_check" : vérifie un critère de décision attendu mais non/mal couvert.
  - "transference_test" : teste si une expérience évoquée s'applique vraiment à mon contexte.
  - "objection" : soulève un doute ou une réserve prévisible.

Renvoie les 3 questions via l'outil "record_questions".`;
}

export function buildQuestionsUser(input: {
  consultantBrief: string;
  clientSpec: string;
  pitchTranscript: string;
}): string {
  return `Voici le contexte de cette soutenance.

=== BRIEF CONSULTANT (contexte mission côté WeFiiT) ===
${input.consultantBrief}

=== SPÉCIFICATION DE MON BESOIN (côté client) ===
${input.clientSpec}

=== PITCH QUE JE VIENS D'ENTENDRE (transcription) ===
${input.pitchTranscript}

Formule maintenant tes 3 questions de client sceptique.`;
}

// ---------------------------------------------------------------------------
// Débrief + pitch recommandé (Feature 3)
// ---------------------------------------------------------------------------

export interface AnsweredQuestion {
  question_text: string;
  question_category: QuestionCategory;
  answer_transcript: string | null;
}

export interface DebriefResult {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  debrief_full: string;
}

export interface RecommendedPitchSection {
  name: string;
  text_original: string;
  text_recommande: string;
  changements: string[];
  pourquoi: string;
}

export interface RecommendedPitchResult {
  sections: RecommendedPitchSection[];
  full_text: string;
}

function formatQA(qa: AnsweredQuestion[]): string {
  if (qa.length === 0) return "(aucune réponse enregistrée)";
  return qa
    .map(
      (q, i) =>
        `Q${i + 1} (${q.question_category}) : ${q.question_text}\nRéponse : ${
          q.answer_transcript?.trim() || "(pas de réponse)"
        }`,
    )
    .join("\n\n");
}

function coachContext(cold: ColdContext): string {
  return `Tu es un **coach senior WeFiiT** qui débriefe une soutenance client (le consultant se présente au client avant d'être staffé). Ton retour est **exigeant mais bienveillant**, concret et actionnable. Ton de consultant senior, français avec le jargon Product en anglais si besoin. Pas d'emoji.

Tu t'appuies sur deux référentiels internes WeFiiT.

=== GUIDE PRÉPA SOUTENANCE ===
${cold.guidePrepaSoutenance}

=== CRITÈRES D'UNE SOUTENANCE RÉUSSIE ===
${cold.criteresPitch}`;
}

export function buildDebriefSystem(cold: ColdContext): string {
  return `${coachContext(cold)}

Évalue implicitement la soutenance à l'aune des critères ci-dessus, sur trois axes : **Fond** (pertinence, structure narrative, transférabilité, couverture des critères de décision client), **Forme** (clarté, concision, langage, présence) et **Storytelling** (accroche, fil rouge, motivations, mémorabilité).

Renvoie ton débrief via l'outil "record_debrief" :
- "strengths", "improvements", "recommendations" : 2 à 3 items maximum chacun, formulés en une phrase claire et actionnable.
- "debrief_full" : un débrief rédigé structuré par les trois axes (Fond / Forme / Storytelling), ancré dans ce qui a été dit ; ni complaisant ni décourageant.`;
}

export function buildDebriefUser(input: {
  consultantBrief: string;
  clientSpec: string;
  pitchTranscript: string;
  qa: AnsweredQuestion[];
}): string {
  return `Voici la soutenance à débriefer.

=== BRIEF CONSULTANT ===
${input.consultantBrief}

=== SPÉCIFICATION BESOIN CLIENT ===
${input.clientSpec}

=== PITCH (transcription) ===
${input.pitchTranscript}

=== QUESTIONS DU CLIENT & RÉPONSES ===
${formatQA(input.qa)}

Produis maintenant le débrief.`;
}

export function buildRecommendedPitchSystem(cold: ColdContext): string {
  return `${coachContext(cold)}

Tu réécris le pitch du consultant, **section par section**, pour le rendre plus convaincant vis-à-vis de ce client précis. Tu ne réinventes pas la personne : tu réorganises, précises et muscles ce qui existe, en comblant les manques révélés par les questions du client.

Renvoie ta proposition via l'outil "record_recommended_pitch" :
- "sections" : les sections logiques du pitch (ex : Accroche, Expérience 1, …, Motivations). Pour chacune :
  - "name" : le nom de la section.
  - "text_original" : ce que le consultant a dit (résumé fidèle ; "(absent)" si la section manquait).
  - "text_recommande" : la version recommandée, prête à être dite à l'oral.
  - "changements" : 1 à 3 changements clés, chacun rattaché à un **critère de décision client** ou à un **enjeu** précis.
  - "pourquoi" : en une phrase, pourquoi ça rend le pitch plus convaincant pour ce client.
- "full_text" : le pitch recommandé complet, d'un seul tenant, prêt à répéter à voix haute.`;
}

export function buildRecommendedPitchUser(input: {
  consultantBrief: string;
  clientSpec: string;
  pitchTranscript: string;
  qa: AnsweredQuestion[];
}): string {
  return `Voici la soutenance à améliorer.

=== BRIEF CONSULTANT ===
${input.consultantBrief}

=== SPÉCIFICATION BESOIN CLIENT ===
${input.clientSpec}

=== PITCH ACTUEL (transcription) ===
${input.pitchTranscript}

=== QUESTIONS DU CLIENT & RÉPONSES ===
${formatQA(input.qa)}

Produis maintenant le pitch recommandé, section par section.`;
}
