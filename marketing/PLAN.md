# RendsMaCaution : plan de lancement et marketing (budget 1 000 €)

## 1. Le problème choisi, et pourquoi celui-là

**Un locataire sur trois environ ne récupère pas sa caution dans les règles, et presque aucun ne réclame la pénalité que la loi lui accorde.**

| Constat | Source |
|---|---|
| 7,7 millions de ménages locataires du parc privé, environ 20 % de rotation par an, soit de l'ordre de 1,5 million de départs chaque année (le dernier chiffre est mon calcul) | SDES, Insee |
| Dépôt non restitué dans 37,5 % des dossiers étudiés, rendu hors délai dans 32 % | Enquête CLCV, 2009, 160 dossiers : ancien et petit échantillon |
| Premier motif de demandes reçues par la CGL (16 %) | Baromètre CGL |
| Pénalité légale : 10 % du loyer hors charges par mois de retard commencé | Article 22, loi du 6 juillet 1989 |
| Le concurrent principal facture 59,90 € la lettre, 99,90 € par huissier, 239,90 € le pack | Tarifs affichés par litige.fr |

Pourquoi ce problème n'est pas réglé :

- **L'information existe, l'outil non.** Les sites officiels expliquent la règle sur une page de texte. Personne ne donne le montant exact à la date du jour avec la lettre déjà remplie. Même les articles en ligne se contredisent (10 % du dépôt ou du loyer, un ou deux mois).
- **Les services existants sont trop chers pour l'enjeu.** Payer 60 à 240 € pour récupérer 700 € freine. À 9,90 €, la décision ne demande pas de réflexion.
- **Les IA généralistes ne font pas le calcul de dates de façon fiable** et ne donnent pas un dossier suivi dans le temps.

Pourquoi il convient à votre situation : aucune API, aucun serveur, aucun coût fixe. L'argument tient en une phrase filmable. Le sujet est français, donc peu attaqué par les outils américains.

Ce que j'ai écarté : l'encadrement des loyers (37 % d'annonces au-dessus du plafond, mais le dispositif expire le 24 novembre 2026 sans nouvelle loi) et la facturation électronique (demande une plateforme agréée, donc des API).

**Limite à connaître :** je n'ai pas trouvé de statistique nationale récente sur les dépôts non rendus, et aucune preuve que des gens paieront 9,90 €. C'est précisément ce que la phase 1 mesure, pour presque rien.

## 2. Le modèle

- **Gratuit :** calcul du montant, analyse des retenues, message amiable, plan d'action.
- **Payant, 9,90 € une fois :** mise en demeure et saisine de la conciliation, remplies avec les chiffres de la personne.
- **Lancement :** tout est gratuit tant que `paymentLink` est vide dans `caution/config.js`. Gardez ce mode les deux premières semaines pour mesurer l'usage, puis activez le paiement.

Ordre de grandeur : après frais de paiement, une vente rapporte environ 9 €. Pour 1 000 € par mois, il faut environ 110 ventes. La publicité seule ne suffira pas à ce prix : le coût par vente doit rester sous 9 €. Le plan repose donc sur l'organique, et la publicité ne sert qu'à amplifier ce qui a déjà marché.

Suites possibles si la demande est confirmée, sous la même marque « l'argent qu'on vous doit » : régularisation de charges, préavis réduit, loyer encadré, envoi du recommandé en ligne par affiliation.

## 3. Les ressorts psychologiques utilisés

| Ressort | Application |
|---|---|
| Aversion à la perte | « Ton argent », jamais « un gain ». On récupère ce qui est à soi. |
| Chiffre précis | Un montant à l'euro près convainc plus qu'un principe. Le calculateur est en haut de page, avant toute explication. |
| Urgence réelle | « Le 15, la somme passe à 1 200 € ». Vrai, daté, vérifiable. |
| Autorité | L'article de loi apparaît à l'écran dans chaque vidéo. |
| Engagement progressif | Trois champs, puis le résultat, puis la lettre. Chaque étape est petite. |
| Effet de possession | La lettre est affichée avec les vrais chiffres avant le paiement. |
| Ancrage de prix | « Ailleurs, de 60 à 240 € ». |
| Monnaie sociale | « Envoie ça à la personne qui vient de déménager ». |

Ligne à ne pas franchir : pas de faux témoignages, pas de faux compteurs, pas de promesse de résultat, pas de discours contre « les propriétaires » en général. Le ton est celui d'un ami qui connaît la loi.

## 4. Budget : 1 000 €

| Poste | Montant | Quand |
|---|---|---|
| Nom de domaine (un an) | environ 12 € | Jour 1 |
| Relecture des courriers par un juriste ou un avocat (une heure) | 120 à 150 € | Avant d'activer le paiement |
| TikTok Spark Ads sur les vidéos déjà performantes | 400 € | Semaines 3 à 6 |
| 5 vidéos de micro-créateurs (étudiants, déménagement, droit) | 250 € | Semaines 3 à 5 |
| Test Google Ads sur requêtes d'intention forte | 100 € | Semaine 4 |
| Réserve | environ 90 € | |

Règle de dépense : aucun euro de publicité avant qu'une vidéo ait prouvé son intérêt sans budget. On sponsorise une vidéo dont le taux de visionnage complet et les partages dépassent nettement les autres, à 10 à 15 € par jour, et on coupe après trois jours si le coût par visite du site ne baisse pas.

Requêtes Google à tester : « propriétaire ne rend pas la caution », « lettre mise en demeure dépôt de garantie », « pénalité retard caution », « délai restitution caution ». Je n'ai pas de données de coût par clic : le test de 100 € sert à les obtenir.

## 5. Canaux

1. **TikTok, canal principal.** Deux publications par jour : une vidéo, un carrousel photo. Les carrousels du dossier `carrousels/` sont prêts à publier.
2. **Reels Instagram et YouTube Shorts.** Les mêmes vidéos, republiées sans filigrane.
3. **Réponses aux commentaires en vidéo.** Format le plus rentable : « commente ton loyer et ta date de sortie, je te calcule ce qu'il te doit ». Chaque réponse est une nouvelle vidéo et montre l'outil.
4. **Groupes Facebook** de location et d'étudiants par ville, forums et Reddit francophones (conseil juridique, finances). On répond aux questions avec le calcul fait, sans coller le lien partout. Trois réponses utiles par jour.
5. **Référencement.** Trois guides sont en ligne dans `caution/guides/`. Ajoutez un guide par semaine sur une question précise (trous dans les murs, caution en colocation, agence qui ne répond pas).
6. **YouTube long.** Une vidéo de 6 à 8 minutes, « Récupérer sa caution, étape par étape », qui reste trouvable des années.

Calendrier : les personnes parties en août et septembre ont dépassé le délai légal en ce moment. Le second pic arrive entre juin et septembre, avec les départs étudiants. Les mois creux servent à installer le référencement.

## 6. Cinq vidéos écrites

Format : 20 à 35 secondes, face caméra ou capture d'écran du calculateur, texte à l'écran dès la première seconde.

**Vidéo 1, la pénalité**
- Accroche (texte + voix) : « Ton proprio n'a pas rendu ta caution ? Il te doit plus que ta caution. »
- « Il a un mois pour te la rendre. Deux si l'état des lieux note des dégâts. »
- « Après, c'est 10 % de ton loyer en plus, par mois de retard. C'est l'article 22 de la loi de 1989. » (article à l'écran)
- Démonstration : on tape 700, 700, une date. Le montant apparaît.
- Fin : « Le calcul est gratuit, lien en bio. Envoie ça à quelqu'un qui vient de déménager. »

**Vidéo 2, la démonstration**
- Accroche : « J'ai rendu mes clés il y a quatre mois. Regarde ce que mon proprio me doit. »
- Capture d'écran en temps réel, sans coupe, jusqu'au montant puis à la lettre.
- Fin : « La lettre est déjà écrite avec mes chiffres. »

**Vidéo 3, la peinture**
- Accroche : « Il t'a retenu 600 € pour repeindre ? Demande-lui l'âge de la peinture. »
- « Une peinture, ça vit environ sept ans. Si elle en avait six, l'usure est pour lui, même si tu l'as abîmée. »
- Démonstration de l'étape 2 : 600 € retenus, 450 € contestables.
- Fin : « Vérifie tes retenues ligne par ligne. »

**Vidéo 4, l'erreur**
- Accroche : « L'erreur qui te fait perdre la pénalité de retard sur ta caution. »
- « Si tu n'as pas donné ta nouvelle adresse à ton proprio, les 10 % ne s'appliquent pas. »
- « Envoie-la par écrit aujourd'hui. Un SMS suffit pour commencer, garde une capture. »

**Vidéo 5, réponse à un commentaire**
- Commentaire affiché : « Loyer 850, sortie le 2 septembre, toujours rien. »
- Calcul en direct, montant annoncé, date de la prochaine hausse.
- Fin : « Mets ton loyer et ta date en commentaire, je fais le tien. »

## 7. Vingt-cinq accroches à tourner

1. Ta caution n'est pas un cadeau de départ pour ton proprio.
2. Un jour de retard sur ta caution, c'est un mois de pénalité.
3. Ce que ton agence espère que tu ne liras jamais.
4. Tu as déménagé cet été ? Tu as peut-être de l'argent qui t'attend.
5. « On vous la rend bientôt. » Voilà ce que dit la loi.
6. Combien de temps un proprio peut garder ta caution ? Pas celui que tu crois.
7. La phrase à envoyer à ton proprio qui fait le mort.
8. Il a gardé ta caution pour le ménage ? Il lui faut une preuve.
9. Sans facture, pas de retenue.
10. Trois ans : c'est le temps que tu as pour réclamer ta caution.
11. Tu as récupéré ta caution en retard ? Il te doit encore de l'argent.
12. J'ai calculé ce que les proprios doivent à mes abonnés.
13. Étudiant, tu as rendu ton studio en juin ? Lis ça.
14. La pénalité se calcule sur ton loyer, pas sur ta caution. Presque tout le monde se trompe.
15. Un mois ou deux mois ? Tout dépend d'une ligne de ton état des lieux.
16. Pas d'état des lieux de sortie ? C'est son problème, pas le tien.
17. Ton proprio te facture une moquette neuve ? Elle avait quel âge ?
18. Récupérer sa caution sans avocat, c'est quatre étapes.
19. La conciliation est gratuite, et personne ne le sait.
20. Ce courrier coûte 60 € ailleurs.
21. Combien te doit ton ancien proprio aujourd'hui ? Et le mois prochain ?
22. En colocation, qui récupère la caution ?
23. L'agence ne répond plus ? Voilà à qui écrire.
24. Les trois papiers à garder en quittant un logement.
25. Avant de rendre tes clés, fais ces deux choses.

## 8. Trente premiers jours

| Jours | Action | Objectif mesuré |
|---|---|---|
| 1 à 2 | Compléter les mentions légales, mettre en ligne, acheter le domaine, créer les comptes TikTok, Instagram et YouTube | Site accessible |
| 3 à 14 | 2 publications par jour, 3 réponses par jour dans les groupes, répondre à chaque commentaire | Trouver 2 ou 3 formats qui dépassent les autres |
| 15 | Bilan. Faire relire les courriers, activer le paiement | Premières ventes |
| 16 à 30 | Spark Ads sur les meilleures vidéos, 5 micro-créateurs, test Google Ads, un guide par semaine | Coût par vente inférieur à 9 € |

Seuils de décision au jour 30 :

- Plus de 40 % des visiteurs terminent le calcul : l'accroche est juste. Sinon, retravailler le haut de page.
- Plus de 3 % des personnes ayant un montant dû achètent : le prix et l'offre tiennent. Entre 1 et 3 %, tester 4,90 € et 14,90 €. Sous 1 %, laisser l'outil gratuit et le monétiser par l'affiliation d'envoi de recommandés.
- Aucune vidéo ne dépasse quelques centaines de vues après 25 publications : le sujet ne prend pas sur ce canal, basculer sur le référencement et Google Ads avant de dépenser le reste.

Le site n'intègre aucun outil de mesure, par choix de confidentialité. Pour suivre ces taux, ajoutez un outil d'audience sans cookie et déclarez-le dans les mentions légales. À défaut, vous n'aurez que les statistiques des plateformes et le nombre de ventes.

## 9. Avant d'ouvrir au public

- [ ] Remplacer les champs entre crochets dans `caution/mentions-legales.html` (identité, SIREN, hébergeur, médiateur de la consommation).
- [ ] Faire relire les trois courriers et la grille de vétusté par un juriste. Les règles viennent de l'article 22 et je les ai recoupées, mais je ne suis pas avocat et la grille est indicative.
- [ ] Vendre des modèles de courriers est autorisé ; donner un conseil personnalisé est réservé aux professions du droit. Dans les commentaires, répondez par le calcul et la règle générale, pas par « dans ton cas tu dois faire ceci ».
- [ ] Créer le lien de paiement et renseigner `caution/config.js`. Le déblocage se fait par un code dans l'adresse de retour : simple, mais contournable par quelqu'un de motivé. C'est acceptable à 9,90 €.
- [ ] Vérifier chaque trimestre que l'article 22 n'a pas changé.
