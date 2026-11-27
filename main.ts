// Package the game and its screenshots into a make.fun submission dossier.
// Run locally with: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const sourceDir = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

mkdirSync(outputDir, { recursive: true });
for (const name of ['game', 'screenshots']) {
  cpSync(join(sourceDir, name), join(outputDir, name), { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

function countCopiedFiles(name: string): number {
  return readdirSync(join(sourceDir, name), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile()).length;
}

console.log(`Wrote dossier.json (${dossier.byteLength} bytes) with ${countCopiedFiles('game')} game files and ${countCopiedFiles('screenshots')} screenshots.`);

// These limits match the competition gate.
