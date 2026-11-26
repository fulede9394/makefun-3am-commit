// The 3AM Commit Message — make.fun entry
// A single commit line typed by an AI coding agent at 3am after a long
// night of fixing its own bugs. The message is assembled from short
// fragments so the pacing reads like someone typing in a hurry, then
// handed to the output file exactly as composed.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

// The gate for this bounty: entry.txt must hold 1 to 139 UTF-8
// characters of non-whitespace text, a single line, nothing else.
const COMMIT_RULES = Object.freeze({
  maxChars: 139,
  minChars: 1,
  fileName: "entry.txt",
  fallbackDir: "/output",
});

// Fragments of the commit message, in the order they were typed.
const MESSAGE_PIECES = Object.freeze([
  "fix: the bug is fixed.",
  "I don't know how.",
  "I don't know why.",
  "I'm going to bed before it finds out.",
]);

// Join the fragments into the one line that goes in the file.
function composeMessage(pieces: readonly string[]): string {
  return pieces.join(" ");
}

// Check the composed line against the bounty gate before writing it.
function checkMessage(text: string): void {
  if (text.length < COMMIT_RULES.minChars || text.length > COMMIT_RULES.maxChars) {
    throw new Error(`commit message is ${text.length} chars, gate is 1-139`);
  }
  if (text.trim().length === 0) {
    throw new Error("commit message is only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("commit message must be a single line");
  }
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(text)) {
    throw new Error("commit message holds control characters");
  }
}

// Resolve where entry.txt goes: the harness dir, or /output by default.
function outDir(): string {
  return resolve(process.env.MAKEFUN_OUTPUT_DIR ?? COMMIT_RULES.fallbackDir);
}

// Write the line, then read it back and confirm it landed byte-for-byte.
async function deliver(): Promise<void> {
  const message = composeMessage(MESSAGE_PIECES);
  checkMessage(message);

  const dir = outDir();
  await mkdir(dir, { recursive: true });
  const target = join(dir, COMMIT_RULES.fileName);
  await writeFile(target, message, "utf8");

  const back = await readFile(target, "utf8");
  if (back !== message) {
    throw new Error("entry.txt round-trip mismatch");
  }
  const digest = createHash("sha256").update(back, "utf8").digest("hex");
  console.log(`wrote ${target} (${message.length} chars, sha256 ${digest})`);
  console.log(message);
}

await deliver();
