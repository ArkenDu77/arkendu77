/* Réglages du site. Seul fichier à modifier pour lancer la version payante.

   paymentLink vide  -> tout est gratuit (mode lancement, idéal pour valider la demande).
   paymentLink rempli -> les courriers officiels (mise en demeure, saisine) passent derrière
                         le paiement. Créez un « lien de paiement » (Stripe, Lemon Squeezy,
                         Gumroad…) et réglez sa page de retour sur :
                         https://VOTRE-SITE/caution/?merci=LE_CODE_CI-DESSOUS */
window.RMC_CONFIG = {
  nom: 'RendsMaCaution',
  prix: '9,90 €',
  paymentLink: '',
  unlockCode: 'changez-ce-code',
  contact: 'contact@exemple.fr'
};
