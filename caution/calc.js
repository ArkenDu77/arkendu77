/* RendsMaCaution — moteur de calcul (aucune dépendance, utilisable navigateur + Node).
   Base légale : article 22 de la loi n° 89-462 du 6 juillet 1989 (applicable aux meublés
   par l'article 25-3 ; plafond du dépôt en meublé : article 25-6). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Caution = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function parseDate(s) {
    if (s instanceof Date) return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCMonth() === +m[2] - 1 ? d : null;
  }

  function iso(d) { return d ? d.toISOString().slice(0, 10) : ''; }

  // Ajoute n mois calendaires ; le 31 janvier + 1 mois donne le dernier jour de février.
  function addMonths(d, n) {
    var y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
    var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, Math.min(day, last)));
  }

  function addDays(d, n) { return new Date(d.getTime() + n * 86400000); }

  function num(v) {
    if (typeof v === 'number') return isFinite(v) ? v : 0;
    var x = parseFloat(String(v == null ? '' : v).replace(/\s/g, '').replace(',', '.'));
    return isFinite(x) ? x : 0;
  }

  function round2(x) { return Math.round((x + Number.EPSILON) * 100) / 100; }

  // Nombre de périodes mensuelles commencées entre la date limite et la date de fin.
  function moisCommences(limite, fin) {
    if (!limite || !fin || fin <= limite) return 0;
    var n = 1;
    while (addMonths(limite, n) < fin && n < 600) n++;
    return n;
  }

  /* entree : { bail:'vide'|'meuble'|'autre', loyer, depot, cles:'YYYY-MM-DD',
       edl:'conforme'|'differences'|'aucun', restitue, dateRestitution,
       retenuesAcceptees, adresse:boolean, copro:boolean, today } */
  function compute(e) {
    var out = { ok: false, erreurs: [], alertes: [] };
    var loyer = num(e.loyer), depot = num(e.depot);
    var cles = parseDate(e.cles);
    var today = parseDate(e.today) || parseDate(new Date());
    if (e.bail === 'autre') {
      out.erreurs.push("Ce simulateur couvre les locations vides et meublées à usage de résidence principale. Pour une location saisonnière, un parking ou un bail commercial, ce sont les clauses du contrat qui s'appliquent.");
      return out;
    }
    if (loyer <= 0) out.erreurs.push('Indiquez le loyer mensuel hors charges.');
    if (depot <= 0) out.erreurs.push('Indiquez le montant du dépôt de garantie versé.');
    if (!cles) out.erreurs.push('Indiquez la date de remise des clés.');
    else if (cles > today) out.erreurs.push("La date de remise des clés est dans le futur : le délai ne commence qu'à la remise des clés.");
    if (out.erreurs.length) return out;

    var restitue = Math.min(Math.max(num(e.restitue), 0), depot);
    var acceptees = Math.min(Math.max(num(e.retenuesAcceptees), 0), depot - restitue);
    var dateRest = restitue > 0 ? parseDate(e.dateRestitution) : null;

    var delai = e.edl === 'differences' ? 2 : 1;
    var limite = addMonths(cles, delai);
    var principal = round2(depot - restitue - acceptees);

    // La majoration court jusqu'à aujourd'hui tant qu'une somme reste due, sinon jusqu'au remboursement.
    var fin = principal > 0 ? today : (dateRest || limite);
    var mois = moisCommences(limite, fin);
    var parMois = round2(loyer * 0.10);
    var majoration = e.adresse === false ? 0 : round2(parMois * mois);

    var plafond = e.bail === 'meuble' ? 2 * loyer : loyer;

    out.ok = true;
    out.delaiMois = delai;
    out.dateLimite = iso(limite);
    out.enRetard = mois > 0;
    out.moisRetard = mois;
    out.majorationParMois = parMois;
    out.majoration = majoration;
    out.principal = principal;
    out.total = round2(principal + majoration);
    out.restitue = restitue;
    out.retenuesAcceptees = acceptees;
    out.prochaineEcheance = principal > 0 && mois > 0 ? iso(addMonths(limite, mois)) : (principal > 0 ? iso(limite) : '');
    out.prescription = iso(addMonths(cles, 36));
    out.joursAvantLimite = Math.round((limite - today) / 86400000);
    out.depotExcedentaire = depot > plafond + 0.005 ? round2(depot - plafond) : 0;

    if (e.adresse === false) out.alertes.push("Vous n'avez pas communiqué votre nouvelle adresse au bailleur : la majoration de 10 % n'est pas due tant que ce n'est pas fait. Envoyez-la dès maintenant (la lettre générée la contient).");
    if (e.edl === 'aucun') out.alertes.push("Sans état des lieux de sortie, le bailleur ne peut en principe pas prouver de dégradations : le délai d'un mois est retenu ici. Un juge pourrait toutefois appliquer le délai de deux mois.");
    if (e.copro) out.alertes.push("Logement en copropriété : le bailleur peut conserver une provision de 20 % maximum du dépôt jusqu'à l'arrêté annuel des comptes de l'immeuble, puis il doit régulariser dans le mois qui suit leur approbation.");
    if (out.depotExcedentaire > 0) out.alertes.push('Le dépôt versé dépasse le plafond légal (' + (e.bail === 'meuble' ? '2 mois' : '1 mois') + ' de loyer hors charges).');
    if (today > addMonths(cles, 36)) out.alertes.push("Plus de 3 ans se sont écoulés depuis la remise des clés : l'action est probablement prescrite (article 7-1 de la loi de 1989).");
    else if (today > addMonths(cles, 30)) out.alertes.push('Attention : la prescription de 3 ans approche (' + iso(addMonths(cles, 36)) + '). Agissez vite.');
    if (acceptees > 0 || (restitue > 0 && principal > 0)) out.alertes.push("Si un juge estime finalement que les retenues étaient justifiées, la majoration ne porte que sur la période où une somme vous restait réellement due.");
    return out;
  }

  /* Grille de vétusté INDICATIVE (il n'existe pas de grille officielle unique ; ces valeurs
     sont des moyennes de grilles issues d'accords collectifs). duree et franchise en années,
     residuel = part minimale restant à la charge du locataire. */
  var GRILLE = [
    { id: 'peinture', label: 'Peinture, papier peint', duree: 7, franchise: 1, residuel: 0.10 },
    { id: 'moquette', label: 'Moquette', duree: 7, franchise: 1, residuel: 0.10 },
    { id: 'sol_souple', label: 'Sol plastique, lino', duree: 10, franchise: 2, residuel: 0.10 },
    { id: 'parquet', label: 'Parquet (ponçage, vitrification)', duree: 10, franchise: 2, residuel: 0.15 },
    { id: 'stratifie', label: 'Parquet stratifié (remplacement)', duree: 12, franchise: 2, residuel: 0.15 },
    { id: 'carrelage', label: 'Carrelage, faïence', duree: 25, franchise: 5, residuel: 0.20 },
    { id: 'robinetterie', label: 'Robinetterie', duree: 10, franchise: 2, residuel: 0.10 },
    { id: 'sanitaires', label: 'Sanitaires (WC, lavabo, baignoire)', duree: 20, franchise: 5, residuel: 0.20 },
    { id: 'electromenager', label: 'Électroménager', duree: 8, franchise: 1, residuel: 0.10 },
    { id: 'mobilier', label: 'Mobilier', duree: 8, franchise: 1, residuel: 0.10 },
    { id: 'literie', label: 'Literie, matelas', duree: 7, franchise: 1, residuel: 0.10 },
    { id: 'stores', label: 'Stores, volets', duree: 12, franchise: 2, residuel: 0.15 },
    { id: 'portes', label: 'Portes, menuiseries intérieures', duree: 20, franchise: 5, residuel: 0.20 },
    { id: 'radiateurs', label: 'Radiateurs électriques', duree: 15, franchise: 3, residuel: 0.15 },
    { id: 'menage', label: 'Ménage, nettoyage', duree: 0, franchise: 0, residuel: 1 },
    { id: 'autre', label: 'Autre (sans vétusté)', duree: 0, franchise: 0, residuel: 1 }
  ];

  function grille(id) {
    for (var i = 0; i < GRILLE.length; i++) if (GRILLE[i].id === id) return GRILLE[i];
    return GRILLE[GRILLE.length - 1];
  }

  // Part du coût que la vétusté efface (0 à 1).
  function tauxVetuste(id, age) {
    var g = grille(id);
    if (!g.duree) return 0;
    var a = Math.max(num(age), 0);
    if (a <= g.franchise) return 0;
    var t = (a - g.franchise) / (g.duree - g.franchise);
    return Math.min(t, 1) * (1 - g.residuel);
  }

  /* retenue : { type, montant, age, justifie:boolean, constate:boolean }
     justifie = devis ou facture fourni ; constate = dégradation notée à la sortie et absente à l'entrée. */
  function analyserRetenue(r) {
    var montant = Math.max(num(r.montant), 0);
    var motifs = [];
    var legitime = montant;
    if (r.constate === false) {
      legitime = 0;
      motifs.push("La dégradation n'apparaît pas par comparaison des états des lieux d'entrée et de sortie : rien ne prouve qu'elle vous est imputable.");
    } else if (r.justifie === false) {
      legitime = 0;
      motifs.push("Aucun justificatif (devis, facture, état des lieux) n'a été fourni : l'article 22 exige que les sommes retenues soient « dûment justifiées ».");
    } else {
      var t = tauxVetuste(r.type, r.age);
      if (t > 0) {
        legitime = round2(montant * (1 - t));
        motifs.push('Vétusté : pour un élément de ' + num(r.age) + (num(r.age) > 1 ? ' ans' : ' an') + ', environ ' + Math.round(t * 100) + " % du coût relève de l'usure normale, à la charge du bailleur (grille indicative).");
      }
    }
    return { montant: montant, legitime: legitime, contestable: round2(montant - legitime), motifs: motifs };
  }

  function analyserRetenues(liste) {
    var total = 0, legitime = 0, details = [];
    (liste || []).forEach(function (r) {
      var a = analyserRetenue(r);
      total += a.montant; legitime += a.legitime; details.push(a);
    });
    return { total: round2(total), legitime: round2(legitime), contestable: round2(total - legitime), details: details };
  }

  // Calendrier d'action conseillé à partir d'une date de départ.
  function planning(depart) {
    var d = parseDate(depart) || parseDate(new Date());
    return [
      { id: 'amiable', date: iso(d), titre: 'Message amiable au bailleur', detail: 'Un rappel court et courtois, par écrit (SMS ou e-mail), avec le montant et la date limite dépassée.' },
      { id: 'med', date: iso(addDays(d, 8)), titre: 'Mise en demeure en recommandé', detail: 'Lettre recommandée avec accusé de réception, délai de 8 jours pour payer.' },
      { id: 'conciliation', date: iso(addDays(d, 20)), titre: 'Conciliation gratuite', detail: 'Saisine de la commission départementale de conciliation ou d\'un conciliateur de justice. Démarche gratuite, obligatoire avant le juge pour un litige de 5 000 € ou moins.' },
      { id: 'juge', date: iso(addDays(d, 80)), titre: 'Juge des contentieux de la protection', detail: "Requête au tribunal du lieu du logement. Sans avocat obligatoire jusqu'à 10 000 €." }
    ];
  }

  return { parseDate: parseDate, iso: iso, addMonths: addMonths, addDays: addDays, num: num, round2: round2,
    moisCommences: moisCommences, compute: compute, GRILLE: GRILLE, grille: grille, tauxVetuste: tauxVetuste,
    analyserRetenue: analyserRetenue, analyserRetenues: analyserRetenues, planning: planning };
});
