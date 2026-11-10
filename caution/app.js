/* RendsMaCaution — interface. Tout tourne dans le navigateur, rien n'est transmis. */
(function () {
  'use strict';
  var C = window.Caution, CFG = window.RMC_CONFIG || {};
  var KEY = 'rmc_v1';
  var $ = function (id) { return document.getElementById(id); };
  var eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  function money(x) { return eur.format(x).replace(',00', ''); }
  function dateFr(s) {
    var d = C.parseDate(s);
    return d ? d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function todayIso() { var n = new Date(); return C.iso(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))); }

  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };

  var state = { f: {}, retenues: [], id: {}, planStart: '', done: {}, tab: 'amiable' };
  try { var saved = JSON.parse(store.get(KEY) || 'null'); if (saved) for (var k in saved) state[k] = saved[k]; } catch (e) {}
  function save() { store.set(KEY, JSON.stringify(state)); }

  // --- Déblocage après paiement (lien de paiement externe, aucun serveur) ---
  var params = new URLSearchParams(location.search);
  if (CFG.paymentLink && params.get('merci') && params.get('merci') === CFG.unlockCode) {
    store.set('rmc_ok', '1');
    history.replaceState(null, '', location.pathname);
  }
  function unlocked() { return !CFG.paymentLink || store.get('rmc_ok') === '1'; }

  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2200);
  }

  // --- Étape 1 : calcul ---
  var FIELDS = ['loyer', 'depot', 'cles', 'edl', 'bail', 'restitue', 'dateRestitution', 'retenuesAcceptees'];
  var CHECKS = ['adresse', 'copro'];

  function readForm() {
    FIELDS.forEach(function (n) { state.f[n] = $(n).value; });
    CHECKS.forEach(function (n) { state.f[n] = $(n).checked; });
  }
  function fillForm() {
    FIELDS.forEach(function (n) { if (state.f[n] != null && state.f[n] !== '') $(n).value = state.f[n]; });
    CHECKS.forEach(function (n) { if (typeof state.f[n] === 'boolean') $(n).checked = state.f[n]; });
    ['nom', 'bailleur', 'monAdresse', 'adresseBailleur', 'logement', 'dateBail', 'ville'].forEach(function (n) { if (state.id[n]) $(n).value = state.id[n]; });
    $('cles').max = todayIso();
    if (state.f.restitue || state.f.bail === 'meuble' || state.f.copro || state.f.adresse === false) $('plus').open = true;
  }

  function analyse() { return C.analyserRetenues(state.retenues); }

  function result() {
    var e = {}; for (var k in state.f) e[k] = state.f[k];
    if (state.retenues.length) e.retenuesAcceptees = analyse().legitime;
    e.today = todayIso();
    return C.compute(e);
  }

  function renderResult() {
    var box = $('resultat');
    var started = C.num(state.f.loyer) > 0 || C.num(state.f.depot) > 0 || state.f.cles;
    if (!started) { box.innerHTML = '<p class="muted small" style="margin-top:14px">Remplissez les trois premiers champs : le résultat s\'affiche tout seul.</p>'; return; }
    var r = result();
    if (!r.ok) {
      var complete = C.num(state.f.loyer) > 0 && C.num(state.f.depot) > 0 && state.f.cles;
      box.innerHTML = (complete || state.f.bail === 'autre') ? '<p class="err">' + esc(r.erreurs[0]) + '</p>' : '<p class="muted small" style="margin-top:14px">Encore un champ ou deux…</p>';
      return;
    }
    var h = '<div class="result">';
    if (r.total <= 0) {
      h += '<div class="kicker">D\'après vos saisies, rien ne vous reste dû</div><p>Le remboursement reçu et les retenues justifiées couvrent tout le dépôt.' +
        (r.restitue > 0 && !state.f.dateRestitution ? ' Indiquez la date du remboursement : s\'il est arrivé après le ' + dateFr(r.dateLimite) + ', la majoration de retard reste due.' : '') + '</p>';
    } else if (!r.enRetard) {
      h += '<div class="kicker">Le délai légal n\'est pas encore dépassé</div>' +
        '<p>Votre bailleur a jusqu\'au <strong>' + dateFr(r.dateLimite) + '</strong> pour vous rendre <strong>' + money(r.principal) + '</strong>' +
        (r.joursAvantLimite > 0 ? ' (dans ' + r.joursAvantLimite + ' jour' + (r.joursAvantLimite > 1 ? 's' : '') + ')' : ' (c\'est aujourd\'hui)') + '.</p>' +
        '<div class="tick">Dès le lendemain, il vous devra ' + money(r.majorationParMois) + ' de plus par mois commencé.</div>';
    } else {
      h += '<div class="kicker">Votre bailleur vous doit aujourd\'hui</div><div class="big">' + money(r.total) + '</div><table>' +
        '<tr><td>Dépôt de garantie restant dû</td><td>' + money(r.principal) + '</td></tr>' +
        '<tr><td>Majoration légale : ' + r.moisRetard + ' mois de retard × ' + money(r.majorationParMois) + '</td><td>' + money(r.majoration) + '</td></tr>' +
        '<tr><td>Date limite dépassée</td><td>' + dateFr(r.dateLimite) + '</td></tr></table>';
      if (r.prochaineEcheance && r.majoration > 0) h += '<div class="tick">Sans paiement d\'ici le ' + dateFr(r.prochaineEcheance) + ', la somme passe à ' + money(r.total + r.majorationParMois) + '.</div>';
    }
    r.alertes.forEach(function (a) { h += '<div class="alert">' + esc(a) + '</div>'; });
    h += '<div class="btns"><a class="btn" href="#etape-courriers">' + (r.enRetard ? 'Réclamer cette somme' : 'Préparer mon courrier') + '</a>' +
      '<a class="btn ghost" href="#etape-retenues">Il a retenu de l\'argent</a>' +
      '<button type="button" class="btn ghost" id="share">Partager l\'outil</button></div></div>';
    box.innerHTML = h;
    $('share').onclick = share;
  }

  function share() {
    var url = location.origin + location.pathname;
    var text = 'Caution pas rendue ? La loi prévoit 10 % du loyer par mois de retard. Calcule ce que ton proprio te doit :';
    if (navigator.share) navigator.share({ title: 'RendsMaCaution', text: text, url: url }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(text + ' ' + url).then(function () { toast('Lien copié'); });
  }

  // --- Étape 2 : retenues ---
  function renderRetenues() {
    var box = $('retenues');
    box.innerHTML = state.retenues.map(function (r, i) {
      var g = C.grille(r.type);
      return '<div class="retenue" data-i="' + i + '"><div class="row">' +
        '<div><label for="rt' + i + '">Motif de la retenue</label><select id="rt' + i + '" data-k="type">' +
        C.GRILLE.map(function (x) { return '<option value="' + x.id + '"' + (x.id === r.type ? ' selected' : '') + '>' + esc(x.label) + '</option>'; }).join('') + '</select></div>' +
        '<div><label for="rm' + i + '">Montant retenu <small>en €</small></label><input id="rm' + i + '" data-k="montant" inputmode="decimal" value="' + esc(r.montant || '') + '"></div></div>' +
        (g.duree ? '<label for="ra' + i + '">Âge de l\'élément à votre départ <small>en années depuis sa pose ou sa dernière réfection. Durée de vie indicative : ' + g.duree + ' ans.</small></label><input id="ra' + i + '" data-k="age" inputmode="decimal" value="' + esc(r.age || '') + '">' : '') +
        '<label class="check"><input type="checkbox" data-k="constate"' + (r.constate !== false ? ' checked' : '') + '> <span>La dégradation est notée à la sortie et absente de l\'état des lieux d\'entrée</span></label>' +
        '<label class="check"><input type="checkbox" data-k="justifie"' + (r.justifie !== false ? ' checked' : '') + '> <span>Le bailleur a fourni un devis ou une facture</span></label>' +
        '<div class="verdict-slot"></div><button type="button" class="x" data-del="' + i + '">Supprimer cette ligne</button></div>';
    }).join('');
    renderVerdicts();
  }

  function renderVerdicts() {
    var a = analyse();
    Array.prototype.forEach.call(document.querySelectorAll('#retenues .verdict-slot'), function (slot, i) {
      var d = a.details[i];
      slot.innerHTML = !d || d.montant <= 0 ? '' : (d.contestable > 0
        ? '<div class="verdict">Contestable : <b>' + money(d.contestable) + '</b> sur ' + money(d.montant) + '. ' + esc(d.motifs.join(' ')) + '</div>'
        : '<div class="verdict muted">Cette retenue paraît justifiée en l\'état de vos réponses.</div>');
    });
    $('retenues-total').innerHTML = state.retenues.length && a.total > 0
      ? '<div class="result"><div class="kicker">Sur ' + money(a.total) + ' retenus, vous pouvez contester</div><div class="big">' + money(a.contestable) + '</div>' +
        '<p class="small muted" style="margin:10px 0 0">Ce montant est repris automatiquement dans votre calcul et dans vos courriers. La grille de vétusté utilisée est indicative : s\'il y en a une annexée à votre bail, c\'est elle qui s\'applique.</p></div>'
      : '';
  }

  $('add-retenue').onclick = function () {
    state.retenues.push({ type: 'peinture', montant: '', age: '', justifie: true, constate: true });
    save(); renderRetenues();
    var el = $('rm' + (state.retenues.length - 1)); if (el) el.focus();
  };
  function onRetenue(ev) {
    var row = ev.target.closest('.retenue'); if (!row) return;
    var r = state.retenues[+row.dataset.i], k = ev.target.dataset.k; if (!k) return;
    r[k] = ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value;
    save();
    // Changer de motif fait apparaître ou disparaître le champ « âge » : on reconstruit la ligne.
    if (k === 'type') renderRetenues(); else renderVerdicts();
    renderResult(); renderLettre();
  }
  $('retenues').addEventListener('input', onRetenue);
  $('retenues').addEventListener('change', onRetenue);
  $('retenues').addEventListener('click', function (ev) {
    var i = ev.target.dataset.del; if (i == null) return;
    state.retenues.splice(+i, 1); save(); renderRetenues(); renderResult(); renderLettre();
  });

  // --- Étape 3 : courriers ---
  var TABS = [
    { id: 'amiable', label: '1. Message amiable', free: true },
    { id: 'med', label: '2. Mise en demeure', free: false },
    { id: 'cdc', label: '3. Saisine de la conciliation', free: false }
  ];
  function v(k, placeholder) { return (state.id[k] || '').trim() || '[' + placeholder + ']'; }

  function blocRetenues() {
    if (!state.retenues.length) return '';
    var a = analyse(); if (a.contestable <= 0) return '';
    var lignes = state.retenues.map(function (r, i) {
      var d = a.details[i]; if (d.contestable <= 0) return null;
      return '- ' + C.grille(r.type).label + ' : ' + money(d.montant) + ' retenus, dont ' + money(d.contestable) + ' contestés. ' + d.motifs.join(' ');
    }).filter(Boolean).join('\n');
    return '\n\nVous avez retenu la somme de ' + money(a.total) + '. Je conteste ces retenues à hauteur de ' + money(a.contestable) + ', pour les raisons suivantes :\n' + lignes +
      "\n\nJe vous rappelle que seules peuvent être déduites du dépôt de garantie les sommes « dûment justifiées », et que la vétusté, c'est-à-dire l'usure résultant du temps et de l'usage normal, reste à la charge du bailleur (article 7 de la loi du 6 juillet 1989).";
  }

  function faits(r) {
    var f = state.f, t = "J'ai été locataire du logement situé " + v('logement', 'adresse du logement') +
      (state.id.dateBail ? ', en vertu d\'un bail signé le ' + dateFr(state.id.dateBail) : '') +
      '. Je vous ai remis les clés le ' + dateFr(f.cles) + '. ';
    t += f.edl === 'conforme' ? "L'état des lieux de sortie est conforme à l'état des lieux d'entrée."
      : f.edl === 'differences' ? "Un état des lieux de sortie a été établi à cette occasion."
      : "Aucun état des lieux de sortie n'a été établi.";
    t += "\n\nÀ mon entrée dans les lieux, je vous ai versé un dépôt de garantie de " + money(C.num(f.depot)) + '.';
    t += "\n\nEn application de l'article 22 de la loi n° 89-462 du 6 juillet 1989" + (f.bail === 'meuble' ? ', applicable aux locations meublées en vertu de son article 25-3' : '') +
      ', ce dépôt devait m\'être restitué dans un délai maximal ' + (r.delaiMois === 1 ? "d'un mois" : 'de deux mois') + ' à compter de la remise des clés, soit au plus tard le ' + dateFr(r.dateLimite) + '.';
    t += r.restitue > 0
      ? "\n\nÀ ce jour, vous ne m'avez restitué que " + money(r.restitue) + (f.dateRestitution ? ', le ' + dateFr(f.dateRestitution) : '') + '.'
      : "\n\nÀ ce jour, je n'ai reçu aucun remboursement.";
    return t + blocRetenues();
  }

  function demande(r) {
    var t = '';
    if (r.majoration > 0) {
      t += "\n\nL'article 22 prévoit aussi qu'à défaut de restitution dans le délai, le dépôt de garantie restant dû est majoré d'une somme égale à 10 % du loyer mensuel en principal pour chaque période mensuelle commencée en retard. Mon loyer hors charges était de " +
        money(C.num(state.f.loyer)) + ' et ' + r.moisRetard + ' période' + (r.moisRetard > 1 ? 's' : '') + ' mensuelle' + (r.moisRetard > 1 ? 's ont' : ' a') + ' commencé depuis le ' + dateFr(r.dateLimite) +
        ', soit une majoration de ' + money(r.majoration) + ' à ce jour.';
    }
    t += '\n\nVous me devez donc :\n- dépôt de garantie restant dû : ' + money(r.principal);
    if (r.majoration > 0) t += '\n- majoration légale de retard : ' + money(r.majoration);
    t += '\n- total à ce jour : ' + money(r.total);
    if (r.majoration > 0 && r.principal > 0) t += '\n\nCette majoration augmente de ' + money(r.majorationParMois) + ' à chaque nouveau mois commencé' + (r.prochaineEcheance ? ', le prochain débutant le ' + dateFr(C.iso(C.addDays(C.parseDate(r.prochaineEcheance), 1))) : '') + '.';
    return t;
  }

  function entete(objet) {
    return v('nom', 'Prénom Nom') + '\n' + v('monAdresse', 'votre adresse actuelle') + '\n\n' +
      v('bailleur', 'Nom du bailleur') + '\n' + v('adresseBailleur', 'adresse du bailleur') + '\n\n' +
      v('ville', 'Ville') + ', le ' + dateFr(todayIso()) + '\n\n' + objet + '\n\n';
  }

  function lettre(id, r) {
    if (id === 'amiable') {
      return 'Bonjour,\n\nJe vous ai remis les clés du logement situé ' + v('logement', 'adresse du logement') + ' le ' + dateFr(state.f.cles) +
        '. Le délai légal pour me restituer le dépôt de garantie expirait le ' + dateFr(r.dateLimite) + ' (article 22 de la loi du 6 juillet 1989).\n\n' +
        'À ce jour, il me reste dû ' + money(r.principal) + (r.majoration > 0 ? ', auxquels la loi ajoute une majoration de 10 % du loyer par mois de retard commencé, soit ' + money(r.majoration) + ' aujourd\'hui. Le total s\'élève à ' + money(r.total) : '') + '.\n\n' +
        'Pouvez-vous procéder au virement sous 8 jours ? Je préfère que nous réglions cela simplement, avant d\'engager une démarche officielle.\n\n' +
        'Ma nouvelle adresse : ' + v('monAdresse', 'votre adresse actuelle') + '\n\nCordialement,\n' + v('nom', 'Prénom Nom');
    }
    if (id === 'med') {
      return entete('Lettre recommandée avec accusé de réception\nObjet : mise en demeure de restituer le dépôt de garantie') +
        'Madame, Monsieur,\n\n' + faits(r) + demande(r) +
        "\n\nPar la présente, je vous mets en demeure de me verser cette somme dans un délai de 8 jours à compter de la réception de ce courrier, par virement ou par chèque adressé à mon adresse actuelle, indiquée en tête de lettre." +
        "\n\nÀ défaut, je saisirai la commission départementale de conciliation ou un conciliateur de justice, puis le juge des contentieux de la protection, afin d'obtenir le paiement des sommes dues, de la majoration qui continuera de courir et des frais engagés." +
        '\n\nVeuillez agréer, Madame, Monsieur, mes salutations distinguées.\n\n' + v('nom', 'Prénom Nom') + '\n(signature)\n\n' +
        "Pièces jointes : copie du bail, états des lieux d'entrée et de sortie, justificatif de remise des clés.";
    }
    return entete('Lettre recommandée avec accusé de réception\nÀ adresser au secrétariat de la commission départementale de conciliation du département du logement\nObjet : saisine pour non-restitution du dépôt de garantie') +
      'Madame, Monsieur,\n\nJe sollicite l\'intervention de la commission dans le litige qui m\'oppose à mon ancien bailleur, ' + v('bailleur', 'Nom du bailleur') + ', demeurant ' + v('adresseBailleur', 'adresse du bailleur') + '.\n\n' +
      faits(r).replace(/Je vous ai remis/, "J'ai remis au bailleur").replace(/je vous ai versé/, "j'ai versé").replace(/vous ne m'avez restitué/, "il ne m'a été restitué").replace(/Vous avez retenu/, 'Le bailleur a retenu').replace(/Je vous rappelle que seules/, 'Seules').replace(/, et que la vétusté/, ', et la vétusté') +
      demande(r).replace('Vous me devez donc', 'Le bailleur me doit donc') +
      "\n\nMa mise en demeure, adressée par lettre recommandée, est restée sans effet. Je demande à la commission de bien vouloir convoquer les parties afin de parvenir à une conciliation sur le paiement de ces sommes." +
      '\n\nVeuillez agréer, Madame, Monsieur, mes salutations distinguées.\n\n' + v('nom', 'Prénom Nom') + '\n(signature)\n\n' +
      "Pièces jointes : copie du bail, états des lieux d'entrée et de sortie, justificatif de remise des clés, copie de la mise en demeure et de son accusé de réception.";
  }

  function renderTabs() {
    $('tabs').innerHTML = TABS.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (t.id === state.tab) + '" data-tab="' + t.id + '">' + t.label + '</button>';
    }).join('');
  }
  $('tabs').addEventListener('click', function (ev) {
    var id = ev.target.dataset.tab; if (!id) return;
    state.tab = id; save(); renderTabs(); renderLettre();
  });

  var currentText = '';
  function renderLettre() {
    var zone = $('lettre-zone'), r = result();
    if (!r.ok) { zone.innerHTML = '<p class="muted">Remplissez d\'abord le calcul en haut de page : vos courriers se rédigent à partir de ces chiffres.</p>'; return; }
    if (r.total <= 0) { zone.innerHTML = '<p class="muted">D\'après vos saisies, aucune somme ne vous reste due.</p>'; return; }
    var tab = TABS.filter(function (t) { return t.id === state.tab; })[0] || TABS[0];
    currentText = lettre(tab.id, r);
    var conseil = tab.id === 'amiable' ? "À envoyer par SMS ou e-mail. Un rappel écrit et chiffré suffit souvent, et il prouve votre bonne foi."
      : tab.id === 'med' ? "À imprimer, signer et envoyer en recommandé avec accusé de réception. Conservez la preuve de dépôt." + (!r.enRetard ? " Attendez le " + dateFr(r.dateLimite) + " : avant cette date, le bailleur n'est pas en retard." : '')
      : "À envoyer si la mise en demeure reste sans réponse. L'adresse de la commission de votre département figure sur le site de votre préfecture. Vous pouvez aussi saisir un conciliateur de justice en ligne sur conciliateurs.fr.";
    if (!tab.free && !unlocked()) {
      zone.innerHTML = '<p class="small muted">' + esc(conseil) + '</p><div class="locked"><div class="lettre">' + esc(currentText.slice(0, 700)) + '</div><div class="veil"><div>' +
        '<p><strong>Votre courrier est prêt, avec vos montants et les articles de loi.</strong><br>Accès complet aux courriers officiels : ' + esc(CFG.prix || '') + ', paiement unique.</p>' +
        '<a class="btn gold" href="' + esc(CFG.paymentLink) + '">Débloquer mes courriers</a></div></div></div>';
      currentText = '';
      return;
    }
    zone.innerHTML = '<p class="small muted">' + esc(conseil) + '</p><div class="lettre" tabindex="0">' + esc(currentText) + '</div><div class="btns">' +
      '<button type="button" class="btn" id="l-print">Imprimer ou enregistrer en PDF</button>' +
      '<button type="button" class="btn ghost" id="l-copy">Copier le texte</button>' +
      '<button type="button" class="btn ghost" id="l-doc">Télécharger (.doc)</button></div>';
    $('l-print').onclick = function () {
      $('print-area').textContent = currentText; document.body.classList.add('printing'); window.print();
      setTimeout(function () { document.body.classList.remove('printing'); }, 500);
    };
    $('l-copy').onclick = function () {
      if (navigator.clipboard) navigator.clipboard.writeText(currentText).then(function () { toast('Texte copié'); });
    };
    $('l-doc').onclick = function () {
      var html = '<html><head><meta charset="utf-8"></head><body style="font-family:Georgia,serif;font-size:12pt">' + esc(currentText).replace(/\n/g, '<br>') + '</body></html>';
      download('courrier-depot-de-garantie.doc', 'application/msword', '﻿' + html);
    };
  }

  function download(name, type, content) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type: type }));
    a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  ['nom', 'bailleur', 'monAdresse', 'adresseBailleur', 'logement', 'dateBail', 'ville'].forEach(function (n) {
    $(n).addEventListener('input', function () { state.id[n] = $(n).value; save(); renderLettre(); });
  });

  // --- Étape 4 : suivi ---
  function plan() { return C.planning(state.planStart || todayIso()); }
  function renderPlan() {
    $('planStart').value = state.planStart || todayIso();
    $('plan').innerHTML = plan().map(function (p) {
      var done = !!state.done[p.id];
      return '<li class="' + (done ? 'done' : '') + '"><input type="checkbox" id="p-' + p.id + '" data-step="' + p.id + '"' + (done ? ' checked' : '') + '>' +
        '<label for="p-' + p.id + '" style="margin:0"><span class="when">' + dateFr(p.date) + '</span><br><strong>' + esc(p.titre) + '</strong><span class="hint">' + esc(p.detail) + '</span></label></li>';
    }).join('');
  }
  $('plan').addEventListener('change', function (ev) {
    var s = ev.target.dataset.step; if (!s) return;
    state.done[s] = ev.target.checked; save(); renderPlan();
  });
  $('planStart').addEventListener('change', function () { state.planStart = $('planStart').value; save(); renderPlan(); });

  $('ics').onclick = function () {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    var events = plan().filter(function (p) { return !state.done[p.id]; }).map(function (p) { return { date: p.date, titre: 'Caution : ' + p.titre, detail: p.detail }; });
    var r = result();
    if (r.ok && r.prochaineEcheance && r.principal > 0) events.push({ date: r.prochaineEcheance, titre: 'Caution : +' + money(r.majorationParMois) + ' de majoration dès demain', detail: 'Un nouveau mois de retard commence. Mettez à jour votre calcul sur RendsMaCaution.' });
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RendsMaCaution//FR', 'CALSCALE:GREGORIAN'];
    events.forEach(function (e, i) {
      var d = e.date.replace(/-/g, ''), next = C.iso(C.addDays(C.parseDate(e.date), 1)).replace(/-/g, '');
      lines.push('BEGIN:VEVENT', 'UID:rmc-' + d + '-' + i + '@rendsmacaution', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + next,
        'SUMMARY:' + icsText(e.titre), 'DESCRIPTION:' + icsText(e.detail), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText(e.titre), 'TRIGGER:PT9H', 'END:VALARM', 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    download('rappels-caution.ics', 'text/calendar', lines.join('\r\n'));
  };
  function icsText(s) { return String(s).replace(/\\/g, '\\\\').replace(/[,;]/g, function (c) { return '\\' + c; }).replace(/\n/g, '\\n'); }

  $('reset').onclick = function () {
    if (!confirm('Effacer toutes les informations saisies sur cet appareil ?')) return;
    store.del(KEY); location.reload();
  };

  // --- Démarrage ---
  $('calc').addEventListener('input', function () { readForm(); save(); renderResult(); renderLettre(); });
  $('calc').addEventListener('submit', function (ev) { ev.preventDefault(); });
  fillForm(); readForm(); renderResult(); renderRetenues(); renderTabs(); renderLettre(); renderPlan();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
})();
