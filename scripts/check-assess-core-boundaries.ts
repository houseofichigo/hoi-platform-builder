#!/usr/bin/env bun
/**
 * Assess core boundary guard.
 *
 * Core Course 1 modules should not import applied-track source files directly.
 * The temporary adapter at src/lib/assess/content/course1.ts owns the bridge
 * while v6 generic assignments are rewritten module by module.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const IMPORT_RE = /\bimport\s+(?:type\s+)?[^"';]*?\bfrom\s*["']([^"']+)["']/g;
const SIDE_EFFECT_RE = /\bimport\s*["']([^"']+)["']/g;
const APPLIED_TRACK_IMPORT = "@/lib/worked-examples/invoice-ocr";
const OCR_CONTENT_SYMBOL_RE = /\bM\d\d_OCR_CONTENT\b/;

const CORE_PATHS = [
  "src/components/assess",
  "src/routes/app.$workspaceSlug.assess.$moduleId.gate.tsx",
  "src/routes/app.$workspaceSlug.assess.$moduleId.work.tsx",
  "src/routes/app.$workspaceSlug.assess.$moduleId.index.tsx",
  "src/routes/app.$workspaceSlug.assess.$moduleId.study.tsx",
  "src/routes/app.$workspaceSlug.assess.assignments.tsx",
];

function walk(path: string, out: string[] = []): string[] {
  if (!existsSync(path)) return out;
  const stat = statSync(path);
  if (stat.isFile()) {
    if (/\.(ts|tsx)$/.test(path)) out.push(path);
    return out;
  }
  for (const entry of readdirSync(path)) {
    walk(join(path, entry), out);
  }
  return out;
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1");
}

function importsFromAppliedTrack(src: string): string[] {
  const found = new Set<string>();
  for (const re of [IMPORT_RE, SIDE_EFFECT_RE]) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(src)) !== null) {
      if (match[1].startsWith(APPLIED_TRACK_IMPORT)) found.add(match[1]);
    }
  }
  return [...found];
}

const files = [...new Set(CORE_PATHS.flatMap((path) => walk(join(ROOT, path))))];
const violations: string[] = [];

for (const file of files) {
  const source = stripComments(readFileSync(file, "utf8"));
  const rel = relative(ROOT, file);
  for (const specifier of importsFromAppliedTrack(source)) {
    violations.push(`${rel} imports applied-track content directly: ${specifier}`);
  }
  if (OCR_CONTENT_SYMBOL_RE.test(source)) {
    violations.push(`${rel} references an OCR content constant directly`);
  }
}

if (violations.length > 0) {
  console.error("✗ assess core boundary check failed\n");
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}

console.log(`✓ assess core boundary check passed (${files.length} core files scanned)`);
