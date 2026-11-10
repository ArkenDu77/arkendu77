const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../calc.js');

const base = { bail: 'vide', loyer: 800, depot: 800, cles: '2026-06-15', edl: 'conforme', adresse: true };

test('addMonths borne la fin de mois', () => {
  assert.equal(C.iso(C.addMonths(C.parseDate('2026-01-31'), 1)), '2026-02-28');
  assert.equal(C.iso(C.addMonths(C.parseDate('2026-12-15'), 2)), '2027-02-15');
});

test('dans le délai : rien de majoré', () => {
  const r = C.compute({ ...base, today: '2026-07-15' });
  assert.equal(r.dateLimite, '2026-07-15');
  assert.equal(r.moisRetard, 0);
  assert.equal(r.total, 800);
  assert.equal(r.enRetard, false);
});

test('un jour de retard = un mois commencé', () => {
  const r = C.compute({ ...base, today: '2026-07-16' });
  assert.equal(r.moisRetard, 1);
  assert.equal(r.majoration, 80);
  assert.equal(r.total, 880);
  assert.equal(r.prochaineEcheance, '2026-08-15');
});

test('pile un mois après la limite = toujours 1 mois, le lendemain 2', () => {
  assert.equal(C.compute({ ...base, today: '2026-08-15' }).moisRetard, 1);
  assert.equal(C.compute({ ...base, today: '2026-08-16' }).moisRetard, 2);
});

test('état des lieux non conforme : délai de 2 mois', () => {
  const r = C.compute({ ...base, edl: 'differences', today: '2026-11-10' });
  assert.equal(r.dateLimite, '2026-08-15');
  assert.equal(r.moisRetard, 3);
  assert.equal(r.majoration, 240);
});

test('restitution partielle et retenues acceptées', () => {
  const r = C.compute({ ...base, today: '2026-09-01', restitue: 300, dateRestitution: '2026-08-01', retenuesAcceptees: 100 });
  assert.equal(r.principal, 400);
  assert.equal(r.moisRetard, 2);
  assert.equal(r.total, 560);
});

test('tout remboursé mais en retard : la majoration reste due', () => {
  const r = C.compute({ ...base, today: '2026-11-10', restitue: 800, dateRestitution: '2026-09-20' });
  assert.equal(r.principal, 0);
  assert.equal(r.moisRetard, 3);
  assert.equal(r.total, 240);
});

test('adresse non communiquée : pas de majoration', () => {
  const r = C.compute({ ...base, today: '2026-11-10', adresse: false });
  assert.equal(r.majoration, 0);
  assert.equal(r.total, 800);
  assert.ok(r.alertes.length > 0);
});

test('dépôt au-dessus du plafond et saisies invalides', () => {
  assert.equal(C.compute({ ...base, depot: 1600, today: '2026-07-01' }).depotExcedentaire, 800);
  assert.equal(C.compute({ ...base, bail: 'meuble', depot: 1600, today: '2026-07-01' }).depotExcedentaire, 0);
  assert.equal(C.compute({ ...base, loyer: 0 }).ok, false);
  assert.equal(C.compute({ ...base, bail: 'autre' }).ok, false);
  assert.equal(C.compute({ ...base, cles: '2030-01-01', today: '2026-07-01' }).ok, false);
});

test('saisie avec virgule et espaces', () => {
  assert.equal(C.num('1 250,50'), 1250.5);
});

test('vétusté', () => {
  assert.equal(C.tauxVetuste('peinture', 1), 0);
  assert.equal(C.tauxVetuste('peinture', 4), 0.45);
  assert.equal(C.tauxVetuste('peinture', 20), 0.9);
  assert.equal(C.tauxVetuste('menage', 20), 0);
});

test('analyse des retenues', () => {
  const a = C.analyserRetenues([
    { type: 'peinture', montant: 600, age: 4, justifie: true, constate: true },
    { type: 'menage', montant: 120, justifie: false, constate: true },
    { type: 'moquette', montant: 300, age: 2, justifie: true, constate: false }
  ]);
  assert.equal(a.total, 1020);
  assert.equal(a.legitime, 330);
  assert.equal(a.contestable, 690);
});

test('planning', () => {
  const p = C.planning('2026-11-10');
  assert.equal(p[1].date, '2026-11-18');
  assert.equal(p.length, 4);
});
