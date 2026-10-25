import { Link } from 'react-router-dom'
import { SHOP_CONTACT_EMAIL, SHOP_CONTACT_PHONE } from '../lib/contact'

const sections = [
  ['perimetre', 'Produits concernés'],
  ['signaler', 'Signaler un défaut'],
  ['retour', 'Retour et frais'],
  ['solutions', 'Examen et solutions'],
  ['precautions', 'Appareils et Longrich'],
  ['droits', 'Vos droits légaux'],
]

export default function ReturnsPolicyPage() {
  return (
    <article className="panel returns-policy" aria-labelledby="returns-title">
      <header className="returns-heading">
        <Link to="/">Accueil</Link>
        <p className="returns-eyebrow">Informations boutique · Sénégal</p>
        <h1 id="returns-title">Conditions de retour et de remboursement</h1>
        <p>Une démarche claire pour signaler un problème et connaître vos droits.</p>
      </header>

      <div className="returns-notice">
        <strong>Notre politique commerciale : la reprise des produits défectueux.</strong>
        <p>Hors droits légaux, ETS TAHA SHOP ne propose pas de reprise pour simple changement d’avis. Cette politique volontaire ne limite jamais les droits impératifs de rétractation, de garantie, de conformité ou les recours en cas d’inexécution.</p>
      </div>

      <nav className="returns-toc" aria-label="Sommaire des conditions de retour">
        {sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <section id="perimetre">
        <h2>1. Produits et situations concernés</h2>
        <p>Ces conditions concernent les achats auprès d’ETS TAHA SHOP, notamment les articles de bureautique, l’électroménager et les produits Longrich. Signalez un appareil en panne, un produit abîmé à la livraison, une fuite, un défaut de fabrication, un article erroné ou ne correspondant pas à la commande.</p>
        <p>L’usure normale ou un dommage causé par une mauvaise utilisation ne constitue pas, à lui seul, un défaut du produit. Chaque situation est examinée individuellement : aucune exclusion automatique ne supprime vos droits légaux.</p>
      </section>

      <section id="signaler">
        <h2>2. Comment signaler un défaut</h2>
        <p>Contactez-nous dès la découverte du problème, de préférence par email pour conserver une trace écrite :</p>
        <ul>
          <li>Email : <a href={`mailto:${SHOP_CONTACT_EMAIL}`}>{SHOP_CONTACT_EMAIL}</a>.</li>
          <li>Téléphone / WhatsApp : <a href={`https://wa.me/${SHOP_CONTACT_PHONE.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">{SHOP_CONTACT_PHONE}</a>.</li>
        </ul>
        <p>Indiquez votre nom, vos coordonnées, le produit, la date de réception et une description du défaut. Joignez votre numéro de commande, facture, reçu ou tout justificatif permettant de retrouver l’achat. Des photos ou une courte vidéo, si réalisables sans danger, facilitent l’examen ; leur absence ne suffit pas à écarter une demande légalement fondée.</p>
      </section>

      <section id="retour">
        <h2>3. Organiser le retour et les frais</h2>
        <p>Avant une expédition, contactez la boutique pour obtenir l’adresse exacte et convenir du dépôt, de l’enlèvement ou du transport adapté. Cette coordination ne conditionne pas l’exercice d’un droit légal : notifiez votre demande dans les délais applicables, même si les modalités de transport restent à organiser.</p>
        <p>Protégez le produit, joignez les accessoires utiles au diagnostic et gardez la preuve d’envoi. Conservez l’emballage d’origine si possible ; son absence n’annule pas à elle seule vos droits légaux.</p>
        <p>La répartition des frais est précisée avant le retour selon son motif et les règles applicables. Les frais légalement dus par le vendeur ne sont pas transférés au client. Pour une rétractation, seuls les frais directs de renvoi peuvent être imputés au consommateur ; ils ne sont pas à sa charge si le mauvais produit a été livré (article 17 du décret de 2008). Pour une garantie conventionnelle applicable, le fournisseur supporte le transport ou l’expédition (article 52 de la loi de 2021).</p>
      </section>

      <section id="solutions">
        <h2>4. Examen, réparation, remplacement ou remboursement</h2>
        <p>La boutique examine le produit et les éléments transmis, puis communique le constat et la solution proposée. Selon le défaut, le droit applicable et vos choix lorsqu’ils sont prévus par la loi, la solution peut être une réparation, un remplacement, une réduction du prix ou un remboursement. Aucun ordre imposant systématiquement une réparation préalable ne vous prive d’un recours légal.</p>
        <p>Les modalités et le délai de traitement sont communiqués pour votre dossier. Aucun délai commercial fixe ni garantie fabricant supplémentaire n’est annoncé ici. Un avoir ne peut pas remplacer un remboursement légalement dû sans votre accord.</p>
      </section>

      <section id="precautions">
        <h2>5. Précautions pour les appareils et les produits Longrich</h2>
        <p><strong>Bureautique et électroménager.</strong> En cas de risque électrique, de surchauffe ou de fuite, cessez l’utilisation et débranchez l’appareil si cela peut être fait sans danger. Évitez un démontage ; photographiez la référence et le numéro de série. Sauvegardez vos données et retirez comptes, supports et informations personnelles si possible, sans masquer le défaut. Organisez avec nous le transport des appareils lourds ou fragiles.</p>
        <p><strong>Longrich.</strong> Gardez le contenant, l’étiquette, le numéro de lot, la date de péremption et les scellés disponibles. Respectez les conditions de conservation indiquées. En cas d’anomalie, cessez l’utilisation et ne consommez pas le produit pour prouver le défaut. Une ouverture nécessaire à sa découverte ne supprime pas automatiquement la garantie. Une réaction indésirable doit aussi être signalée ; demandez un avis médical si nécessaire.</p>
      </section>

      <section id="droits">
        <h2>6. Vos droits légaux au Sénégal</h2>
        <h3>Rétractation des achats électroniques</h3>
        <p>Le décret n° 2008-718 (articles 12 à 18) prévoit sept jours ouvrables après réception d’un produit pour se rétracter sans justification ni pénalité. Notifiez votre décision sur un support durable, par exemple par email, avec les références de l’achat, et conservez-en une copie. Le défaut d’information légalement prévu porte ce délai à trois mois ; une information reçue pendant cette période fait courir les sept jours ouvrables.</p>
        <p>Les articles 21 et 22 prévoient la restitution des montants reçus au plus tard quinze jours après réception de la notification, sans frais et dans les mêmes conditions de paiement, avec majoration au taux légal en cas de retard. L’organisation du retour ne suspend pas ce délai légal.</p>
        <h3>Exceptions encadrées</h3>
        <p>L’article 16 vise notamment les produits personnalisés, ceux qui ne peuvent être réexpédiés en raison d’une détérioration ou péremption rapide, et les enregistrements audio, vidéo ou logiciels descellés ou téléchargés. Une exception doit correspondre au produit et à la situation réels. La marque Longrich, la catégorie hygiène ou la seule ouverture d’un emballage ne constituent pas une exclusion générale. Ces exceptions de rétractation ne retirent pas les recours pour défaut.</p>
        <h3>Garantie, conformité et recours</h3>
        <p>La loi n° 2021-25 protège les consommateurs contre les clauses abusives et maintient la garantie légale des vices cachés (articles 49 à 57). Le COCC prévoit notamment, pour un vice caché ouvrant droit à garantie, le choix entre rendre le produit contre restitution du prix ou le conserver avec réduction du prix (article 298). L’action doit être engagée dans un bref délai apprécié selon les circonstances (article 300) : signalez le problème rapidement.</p>
        <p>Les droits à une livraison conforme à la commande, les garanties légales et les recours prévus par les textes applicables restent préservés. Une éventuelle garantie fabricant s’ajoute à ces droits selon son document propre ; elle ne remplace pas les obligations du vendeur. En cas de désaccord, vous pouvez saisir les services compétents du commerce ou la juridiction compétente.</p>
      </section>

      <aside className="returns-notice" aria-labelledby="returns-details">
        <h2 id="returns-details">Informations à confirmer auprès de la boutique</h2>
        <p>L’adresse physique de retour, les modalités d’enlèvement, les tarifs éventuels, les délais commerciaux de diagnostic et les garanties propres à chaque fabricant ne sont pas renseignés ici. Contactez-nous pour ces informations avant l’expédition. Vos délais et droits légaux restent applicables.</p>
      </aside>

      <section className="returns-sources" aria-labelledby="returns-sources-title">
        <h2 id="returns-sources-title">Textes de référence</h2>
        <p>Vérification documentaire : 25 octobre 2026.</p>
        <ul>
          <li><a href="https://www.archives.sn/docs/journal-officiel/JO-6440-du-29-novembre-2008" target="_blank" rel="noopener noreferrer">Décret n° 2008-718 du 30 juin 2008 — Journal officiel n° 6440</a> (<a href="https://www.osiris.sn/Decret-no-2008-718-du-30-juin-2008.html" target="_blank" rel="noopener noreferrer">texte consultable</a>), application de la loi n° 2008-08 sur les transactions électroniques.</li>
          <li><a href="https://www.vie-publique.sn/docs/078ef41b-ea43-466b-85f5-6244700fd424/JO-7438-du-10-juillet-2021.pdf" target="_blank" rel="noopener noreferrer">Loi n° 2021-25 du 12 avril 2021 sur les prix et la protection du consommateur — Journal officiel n° 7438</a>.</li>
          <li><a href="https://www.vie-publique.sn/docs/869cc7c4-a0cb-4087-bd60-05b59abb7462/code-des-obligations-civiles-et-commerciales.pdf" target="_blank" rel="noopener noreferrer">Code des obligations civiles et commerciales — articles 295 à 303</a>.</li>
        </ul>
      </section>
    </article>
  )
}
