#!/usr/bin/env node
/*
  Install pre-commit hook for certified-surface checks.
  Run: node scripts/setup-certified-hooks.js
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const hooksDir = path.join(ROOT, '.git', 'hooks');
const preCommitDest = path.join(hooksDir, 'pre-commit');
const hookSource = path.join(ROOT, '.github', 'hooks', 'pre-commit');

const HOOK_BODY = `#!/bin/sh
# Certified surfaces + optional @protected check (installed by setup-certified-hooks.js)

if [ -f scripts/check-certified-surfaces.js ]; then
  node scripts/check-certified-surfaces.js || exit 1
fi

exit 0
`;

console.log('Setting up certified-surface git hooks...\n');

if (!fs.existsSync(path.join(ROOT, '.git'))) {
  console.error('Not a git repository:', ROOT);
  process.exit(1);
}

if (!fs.existsSync(hooksDir)) {
  fs.mkdirSync(hooksDir, { recursive: true });
}

// Prefer committed hook source if present
let hookContent = HOOK_BODY;
if (fs.existsSync(hookSource)) {
  hookContent = fs.readFileSync(hookSource, 'utf8');
}

// If existing hook mentions check-protected-code but not certified, merge
if (fs.existsSync(preCommitDest)) {
  const existing = fs.readFileSync(preCommitDest, 'utf8');
  const hasProtected = existing.includes('check-protected-code.js');
  const hasCertified = existing.includes('check-certified-surfaces.js');
  if (hasProtected && !hasCertified) {
    hookContent = existing.trimEnd() + `

# Certified surfaces registry
if [ -f scripts/check-certified-surfaces.js ]; then
  node scripts/check-certified-surfaces.js || exit 1
fi
`;
  } else if (hasCertified) {
    console.log('pre-commit hook already includes certified check.');
    process.exit(0);
  }
}

fs.writeFileSync(preCommitDest, hookContent, { mode: 0o755 });
console.log('Installed .git/hooks/pre-commit');
console.log('');
console.log('The hook will:');
console.log('  - Block commits that modify files in docs/WORKING_SURFACES.md or docs/GOLDEN_SURFACES.md');
console.log('  - Chain check-protected-code.js when present (fbswagtix)');
console.log('  - Allow override: CERTIFIED_OVERRIDE=1 git commit ...');
console.log('    or: node scripts/check-certified-surfaces.js --certified-override');
console.log('');
