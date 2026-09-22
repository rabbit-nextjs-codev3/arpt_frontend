/**
 * Données de démonstration alignées sur le schéma Prisma de l'ARPT.
 * (Aucun backend branché : contenu fictif à des fins de maquette.)
 */

export type Statut =
  | "NOUVEAU"
  | "EN_COURS"
  | "TRAITE"
  | "REJETE"
  | "RESOLU"
  | "OUVERT"
  | "CLOTURE"
  | "ANNULE"
  | "HOMOLOGUE"
  | "INTERDIT"
  | "OUVERTE"
  | "CLOTUREE"
  | "ACCEPTE"
  | "REFUSE";


export const members = [
    { 
      name: "M. Mamady Doumbouya", 
      role: "Directeur général",
       image: "/images/arpt/mamady-doumbouya.jpeg" 

    },
    { 
      name: "M. Adama Condé",
      role: "Directeur général adjoint",
      image: "/images/arpt/adama-conde.jpg" 
      
      },
    { 
      name: "M. Djiba Diakite",
      role: "Membre du conseil d'administration",
      image: "/images/arpt/djiba-arpt.jpeg" 
      
      },
    { 
      name: "M. Mohamed Sacko",
      role: "Member",
      image: "/images/arpt/mohamed.jpeg" 
      
      },
    { 
      name: "M. Moussa Kaba",
      role: "Member",
      image: "/images/arpt/kabaci.jpeg" 
      
      },
    { 
      name: "M. Fany Zeze  Camara",
      role: "Member",
      image: "/images/arpt/zeze.jpeg" 
      
      },
    
];


export const libelleStatut: Record<Statut, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  TRAITE: "Traité",
  REJETE: "Rejeté",
  RESOLU: "Résolu",
  OUVERT: "Ouvert",
  CLOTURE: "Clôturé",
  ANNULE: "Annulé",
  HOMOLOGUE: "Homologué",
  INTERDIT: "Interdit",
  OUVERTE: "Ouverte",
  CLOTUREE: "Clôturée",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
};

export const contactArpt = {
  adresse: "Immeuble ARPT, Centre Directionnel de Koloma, Conakry, République de Guinée",
  telephone: "+224 669 221 000",
  email: "contact@arpt.gov.gn",
  horaires: "Lundi – Vendredi, 08h00 – 17h00",
};

export const services = [
  {
    id: 1,
    slug: "licence-operateur",
    nom: "Licence d'opérateur de télécommunications",
    description:
      "Délivrance et renouvellement des licences d'exploitation de réseaux et services de télécommunications ouverts au public.",
    delai: "45 jours ouvrés",
    cout: "Selon barème officiel",
    documents: [
      "Statuts de la société certifiés conformes",
      "Registre du commerce (RCCM)",
      "Plan d'affaires et plan technique",
      "Quitus fiscal en cours de validité",
    ],
  },
  {
    id: 2,
    slug: "homologation-equipements",
    nom: "Homologation des équipements",
    description:
      "Agrément technique des terminaux et équipements radioélectriques avant leur mise sur le marché guinéen.",
    delai: "21 jours ouvrés",
    cout: "1 500 000 GNF",
    documents: [
      "Fiche technique du constructeur",
      "Certificat de conformité international",
      "Échantillon de l'équipement",
    ],
  },
  {
    id: 3,
    slug: "assignation-frequences",
    nom: "Assignation de fréquences",
    description:
      "Attribution, modification et contrôle des assignations du spectre radioélectrique national.",
    delai: "30 jours ouvrés",
    cout: "Selon bande et puissance",
    documents: ["Formulaire de demande signé", "Dossier technique du réseau", "Licence en cours de validité"],
  },
  {
    id: 4,
    slug: "numerotation",
    nom: "Attribution de ressources en numérotation",
    description:
      "Gestion du plan national de numérotation : blocs de numéros, codes courts et numéros spéciaux.",
    delai: "15 jours ouvrés",
    cout: "Selon type de ressource",
    documents: ["Justificatif d'activité", "Prévisions d'utilisation des ressources"],
  },
  {
    id: 5,
    slug: "agrement-installateur",
    nom: "Agrément d'installateur",
    description:
      "Reconnaissance officielle des entreprises habilitées à installer et maintenir des équipements de télécommunications.",
    delai: "20 jours ouvrés",
    cout: "800 000 GNF",
    documents: ["RCCM", "CV des techniciens", "Références de chantiers"],
  },
  {
    id: 6,
    slug: "autorisation-postale",
    nom: "Autorisation d'activité postale",
    description:
      "Autorisation d'exercice pour les opérateurs postaux et de services de courrier express sur le territoire national.",
    delai: "30 jours ouvrés",
    cout: "2 000 000 GNF",
    documents: ["Statuts", "Attestation d'assurance", "Description du réseau de distribution"],
  },
];

export const actualites = [
  {
    id: 1,
    titre: "L'ARPT publie le rapport annuel 2025 du secteur des télécommunications",
    extrait:
      "Le rapport présente l'évolution du parc d'abonnés, la couverture 4G et les investissements réalisés par les opérateurs.",
    contenu:
      "L'Autorité de Régulation des Postes et Télécommunications a rendu public son rapport annuel 2025. Le document dresse un état des lieux complet du marché : progression du parc mobile, densification des sites 4G, qualité de service mesurée dans les huit régions administratives et perspectives d'ouverture de la 5G. L'Autorité y réaffirme sa mission de garant d'une concurrence loyale et de protection des consommateurs.",
    categorie: "Publication",
    date: "2026-08-28",
    vues: 1842,
    image: "/images/arpt/siege-arpt.jpeg",
  },
  {
    id: 2,
    titre: "Campagne nationale d'identification des abonnés mobiles",
    extrait:
      "Une nouvelle phase de la campagne d'identification débute dans les préfectures de l'intérieur du pays.",
    contenu:
      "Dans le cadre de la sécurisation du parc mobile national, l'ARPT lance une nouvelle phase de la campagne d'identification des abonnés. Les opérateurs sont tenus de déployer des points d'enregistrement dans chaque préfecture et de suspendre les lignes non identifiées à l'issue du délai réglementaire.",
    categorie: "Régulation",
    date: "2026-08-12",
    vues: 2301,
    image: "/images/arpt/controle-qualite.jpg",
  },
  {
    id: 3,
    titre: "Atelier régional sur la cybersécurité des infrastructures critiques",
    extrait:
      "L'ARPT a accueilli à Conakry les régulateurs de la sous-région pour trois jours d'échanges techniques.",
    contenu:
      "Un atelier régional consacré à la protection des infrastructures critiques de télécommunications s'est tenu à Conakry. Les travaux ont porté sur la coordination des réponses aux incidents, le partage de renseignement sur les menaces et l'harmonisation des cadres réglementaires en Afrique de l'Ouest.",
    categorie: "Événement",
    date: "2026-07-30",
    vues: 964,
    image: "/images/djiba.jpeg",
  },
  {
    id: 4,
    titre: "Baisse des tarifs d'interconnexion mobile à compter du 1er octobre",
    extrait:
      "La décision fixe les nouveaux plafonds de terminaison d'appel applicables à tous les opérateurs.",
    contenu:
      "Après consultation publique, l'Autorité a adopté une décision fixant de nouveaux plafonds de terminaison d'appel mobile. Cette baisse progressive vise à réduire les coûts supportés par les consommateurs et à stimuler la concurrence sur le marché de détail.",
    categorie: "Décision",
    date: "2026-07-15",
    vues: 3117,
    image: "/images/group.jpeg",
  },
];

export const communiques = [
  {
    id: 1,
    titre: "Avis d'ouverture des plis — AO n°2026/014",
    date: "2026-09-02",
    contenu:
      "L'ouverture des plis relatifs à l'appel d'offres n°2026/014 aura lieu le 15 septembre 2026 à 10h00 dans la salle de conférence du siège de l'ARPT.",
  },
  {
    id: 2,
    titre: "Prorogation du délai de soumission — AO n°2026/011",
    date: "2026-08-21",
    contenu:
      "Le délai de dépôt des offres pour l'appel d'offres n°2026/011 est prorogé de quinze (15) jours calendaires.",
  },
  {
    id: 3,
    titre: "Avis de recrutement d'un cabinet d'audit organisationnel",
    date: "2026-08-05",
    contenu:
      "L'ARPT recherche un cabinet spécialisé pour la conduite d'un audit organisationnel et fonctionnel de ses directions techniques.",
  },
];

export const reglementations = [
  {
    id: 1,
    nom: "Loi L/2015/018/AN relative aux télécommunications et TIC",
    categorie: "Loi",
    format: "PDF",
    date: "2015-06-13",
    populaire: true,
    vues: 8420,
  },
  {
    id: 2,
    nom: "Décret portant organisation et fonctionnement de l'ARPT",
    categorie: "Décret",
    format: "PDF",
    date: "2016-02-04",
    populaire: true,
    vues: 5210,
  },
  {
    id: 3,
    nom: "Décision fixant les plafonds de terminaison d'appel mobile",
    categorie: "Décision",
    format: "PDF",
    date: "2026-07-15",
    populaire: true,
    vues: 3980,
  },
  {
    id: 4,
    nom: "Arrêté relatif à l'homologation des équipements terminaux",
    categorie: "Arrêté",
    format: "PDF",
    date: "2019-11-22",
    populaire: false,
    vues: 2140,
  },
  {
    id: 5,
    nom: "Cadre réglementaire du partage d'infrastructures passives",
    categorie: "Décision",
    format: "PDF",
    date: "2022-03-09",
    populaire: false,
    vues: 1755,
  },
  {
    id: 6,
    nom: "Charte de qualité de service des réseaux mobiles",
    categorie: "Directive",
    format: "PDF",
    date: "2024-01-18",
    populaire: false,
    vues: 1320,
  },
];

export const equipements = [
  {
    id: 1,
    code: "EQ-2026-0142",
    nom: "Routeur 4G LTE X200",
    marque: "Huawei",
    modele: "B535-232",
    categorie: "Terminaux data",
    statut: "HOMOLOGUE" as const,
    numero: "HOM/2026/0142",
    validite: "2028-04-30",
  },
  {
    id: 2,
    code: "EQ-2026-0157",
    nom: "Terminal satellitaire portable",
    marque: "Inmarsat",
    modele: "IsatPhone 2",
    categorie: "Satellite",
    statut: "EN_COURS" as const,
    numero: null,
    validite: null,
  },
  {
    id: 3,
    code: "EQ-2025-0098",
    nom: "Brouilleur de fréquences mobile",
    marque: "Générique",
    modele: "JX-1000",
    categorie: "Équipements radio",
    statut: "INTERDIT" as const,
    numero: null,
    validite: null,
  },
  {
    id: 4,
    code: "EQ-2026-0163",
    nom: "Smartphone A55 5G",
    marque: "Samsung",
    modele: "SM-A556",
    categorie: "Terminaux mobiles",
    statut: "HOMOLOGUE" as const,
    numero: "HOM/2026/0163",
    validite: "2029-01-15",
  },
  {
    id: 5,
    code: "EQ-2026-0170",
    nom: "Station de base pico-cellulaire",
    marque: "Nokia",
    modele: "Flexi Zone",
    categorie: "Infrastructure réseau",
    statut: "HOMOLOGUE" as const,
    numero: "HOM/2026/0170",
    validite: "2030-06-01",
  },
];

export const appelsOffres = [
  {
    id: 1,
    code: "AO-2026-014",
    nom: "Fourniture d'un système de supervision du spectre radioélectrique",
    description:
      "Acquisition et installation d'un système de mesure et de surveillance du spectre couvrant les huit régions administratives, incluant la formation des équipes techniques. Le marché comprend également la maintenance corrective et évolutive sur trois ans ainsi que l'intégration avec les outils de contrôle déjà déployés par l'Autorité.",
    categorie: "Fournitures",
    statut: "OUVERT" as const,
    publication: "2026-08-18",
    limite: "2026-09-15",
    budget: "4 500 000 000 GNF",
    nouveau: true,
    soumissions: 6,
  },
  {
    id: 2,
    code: "AO-2026-011",
    nom: "Audit organisationnel et fonctionnel des directions techniques",
    description:
      "Diagnostic des processus internes, des effectifs et des outils des directions techniques, avec recommandations d'optimisation à horizon 2027. Le cabinet retenu conduira des entretiens avec l'ensemble des directions concernées et proposera un plan de mise en œuvre priorisé sur dix-huit mois.",
    categorie: "Services",
    statut: "OUVERT" as const,
    publication: "2026-07-28",
    limite: "2026-09-20",
    budget: "980 000 000 GNF",
    nouveau: false,
    soumissions: 11,
  },
  {
    id: 3,
    code: "AO-2026-006",
    nom: "Travaux de réhabilitation du centre de contrôle de Kankan",
    description:
      "Rénovation du bâtiment, mise aux normes électriques et remplacement des équipements de contrôle du centre régional de Kankan. Les travaux incluent la réfection de la toiture, l'installation d'un groupe électrogène de secours et la sécurisation périmétrique du site.",
    categorie: "Travaux",
    statut: "CLOTURE" as const,
    publication: "2026-04-10",
    limite: "2026-05-30",
    budget: "2 100 000 000 GNF",
    nouveau: false,
    soumissions: 9,
  },
];

export const offresEmploi = [
  {
    id: 1,
    code: "REC-2026-08",
    intitule: "Ingénieur régulation du spectre",
    departement: "Direction technique",
    lieu: "Conakry",
    contrat: "CDI",
    salaire: "Selon grille interne",
    publication: "2026-08-20",
    limite: "2026-09-30",
    nouveau: true,
    candidats: 24,
    description:
      "Vous participez à la planification, à l'assignation et au contrôle du spectre radioélectrique national, en lien avec les opérateurs et les instances internationales. Vous intervenez aussi bien sur les dossiers techniques que sur le terrain, lors des campagnes de mesure, et contribuez à la préparation des positions guinéennes dans les négociations internationales sur le spectre.",
    missions: [
      "Instruire les demandes d'assignation de fréquences",
      "Conduire les campagnes de contrôle et de mesure sur le terrain",
      "Contribuer à la préparation des positions nationales à l'UIT",
    ],
    profil: [
      "Diplôme d'ingénieur en télécommunications (Bac+5)",
      "Trois années d'expérience minimum en radiocommunications",
      "Maîtrise du français et de l'anglais technique",
    ],
    contactName: "Direction des ressources humaines",
    contactEmail: "recrutement@arpt.gov.gn",
    avantages: ["Couverture santé familiale", "Formation continue certifiante", "Prime de rendement annuelle"],
  },
  {
    id: 2,
    code: "REC-2026-09",
    intitule: "Juriste en régulation des communications électroniques",
    departement: "Direction des affaires juridiques",
    lieu: "Conakry",
    contrat: "CDI",
    salaire: "Selon grille interne",
    publication: "2026-08-25",
    limite: "2026-10-10",
    nouveau: true,
    candidats: 37,
    description:
      "Vous sécurisez juridiquement les décisions de l'Autorité et accompagnez l'élaboration des textes réglementaires du secteur. Vous travaillez en lien étroit avec les directions techniques pour anticiper les risques contentieux et représentez l'Autorité dans les procédures impliquant les opérateurs ou les instances de tutelle.",
    missions: [
      "Rédiger avis, décisions et projets de textes",
      "Assurer le suivi des contentieux sectoriels",
      "Animer les consultations publiques",
    ],
    profil: [
      "Master 2 en droit public ou droit du numérique",
      "Expérience en régulation ou en administration publique",
      "Excellentes qualités rédactionnelles",
    ],
    contactName: "Direction des ressources humaines",
    contactEmail: "recrutement@arpt.gov.gn",
    avantages: ["Couverture santé familiale", "Télétravail partiel", "Accompagnement à la mobilité"],
  },
  {
    id: 3,
    code: "REC-2026-10",
    intitule: "Analyste protection des consommateurs",
    departement: "Direction des consommateurs",
    lieu: "Kindia",
    contrat: "CDD 24 mois",
    salaire: "Selon grille interne",
    publication: "2026-09-01",
    limite: "2026-10-20",
    nouveau: false,
    candidats: 12,
    description:
      "Vous traitez les réclamations des usagers, analysez les tendances et proposez des mesures correctives auprès des opérateurs. Basé à Kindia, vous couvrez plusieurs préfectures de l'intérieur et menez des actions de sensibilisation auprès du public sur ses droits en tant que consommateur de services télécoms et postaux.",
    missions: [
      "Instruire les réclamations reçues via le portail",
      "Produire les tableaux de bord mensuels de traitement",
      "Mener des actions de sensibilisation en région",
    ],
    profil: [
      "Bac+4 en droit, économie ou gestion",
      "Sens de l'écoute et de la médiation",
      "Maîtrise des outils bureautiques et statistiques",
    ],
    contactName: "Direction des ressources humaines",
    contactEmail: "recrutement@arpt.gov.gn",
    avantages: ["Prime de terrain", "Formation en médiation", "Perspective de titularisation"],
  },
];

export const consultations = [
  {
    id: 1,
    titre: "Projet de décision sur la portabilité des numéros mobiles",
    description:
      "L'Autorité soumet à l'avis du public son projet de décision encadrant la portabilité des numéros entre opérateurs mobiles.",
    statut: "OUVERTE" as const,
    debut: "2026-08-15",
    fin: "2026-09-30",
    email: "consultations@arpt.gov.gn",
  },
  {
    id: 2,
    titre: "Cadre d'attribution des fréquences 5G",
    description:
      "Consultation préalable sur les modalités d'attribution des bandes 3,5 GHz et 26 GHz pour les services 5G.",
    statut: "OUVERTE" as const,
    debut: "2026-09-01",
    fin: "2026-10-31",
    email: "consultations@arpt.gov.gn",
  },
  {
    id: 3,
    titre: "Révision du catalogue d'interconnexion",
    description: "Consultation clôturée relative à la révision du catalogue d'interconnexion des opérateurs.",
    statut: "CLOTUREE" as const,
    debut: "2026-03-01",
    fin: "2026-04-15",
    email: "consultations@arpt.gov.gn",
  },
];

export const indicateurs = [
  { libelle: "Abonnés mobiles", valeur: "16,4 M", evolution: "+4,2 % sur un an" },
  { libelle: "Taux de pénétration", valeur: "112 %", evolution: "+3,1 points" },
  { libelle: "Opérateurs actifs", valeur: "4", evolution: "Stable" },
  { libelle: "Sites 4G en service", valeur: "3 268", evolution: "+312 sites" },
];

export const abonnesParMois = [
  { mois: "Jan", abonnes: 15.1 },
  { mois: "Fév", abonnes: 15.3 },
  { mois: "Mar", abonnes: 15.5 },
  { mois: "Avr", abonnes: 15.7 },
  { mois: "Mai", abonnes: 15.9 },
  { mois: "Juin", abonnes: 16.0 },
  { mois: "Juil", abonnes: 16.2 },
  { mois: "Août", abonnes: 16.4 },
];

export const caParTrimestre = [
  { trimestre: "T1 2025", ca: 1820 },
  { trimestre: "T2 2025", ca: 1905 },
  { trimestre: "T3 2025", ca: 1988 },
  { trimestre: "T4 2025", ca: 2140 },
  { trimestre: "T1 2026", ca: 2210 },
  { trimestre: "T2 2026", ca: 2305 },
];

export const rapports = [
  { id: 1, titre: "Rapport annuel du secteur des télécommunications 2025", secteur: "Télécom", annee: 2025, format: "PDF", taille: "4,2 Mo", telechargements: 1820 },
  { id: 2, titre: "Observatoire tarifaire — 2e trimestre 2026", secteur: "Tarifaire", annee: 2026, format: "XLSX", taille: "1,1 Mo", telechargements: 640 },
  { id: 3, titre: "Rapport du secteur postal 2025", secteur: "Postal", annee: 2025, format: "PDF", taille: "2,8 Mo", telechargements: 415 },
  { id: 4, titre: "Observatoire du marché mobile — 1er trimestre 2026", secteur: "Télécom", annee: 2026, format: "PDF", taille: "3,4 Mo", telechargements: 1102 },
];

/* ── Portail usager ── */

export const mesReclamations = [
  { id: "REC-4821", type: "Qualité de service", operateur: "Orange Guinée", statut: "EN_COURS" as const, date: "2026-08-30" },
  { id: "REC-4655", type: "Facturation", operateur: "MTN Guinée", statut: "RESOLU" as const, date: "2026-07-11" },
  { id: "REC-4390", type: "Réseau", operateur: "Cellcom", statut: "REJETE" as const, date: "2026-05-02" },
];

export const mesCandidatures = [
  { id: "CAND-882", poste: "Ingénieur régulation du spectre", statut: "EN_COURS" as const, date: "2026-08-26" },
  { id: "CAND-771", poste: "Analyste protection des consommateurs", statut: "NOUVEAU" as const, date: "2026-09-03" },
];

export const mesSoumissions = [
  { id: "SUB-311", appel: "AO-2026-011 — Audit organisationnel", statut: "NOUVEAU" as const, date: "2026-08-29" },
];

export const notifications = [
  { id: 1, titre: "Votre réclamation REC-4821 est en cours d'instruction", date: "2026-09-01", lu: false },
  { id: 2, titre: "Nouvel appel d'offres publié : AO-2026-014", date: "2026-08-18", lu: false },
  { id: 3, titre: "Votre candidature CAND-882 a bien été reçue", date: "2026-08-26", lu: true },
];

/* ── Admin ── */

export const kpisAdmin = [
  { libelle: "Réclamations ouvertes", valeur: "128", detail: "+12 cette semaine" },
  { libelle: "Demandes de service", valeur: "76", detail: "18 nouvelles" },
  { libelle: "Candidatures reçues", valeur: "342", detail: "3 offres actives" },
  { libelle: "Messages non lus", valeur: "23", detail: "Formulaire de contact" },
];

export const reclamationsAdmin = [
  { id: "REC-4821", usager: "Mamadou Diallo", type: "Qualité de service", operateur: "Orange Guinée", statut: "EN_COURS" as const, date: "2026-08-30" },
  { id: "REC-4830", usager: "Aissatou Barry", type: "Facturation", operateur: "MTN Guinée", statut: "NOUVEAU" as const, date: "2026-09-02" },
  { id: "REC-4834", usager: "Sékou Camara", type: "Réseau", operateur: "Cellcom", statut: "NOUVEAU" as const, date: "2026-09-04" },
  { id: "REC-4799", usager: "Fatoumata Sylla", type: "Autre", operateur: "Guinée Poste", statut: "RESOLU" as const, date: "2026-08-19" },
];

export const demandesServiceAdmin = [
  { id: "DS-1204", service: "Homologation des équipements", societe: "TechCom SARL", statut: "NOUVEAU" as const, date: "2026-09-03" },
  { id: "DS-1198", service: "Assignation de fréquences", societe: "Radio Nimba", statut: "EN_COURS" as const, date: "2026-08-27" },
  { id: "DS-1187", service: "Agrément d'installateur", societe: "Guinée Réseaux", statut: "TRAITE" as const, date: "2026-08-14" },
];

export const journalAudit = [
  { id: 1, acteur: "admin@arpt.gov.gn", action: "Publication d'une actualité", entite: "Actuality #12", date: "2026-09-04 10:22" },
  { id: 2, acteur: "juridique@arpt.gov.gn", action: "Mise à jour d'une réglementation", entite: "Regulation #5", date: "2026-09-03 16:41" },
  { id: 3, acteur: "admin@arpt.gov.gn", action: "Changement de statut réclamation", entite: "Claim #4821", date: "2026-09-01 09:05" },
];

export function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
