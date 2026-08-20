#!/usr/bin/env node
/*
  Certified Surfaces Checker
  Blocks commits that modify files listed in docs/WORKING_SURFACES.md or
  docs/GOLDEN_SURFACES.md unless --certified-override is passed.

  Usage:
    node scripts/check-certified-surfaces.js              # staged changes
    node scripts/check-certified-surfaces.js --certified-override
    node scripts/check-certified-surfaces.js --verbose
*/

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const args = new Set(process.argv.slice(2));
const OVERRIDE =
  args.has('--certified-override') || process.env.CERTIFIED_OVERRIDE === '1';
const VERBOSE = args.has('--verbose') || args.has('-v');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readIfExists(relPath) {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf8');
}

/** Extract backtick-quoted paths and bare filenames from markdown text. */
function extractPathsFromText(text) {
  const found = new Set();
  if (!text) return found;

  // `path/to/file.ext` or `file.js`
  for (const match of text.matchAll(/`([^`\n]+?)`/g)) {
    const raw = match[1].trim();
    if (isLikelyFilePath(raw)) found.add(normalizeEntry(raw));
  }

  // Freeze-files bullet: - app.js or - `app.js`
  for (const line of text.split('\n')) {
    const bullet = line.match(/^\s*[-*]\s+(`?)([^\s`]+)\1\s*$/);
    if (bullet && isLikelyFilePath(bullet[2])) {
      found.add(normalizeEntry(bullet[2]));
    }
  }

  return found;
}

function isLikelyFilePath(value) {
  if (!value || value.includes('→') || value.includes('(')) return false;
  if (value.startsWith('http')) return false;
  if (value.match(/^[A-Za-z0-9_-]+$/) && !value.includes('.')) return false;
  return value.includes('.') || value.includes('/') || value.includes('\\');
}

function normalizeEntry(entry) {
  return entry.replace(/\\/g, '/').replace(/^\.\//, '');
}

function parseMarkdownTables(content, sectionHints) {
  const paths = new Set();
  const lines = content.split('\n');
  let inSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      const title = heading[1].toLowerCase();
      inSection = sectionHints.some((hint) => title.includes(hint));
      continue;
    }
    if (!inSection) continue;
    if (!line.trim().startsWith('|')) continue;
    if (line.match(/^\|\s*[-|:]+\s*\|/)) continue; // separator row

    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 2) continue;

    // Skip placeholder / example rows
    if (cells.some((c) => c.includes('*(none yet)*'))) continue;
    if (cells[0]?.toLowerCase().includes('example flow')) continue;
    if (cells.some((c) => c.includes('path/to/file'))) continue;

    // File column is usually last or second column in kernel tables
    for (const cell of cells) {
      for (const p of extractPathsFromText(cell)) paths.add(p);
    }
  }

  return paths;
}

function loadCertifiedPaths() {
  const paths = new Map(); // normalized path -> { source, label }

  const working = readIfExists('docs/WORKING_SURFACES.md');
  if (working) {
    const sections = parseMarkdownTables(working, [
      'certified surfaces',
      'shared kernels',
    ]);
    for (const p of sections) {
      paths.set(p, { source: 'docs/WORKING_SURFACES.md', label: p });
    }
    // Do not scan prose outside tables — doc mentions checker script paths in backticks.
  }

  const golden = readIfExists('docs/GOLDEN_SURFACES.md');
  if (golden) {
    const sections = parseMarkdownTables(golden, [
      'frozen shared kernels',
      'freeze files',
    ]);
    for (const p of sections) {
      paths.set(p, { source: 'docs/GOLDEN_SURFACES.md', label: p });
    }
    // Freeze files list under heading
    const freezeMatch = golden.match(/## Freeze files[\s\S]*?(?=##|$)/i);
    if (freezeMatch) {
      for (const p of extractPathsFromText(freezeMatch[0])) {
        paths.set(p, { source: 'docs/GOLDEN_SURFACES.md (freeze)', label: p });
      }
    }
  }

  return paths;
}

function resolveToRepoFiles(certifiedEntries) {
  const resolved = new Map(); // repo-relative path -> meta

  for (const [entry, meta] of certifiedEntries) {
    const direct = path.join(ROOT, entry);
    if (fs.existsSync(direct)) {
      resolved.set(normalizeEntry(entry), { ...meta, entry });
      continue;
    }

    // Basename-only: find unique match in repo (skip heavy dirs)
    const base = path.basename(entry);
    const matches = findFilesByBasename(ROOT, base, 0, []);
    if (matches.length === 1) {
      resolved.set(normalizeEntry(matches[0]), { ...meta, entry, resolvedFrom: base });
    } else if (matches.length > 1) {
      // Keep ambiguous basename — match if staged path ends with entry
      resolved.set(normalizeEntry(entry), { ...meta, entry, ambiguous: true });
    } else {
      resolved.set(normalizeEntry(entry), { ...meta, entry, missing: true });
    }
  }

  return resolved;
}

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'bin', 'obj',
  '.venv', 'venv', '__pycache__', 'packages', '.turbo', 'coverage',
]);

function findFilesByBasename(dir, basename, depth, results) {
  if (depth > 8 || results.length > 2) return results;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (SKIP_DIRS.has(ent.name)) continue;
      findFilesByBasename(path.join(dir, ent.name), basename, depth + 1, results);
    } else if (ent.name === basename) {
      results.push(normalizeEntry(path.relative(ROOT, path.join(dir, ent.name))));
    }
  }
  return results;
}

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only', {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim();
    if (!out) return [];
    return out.split('\n').map(normalizeEntry).filter(Boolean);
  } catch {
    return [];
  }
}

function matchesCertified(stagedPath, certifiedMap) {
  const hits = [];
  for (const [certPath, meta] of certifiedMap) {
    if (stagedPath === certPath) {
      hits.push({ stagedPath, certPath, meta });
      continue;
    }
    if (stagedPath.endsWith('/' + certPath) || stagedPath.endsWith(certPath)) {
      hits.push({ stagedPath, certPath, meta });
      continue;
    }
    if (meta.ambiguous && path.basename(stagedPath) === path.basename(certPath)) {
      hits.push({ stagedPath, certPath, meta });
    }
  }
  return hits;
}

function runProtectedCodeCheckIfPresent() {
  const protectedScript = path.join(ROOT, 'scripts', 'check-protected-code.js');
  if (!fs.existsSync(protectedScript)) return true;
  if (OVERRIDE) {
    log('⚠️  Skipping check-protected-code.js (--certified-override)', 'yellow');
    return true;
  }
  try {
    execSync('node scripts/check-protected-code.js', { cwd: ROOT, stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  log('\n🛡️  Certified surfaces check\n', 'cyan');

  if (OVERRIDE) {
    log('⚠️  --certified-override: registry check bypassed.', 'yellow');
    log('   You must run the full test plan for any certified behavior you changed.\n', 'yellow');
    const protectedOk = runProtectedCodeCheckIfPresent();
    process.exit(protectedOk ? 0 : 1);
  }

  const certifiedEntries = loadCertifiedPaths();
  if (certifiedEntries.size === 0) {
    log('ℹ️  No certified paths in docs/WORKING_SURFACES.md or docs/GOLDEN_SURFACES.md', 'yellow');
    log('   Add certified files to docs/WORKING_SURFACES.md when something is confirmed working.\n', 'yellow');
    const protectedOk = runProtectedCodeCheckIfPresent();
    process.exit(protectedOk ? 0 : 1);
  }

  const certifiedMap = resolveToRepoFiles(certifiedEntries);
  if (VERBOSE) {
    log(`📋 Registered certified paths (${certifiedMap.size}):`, 'cyan');
    for (const [p, meta] of certifiedMap) {
      const flags = [meta.missing && 'missing', meta.ambiguous && 'ambiguous'].filter(Boolean).join(', ');
      log(`   - ${p}  [${meta.source}]${flags ? ` (${flags})` : ''}`, 'yellow');
    }
    log('');
  }

  const staged = getStagedFiles();
  if (staged.length === 0) {
    log('✅ No staged files.', 'green');
    const protectedOk = runProtectedCodeCheckIfPresent();
    process.exit(protectedOk ? 0 : 1);
  }

  const violations = [];
  for (const file of staged) {
    violations.push(...matchesCertified(file, certifiedMap));
  }

  if (violations.length === 0) {
    log('✅ No certified-surface violations in staged changes.', 'green');
    const protectedOk = runProtectedCodeCheckIfPresent();
    process.exit(protectedOk ? 0 : 1);
  }

  log('❌ CERTIFIED SURFACE VIOLATION\n', 'red');
  for (const v of violations) {
    log(`  Staged: ${v.stagedPath}`, 'red');
    log(`  Registry: ${v.certPath} (${v.meta.source})`, 'yellow');
    if (v.meta.label && v.meta.label !== v.certPath) {
      log(`  Surface: ${v.meta.label}`, 'yellow');
    }
    log('');
  }

  log('These files are listed as certified working behavior.', 'yellow');
  log('Behavioral changes require explicit acknowledgment and full testing.\n', 'yellow');
  log('If you intentionally changed certified code:', 'cyan');
  log('  1. Document the breaking-change checklist in docs/WORKING_SURFACES.md', 'cyan');
  log('  2. Run the full test plan and record results', 'cyan');
  log('  3. Commit with override:', 'cyan');
  log('     node scripts/check-certified-surfaces.js --certified-override', 'cyan');
  log('     git commit ...  (pre-commit will pass with override env)\n', 'cyan');
  log('Cosmetic-only changes should not touch logic; if this is a false positive,', 'yellow');
  log('narrow the certified file entry in docs/WORKING_SURFACES.md.\n', 'yellow');

  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { loadCertifiedPaths, resolveToRepoFiles, matchesCertified, getStagedFiles };
