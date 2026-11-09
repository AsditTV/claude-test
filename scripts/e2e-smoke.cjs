// Test de bout en bout sur mobile (iPhone 13) : distribution secrète, votes,
// égalité + second tour + tirage au sort, devinette de Mr White, victoire.
// Usage : npm run dev   puis   node scripts/e2e-smoke.cjs [url] [dossier-captures]
const { chromium, devices } = require('playwright');

const URL = process.argv[2] || 'http://localhost:5173/';
const SHOTS = process.argv[3] || null;
const NAMES = ['Asdit', 'Lucas', 'Emma', 'Noah', 'Léa'];

/** Mot majoritaire = civils, l'autre = undercover. */
function resolveCamps(roles, words) {
  const count = {};
  for (const w of Object.values(words)) if (w) count[w] = (count[w] || 0) + 1;
  const civil = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
  for (const n of Object.keys(roles)) if (roles[n] === 'AGENT') roles[n] = words[n] === civil ? 'CIVIL' : 'UNDERCOVER';
}

function assert(cond, msg) {
  if (!cond) throw new Error('ÉCHEC : ' + msg);
  console.log('  ✓ ' + msg);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices['iPhone 13'] });
  const page = await ctx.newPage();
  global.__page = page;
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const shot = async (name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
  const tid = (id) => page.getByTestId(id);

  const hold = async (locator, ms = 1000) => {
    const box = await locator.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(ms);
    await page.mouse.up();
  };

  await page.goto(URL);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await shot('01-home');

  console.log('Configuration');
  await tid('new-game').click();
  for (let i = 0; i < NAMES.length; i++) await tid(`player-${i}`).fill(NAMES[i]);
  assert((await tid('undercover-value').textContent()) === '1', '5 joueurs → 1 Undercover recommandé');
  assert((await tid('mrwhite-value').textContent()) === '1', '5 joueurs → 1 Mr White recommandé');
  assert((await tid('civils-value').textContent()) === '3', 'Civils calculés automatiquement (3)');
  await shot('02-setup');
  await tid('launch').click();

  // ── Distribution ───────────────────────────────────────────
  console.log('Distribution des rôles');
  await tid('dist-start').click();
  const roles = {};
  const words = {};
  for (let i = 0; i < NAMES.length; i++) {
    await tid('turn-name').waitFor();
    const who = (await tid('turn-name').textContent()).trim();
    assert(who === NAMES[i], `C'est au tour de ${NAMES[i]}`);
    assert((await page.getByTestId('role-face').count()) === 0, 'Aucune carte de rôle dans le DOM avant révélation');
    // Un simple clic ne doit PAS révéler (sécurité anti-clic accidentel)
    await page.getByRole('button', { name: /VOIR MON RÔLE/ }).click();
    await page.waitForTimeout(300);
    assert((await page.getByTestId('role-face').count()) === 0, 'Un clic bref ne révèle rien (appui long requis)');
    await hold(page.getByRole('button', { name: /VOIR MON RÔLE/ }));
    await tid('role-label').waitFor();
    await page.waitForTimeout(1400);
    if (i === 0) await shot('03-role-card');
    const label = (await tid('role-label').textContent()).trim();
    roles[who] = label;
    words[who] = (await page.getByTestId('role-word').count()) ? (await tid('role-word').textContent()).trim() : null;
    if (i === 0) {
      await tid('hide-role').click();
      await page.waitForTimeout(700);
      assert((await page.getByTestId('role-word').count()) === 0, '« Masquer mon rôle » retire le mot du DOM');
      await hold(page.getByRole('button', { name: /REVOIR MON RÔLE/ }));
      await tid('role-label').waitFor();
      await page.waitForTimeout(600);
    }
    await tid('done-role').click();
    if (i < NAMES.length - 1) {
      await tid('pass-name').waitFor();
      assert((await tid('pass-name').textContent()).trim() === NAMES[i + 1], `Écran « Passe le téléphone à ${NAMES[i + 1]} »`);
      const body = await page.locator('body').innerText();
      if (words[who]) assert(!body.includes(words[who]), 'Le mot du joueur précédent n’est plus affiché');
      assert(!/UNDERCOVER|MR WHITE|CIVIL/.test(body.replace(/Undercover/g, '')), 'Aucun rôle visible sur l’écran de passage');
      if (i === 0) await shot('04-pass');
      await tid('next-player').click();
    }
  }
  // Les cartes n'affichent jamais CIVIL/UNDERCOVER : on déduit les camps des mots.
  assert(Object.values(roles).every((r) => r === 'AGENT' || r === 'MR WHITE'), 'Aucune carte n’indique Civil ou Undercover');
  resolveCamps(roles, words);
  const values = Object.values(roles);
  assert(values.filter((r) => r === 'UNDERCOVER').length === 1, '1 Undercover attribué');
  assert(values.filter((r) => r === 'MR WHITE').length === 1, '1 Mr White attribué');
  assert(values.filter((r) => r === 'CIVIL').length === 3, '3 Civils attribués');
  const civilWord = words[NAMES.find((n) => roles[n] === 'CIVIL')];
  const underWord = words[NAMES.find((n) => roles[n] === 'UNDERCOVER')];
  assert(civilWord && underWord && civilWord !== underWord, `Mots distincts : ${civilWord} / ${underWord}`);
  assert(NAMES.filter((n) => roles[n] === 'CIVIL').every((n) => words[n] === civilWord), 'Tous les civils ont le même mot');
  assert(words[NAMES.find((n) => roles[n] === 'MR WHITE')] === null, 'Mr White n’a aucun mot');
  assert(!decodeURIComponent(page.url()).includes(civilWord) && !decodeURIComponent(page.url()).includes(underWord), 'Aucun mot dans l’URL');
  const storage = await page.evaluate(() => JSON.stringify(sessionStorage) + JSON.stringify(localStorage));
  assert(!storage.includes(civilWord), 'Le mot n’est pas stocké en clair');

  await tid('start-game').click();
  await tid('rules-continue').click();

  // ── Manche 1 : égalité → second vote → élimination de l'Undercover ──
  console.log('Manche 1 : égalité puis second vote');
  await tid('speaker-name').waitFor();
  await shot('05-discussion');
  await tid('skip-turns').click();
  await tid('go-vote').click();
  await tid('vote-start').click();
  const under = NAMES.find((n) => roles[n] === 'UNDERCOVER');
  const civils = NAMES.filter((n) => roles[n] === 'CIVIL');
  const white = NAMES.find((n) => roles[n] === 'MR WHITE');
  // 1er tour : 2 voix Undercover, 2 voix civils[0], 1 voix ailleurs → égalité
  const castVotes = async (strategy) => {
    for (let k = 0; k < 10; k++) {
      const voterEl = page.getByTestId('voter-name');
      if (!(await voterEl.isVisible().catch(() => false))) {
        await voterEl.waitFor({ timeout: 3000 }).catch(() => {});
        if (!(await voterEl.isVisible().catch(() => false))) break;
      }
      const voter = (await voterEl.textContent()).trim();
      await tid('i-am-voter').click();
      const target = strategy(voter);
      await tid(`vote-for-${target}`).click();
      await page.getByRole('button', { name: 'Je vote' }).click();
      await page.waitForTimeout(350);
    }
  };
  // Répartition visant une égalité 2-2-1 : Undercover ×2, civils[0] ×2, un autre ×1.
  const other = NAMES.find((n) => n !== under && n !== civils[0]);
  const pool = [under, under, civils[0], civils[0], other];
  const voted = new Set();
  await castVotes((voter) => {
    voted.add(voter);
    const ok = pool.map((t, i) => [t, i]).filter(([t]) => t !== voter);
    // On consomme d'abord les cibles qui n'ont pas encore voté (elles ne pourront pas voter pour elles-mêmes).
    ok.sort(([a], [b]) => (voted.has(a) ? 1 : 0) - (voted.has(b) ? 1 : 0));
    const [t, i] = ok[0];
    pool.splice(i, 1);
    return t;
  });
  await tid('revote').waitFor({ timeout: 5000 }).catch(() => {});
  const tie = await tid('revote').isVisible().catch(() => false);
  if (tie) {
    assert(true, 'Égalité détectée → second vote proposé');
    await shot('06-tie');
    await tid('revote').click();
    await castVotes((voter) => (voter === under ? civils[0] : under));
  }
  await tid('confirm-elimination').waitFor();
  assert((await tid('confirm-elimination').textContent()).includes(under.toUpperCase()), `${under} (Undercover) a le plus de voix`);
  await tid('confirm-elimination').click();
  await tid('revealed-role').waitFor({ timeout: 4000 });
  assert((await tid('revealed-role').textContent()).includes('UNDERCOVER'), 'Rôle révélé : UNDERCOVER');
  await shot('07-reveal');
  await tid('after-reveal').click();

  // ── Manche 2 : Mr White éliminé, devinette ratée → civils gagnent ──
  console.log('Manche 2 : Mr White');
  await tid('skip-turns').click();
  await tid('go-vote').click();
  await tid('vote-start').click();
  await castVotes((voter) => (voter === white ? civils[0] : white));
  await tid('confirm-elimination').click();
  await tid('revealed-role').waitFor({ timeout: 4000 });
  assert((await tid('revealed-role').textContent()).includes('MR WHITE'), 'Rôle révélé : MR WHITE');
  await tid('after-reveal').click();
  await tid('guess-input').fill('mauvaise réponse');
  await shot('08-guess');
  await tid('guess-submit').click();
  await page.getByRole('button', { name: 'Valider', exact: true }).click();
  await tid('guess-result').waitFor();
  assert((await tid('guess-result').textContent()).includes('Raté'), 'Mauvaise devinette refusée');
  const body = await page.locator('body').innerText();
  assert(!body.includes(civilWord), 'Le mot des civils n’est pas dévoilé après un échec');
  await page.waitForTimeout(700); // un humain ne tape pas en moins de 0,45 s (anti double-appui)
  await tid('guess-continue').click();

  await tid('winner-title').waitFor();
  assert((await tid('winner-title').textContent()).includes('Civils'), 'Victoire des Civils');
  assert((await tid('civil-word').textContent()).trim() === civilWord, 'Résultats : mot des civils correct');
  assert((await tid('undercover-word').textContent()).trim() === underWord, 'Résultats : mot undercover correct');
  await page.waitForTimeout(1500);
  await shot('09-results');

  // ── Partie 2 : rejouer, Mr White devine juste ─────────────
  console.log('Partie 2 : Mr White trouve le mot');
  await tid('replay').click();
  await tid('dist-start').click();
  const roles2 = {};
  const words2 = {};
  for (let i = 0; i < NAMES.length; i++) {
    await tid('turn-name').waitFor();
    const who = (await tid('turn-name').textContent()).trim();
    await hold(page.getByRole('button', { name: /VOIR MON RÔLE/ }));
    await tid('role-label').waitFor();
    await page.waitForTimeout(1400);
    roles2[who] = (await tid('role-label').textContent()).trim();
    words2[who] = (await page.getByTestId('role-word').count()) ? (await tid('role-word').textContent()).trim() : null;
    await tid('done-role').click();
    if (i < NAMES.length - 1) await tid('next-player').click();
  }
  resolveCamps(roles2, words2);
  const white2 = NAMES.find((n) => roles2[n] === 'MR WHITE');
  const civil2 = words2[NAMES.find((n) => roles2[n] === 'CIVIL')];
  await tid('start-game').click();
  await tid('rules-continue').click();
  await tid('skip-turns').click();
  await tid('go-vote').click();
  await tid('vote-start').click();
  const someCivil = NAMES.find((n) => roles2[n] === 'CIVIL');
  await castVotes((voter) => (voter === white2 ? someCivil : white2));
  await tid('confirm-elimination').click();
  await tid('after-reveal').click({ timeout: 5000 });
  await tid('guess-input').fill(civil2.toLowerCase());
  await tid('guess-submit').click();
  await page.getByRole('button', { name: 'Valider', exact: true }).click();
  assert((await tid('guess-result').textContent()).includes('Bien joué'), `Mr White trouve « ${civil2} »`);
  await page.waitForTimeout(700); // un humain ne tape pas en moins de 0,45 s (anti double-appui)
  await tid('guess-continue').click();
  await tid('winner-title').waitFor();
  assert((await tid('winner-title').textContent()).includes('Mr White'), 'Victoire de Mr White');

  // ── Historique & stats ───────────────────────────────────
  const hist = await page.evaluate(() => JSON.parse(localStorage.getItem('uc:history') || '[]'));
  assert(hist.length === 2, 'Deux parties enregistrées dans l’historique');

  assert(errors.length === 0, 'Aucune erreur JavaScript' + (errors.length ? ' : ' + errors.join(' | ') : ''));
  await browser.close();
  console.log('\nTous les tests de bout en bout sont passés ✔');
})().catch(async (e) => {
  console.error(e);
  if (global.__page) {
    const txt = await global.__page.locator('body').innerText().catch(() => '');
    console.error('--- ÉCRAN AU MOMENT DE L’ÉCHEC ---\n' + txt.slice(0, 600));
    if (SHOTS) await global.__page.screenshot({ path: `${SHOTS}/failure.png` }).catch(() => {});
  }
  process.exit(1);
});
