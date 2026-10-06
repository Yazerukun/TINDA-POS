import fs from 'node:fs';
import path from 'node:path';

const AGENCY_ROOT = 'D:/agency-agents';
const SKILLS_DIR = 'D:/TINDA-POS-Desktop/.agents/skills';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseMarkdownFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;

  const rawHeader = match[1];
  const body = match[2];

  let name = '';
  let description = '';

  const nameMatch = rawHeader.match(/^name:\s*(.+)$/m);
  if (nameMatch) {
    name = nameMatch[1].trim().replace(/^['"]|['"]$/g, '');
  }

  const descMatch = rawHeader.match(/^description:\s*([^\n\r]+(?:\n\s+[^\n\r]+)*)/m);
  if (descMatch) {
    description = descMatch[1]
      .split(/\r?\n/)
      .map(s => s.trim())
      .join(' ')
      .replace(/^['"]|['"]$/g, '');
  }

  return { name, description, body };
}

// Curated core specialists specifically optimized for TINDA POS Desktop (Electron + SQLite + POS):
const CURATED_SLUGS = new Set([
  'agency-desktop-app-engineer',
  'agency-frontend-developer',
  'agency-database-optimizer',
  'agency-database-reliability-engineer',
  'agency-payments-billing-engineer',
  'agency-code-reviewer',
  'agency-software-architect',
  'agency-minimal-change-engineer',
  'agency-devops-automator',
  'agency-reality-checker',
  'agency-performance-benchmarker',
  'agency-test-automation-engineer',
  'agency-security-auditor',
  'agency-ui-designer',
  'agency-incident-response-commander'
]);

export function syncSkills(mode = 'curated') {
  if (!fs.existsSync(AGENCY_ROOT)) {
    console.error(`Error: Agency root not found at ${AGENCY_ROOT}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(AGENCY_ROOT, { withFileTypes: true });
  const divisions = entries
    .filter(e => e.isDirectory() && !['.git', '.github', 'examples', 'scripts', 'integrations', 'node_modules'].includes(e.name))
    .map(e => e.name);

  let installedCount = 0;
  const installedList = [];

  for (const division of divisions) {
    const divPath = path.join(AGENCY_ROOT, division);
    const files = fs.readdirSync(divPath).filter(f => f.endsWith('.md'));

    for (const file of files) {
      const filePath = path.join(divPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = parseMarkdownFrontmatter(content);
      if (!parsed || !parsed.name) continue;

      const slug = `agency-${slugify(parsed.name)}`;

      if (mode === 'curated' && !CURATED_SLUGS.has(slug)) {
        continue;
      }

      const targetDir = path.join(SKILLS_DIR, slug);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const targetFile = path.join(targetDir, 'SKILL.md');
      const skillContent = `---
name: "${slug}"
description: "${parsed.description.replace(/"/g, '\\"')}"
---

${parsed.body.trim()}
`;

      fs.writeFileSync(targetFile, skillContent, 'utf8');
      installedCount++;
      installedList.push({ slug, division, desc: parsed.description });
    }
  }

  console.log(`\nSuccessfully installed ${installedCount} skills into ${SKILLS_DIR} (Mode: ${mode})`);
  for (const item of installedList) {
    console.log(` - [${item.division}] ${item.slug}: ${item.desc.slice(0, 75)}...`);
  }
}

const args = process.argv.slice(2);
const modeArg = args.includes('--all') ? 'all' : 'curated';
syncSkills(modeArg);
