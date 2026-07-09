import { promises as fs } from "fs";
import path from "path";

/**
 * Cold context — the coach's static "brain".
 *
 * Reads the two source-of-truth markdown files shipped with the repo and
 * exposes them as strings to be injected into the Claude system prompt.
 * Server-side only (uses `fs`); read the files lazily and cache the result.
 */

export interface ColdContext {
  guidePrepaSoutenance: string;
  criteresPitch: string;
}

const COLD_FILES = {
  guidePrepaSoutenance: "guide-prepa-soutenance.md",
  criteresPitch: "critères-pitch.md",
} as const;

let cache: ColdContext | null = null;

async function readRepoFile(fileName: string): Promise<string> {
  const filePath = path.join(process.cwd(), fileName);
  return fs.readFile(filePath, "utf-8");
}

export async function getColdContext(): Promise<ColdContext> {
  if (cache) return cache;

  const [guidePrepaSoutenance, criteresPitch] = await Promise.all([
    readRepoFile(COLD_FILES.guidePrepaSoutenance),
    readRepoFile(COLD_FILES.criteresPitch),
  ]);

  cache = { guidePrepaSoutenance, criteresPitch };
  return cache;
}
