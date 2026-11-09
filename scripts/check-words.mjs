// Vérifie la banque de mots : node scripts/check-words.mjs
import fs from 'node:fs';
const bank = JSON.parse(fs.readFileSync(new URL('../src/data/words.json', import.meta.url), 'utf8'));
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
let errors = 0;
const ids = new Set();
const words = new Set();
let pairs = 0;
const levels = { 1: 0, 2: 0, 3: 0 };
for (const c of bank.categories) {
  if (!c.id || ids.has(c.id)) { console.error('id manquant/dupliqué', c.id); errors++; }
  ids.add(c.id);
  const seen = new Set();
  for (const p of c.pairs) {
    const [a, b, lvl] = p;
    if (typeof a !== 'string' || typeof b !== 'string' || ![1, 2, 3].includes(lvl)) { console.error('paire invalide', c.id, p); errors++; continue; }
    if (norm(a) === norm(b)) { console.error('mots identiques', c.id, p); errors++; }
    const k = [norm(a), norm(b)].sort().join('|');
    if (seen.has(k)) { console.error('doublon', c.id, p); errors++; }
    seen.add(k);
    words.add(a); words.add(b); pairs++; levels[lvl]++;
  }
  console.log(`${c.emoji}  ${c.name.padEnd(26)} ${String(c.pairs.length).padStart(4)} paires`);
}
console.log(`\n${bank.categories.length} catégories · ${pairs} paires · ${words.size} mots distincts`);
console.log(`Facile: ${levels[1]} · Normal: ${levels[2]} · Difficile: ${levels[3]}`);
if (errors) { console.error(`${errors} erreur(s)`); process.exit(1); }
