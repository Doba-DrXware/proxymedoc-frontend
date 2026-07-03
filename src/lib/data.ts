export type Role = 'patient' | 'pharmacie' | 'admin';

export interface Medicament {
  nom: string;
  prix: number;
  stock: number;
  description: string;
  dispo?: boolean;
  image: string;
  categorie: 'antibiotique' | 'analgesique' | 'anti-inflammatoire' | 'antidiabetique' | 'antihypertenseur' | 'antiulcereux' | 'antihistaminique' | 'autre';
}

const medDescriptions: Record<string, string> = {
  Amoxicilline: `Amoxicilline est un antibiotique de la famille des pénicillines utilisé pour traiter une grande variété d’infections bactériennes. La notice doit indiquer qu’il est prescrit pour les infections des voies respiratoires supérieures et inférieures, les infections urinaires, les infections cutanées et certaines infections ORL. Il agit en inhibant la synthèse de la paroi cellulaire bactérienne, provoquant la lyse des bactéries sensibles. Le traitement doit se faire sur la durée prescrite même si les symptômes s’améliorent rapidement, afin d’éviter la résistance. Il est contre-indiqué en cas d’allergie documentée aux pénicillines ou aux céphalosporines, ainsi qu’en cas de mononucléose infectieuse. Les effets indésirables les plus fréquents incluent diarrhée, nausées, vomissements, candidose buccale et éruption cutanée. Une attention particulière est nécessaire en cas d’insuffisance rénale : un ajustement de la dose peut être nécessaire. En cas de réaction allergique sévère (urticaire, œdème de Quincke, bronchospasme), arrêter immédiatement le traitement et consulter un médecin. Ne pas partager le médicament et respectez les dates de péremption. Composition : amoxicilline tri-hydratée 250 mg, 500 mg ou 1000 mg selon le dosage, avec des excipients adaptés pour la stabilité du comprimé.`,
  Paracétamol: `Paracétamol est un analgésique et antipyrétique de première intention, largement utilisé pour soulager les douleurs légères à modérées et réduire la fièvre. La notice précise qu’il est indiqué en cas de maux de tête, douleurs dentaires, courbatures, états grippaux et douleurs arthritiques légères. Il agit en inhibant la synthèse des prostaglandines dans le système nerveux central et possède un faible effet anti-inflammatoire périphérique. La dose habituelle chez l’adulte est de 500 mg à 1 g, toutes les 4 à 6 heures, sans dépasser 4 g par jour. La notice rappelle qu’en cas de consommation d’alcool régulière ou d’insuffisance hépatique, la dose maximale doit être réduite. Le surdosage est dangereux et peut provoquer une hépatotoxicité sévère, pouvant entraîner une insuffisance hépatique aiguë. Les signes de surdosage peuvent n’apparaître que plusieurs heures après la prise et incluent nausées, vomissements, douleurs abdominales et coloration jaunâtre de la peau. En cas de doute, consulter un médecin ou un centre antipoison immédiatement. Ce médicament ne doit pas être combiné avec d’autres produits contenant du paracétamol. Composition : paracétamol 500 mg, 650 mg ou 1000 mg selon la présentation, avec des excipients neutres tels que cellulose microcristalline et stéarate de magnésium.`,
  Ibuprofène: `Ibuprofène est un anti-inflammatoire non stéroïdien (AINS) utilisé pour traiter les douleurs légères à modérées, les inflammations et la fièvre. Il est indiqué dans les affections musculo-squelettiques, les dysménorrhées, les céphalées et les états fébriles. Son action repose sur l’inhibition réversible des enzymes COX-1 et COX-2, ce qui réduit la production de prostaglandines inflammatoires. La notice doit préciser de le prendre au cours d’un repas ou avec un verre de lait pour diminuer le risque d’irritation gastrique. Il est contre-indiqué en cas d’antécédent d’ulcère gastro-duodénal, de saignement gastro-intestinal, de maladie inflammatoire de l’intestin, d’insuffisance rénale sévère, d’insuffisance cardiaque décompensée ou d’asthme induit par les AINS. Les effets secondaires peuvent inclure douleurs abdominales, brûlures gastriques, nausées, diarrhée, maux de tête, vertiges et rétention hydrique. Une utilisation prolongée augmente le risque d’ulcères, de perforations et de saignements digestifs. En cas de douleur persistante ou de signes d’hémorragie (selles noires, vomissements de sang), arrêter le traitement et consulter un médecin. Composition : ibuprofène 200 mg, 400 mg ou 600 mg selon la présentation, avec des excipients tels que lactose, amidon et stéarate de magnésium.`,
  Métformine: `Métformine est un médicament antidiabétique oral appartenant à la classe des biguanides, indiqué dans le traitement du diabète de type 2, en particulier chez les patients en surpoids et présentant une insulinorésistance. Elle agit principalement en diminuant la production hépatique de glucose et en augmentant la sensibilité à l’insuline des tissus périphériques. La notice mentionne que la prise se fait préférentiellement au cours d’un repas pour limiter les troubles digestifs. Les effets indésirables les plus fréquents sont des nausées, des diarrhées, des douleurs abdominales et une perte d’appétit, souvent transitoires. Elle est contre-indiquée en cas d’insuffisance rénale sévère, d’insuffisance hépatique, de décompensation cardiaque ou en cas de risque accru d’acidose lactique. L’acidose lactique est un effet indésirable rare mais grave, se manifestant par une fatigue extrême, des douleurs musculaires, une respiration rapide et un malaise. La notice conseille de surveiller la fonction rénale avant et pendant le traitement, ainsi que d’informer son médecin de toute intervention chirurgicale programmée ou d’un examen avec produit de contraste iodé. Composition : chlorhydrate de métformine 500 mg, 850 mg ou 1000 mg selon la formulation, avec des excipients comme hypromellose et stéarate de magnésium.`,
  Amlodipine: `Amlodipine est un antihypertenseur de la classe des inhibiteurs calciques dihydropyridiniques, utilisé pour traiter l’hypertension artérielle essentiale et certains patients atteints d’angor stable. Elle agit en inhibant l’entrée du calcium dans les cellules musculaires lisses vasculaires, ce qui provoque une vasodilatation progressive et réduit la résistance vasculaire périphérique. La notice précise que la prise doit être quotidienne et le plus souvent à heure fixe, indépendamment des repas. Les effets indésirables courants comprennent œdèmes des chevilles, maux de tête, rougeur faciale, fatigue, vertiges et palpitations. Chez certains patients, une hypotension excessive peut survenir, en particulier lors de la première administration ou lors de l’augmentation de la dose. Il est recommandé de surveiller la pression artérielle régulièrement. La notice doit signaler que ce médicament peut être utilisé seul ou en association avec d’autres antihypertenseurs, et qu’un avis médical est nécessaire en cas de douleurs thoraciques nouvelles ou d’essoufflement. Composition : amlodipine besilate 5 mg ou 10 mg, avec des excipients tels que cellulose microcristalline et talc.`,
  Oméprazole: `Oméprazole est un inhibiteur de la pompe à protons (IPP) utilisé pour réduire la sécrétion acide gastrique. Il est indiqué pour le traitement des ulcères gastriques et duodénaux, du reflux gastro-œsophagien symptomatique et de l’éradication d’Helicobacter pylori en association avec des antibiotiques. Il inhibe de manière sélective et irréversible la H+/K+-ATPase des cellules pariétales gastriques. La notice rappelle que la prise se fait de préférence le matin, au moins 30 minutes avant le repas, pour maximiser l’effet antiacide. Les effets indésirables possibles incluent maux de tête, diarrhée, douleurs abdominales, nausées, flatulences et étourdissements. Un traitement prolongé peut nécessiter une surveillance de la vitamine B12 et du magnésium, ainsi qu’une attention portée au risque d’ostéoporose et de fractures chez les patients exposés. Oméprazole peut interagir avec certains médicaments comme le clopidogrel, la warfarine, les benzodiazépines et le méthotrexate. La notice indique de ne pas interrompre brusquement le traitement sans avis médical et de consulter en cas de symptômes persistants ou de saignement gastro-intestinal. Composition : oméprazole 20 mg ou 40 mg en gélule gastro-résistante, avec des excipients tels que carbonates et silicates.`,
  Aspirine: `Aspirine, également appelée acide acétylsalicylique, est un médicament aux propriétés analgésiques, antipyrétiques et antiagrégantes plaquettaires. Elle est indiquée pour le soulagement des douleurs légères à modérées, la fièvre, ainsi que pour la prévention secondaire des accidents vasculaires cérébraux et des infarctus du myocarde chez certains patients à risque cardiovasculaire. La notice doit spécifier qu’elle réduit la production de prostaglandines et inhibe l’agrégation des plaquettes sanguines. Chez l’enfant, l’aspirine est contre-indiquée en cas de varicelle ou de grippe en raison du risque de syndrome de Reye, une affection grave du foie et du cerveau. Les effets indésirables incluent douleurs gastriques, brûlures d’estomac, nausées, vomissements et risque d’ulcère gastro-duodénal avec saignement. Une attention particulière est portée aux patients ayant des antécédents d’ulcère, d’asthme ou de troubles de la coagulation. La notice conseille de ne pas dépasser la dose recommandée et de consulter un médecin en cas de signe de saignement ou de réaction allergique. Composition : acide acétylsalicylique 100 mg ou 300 mg, avec des excipients tels que amidon et stéarate de magnésium.`,
  Ciprofloxacine: `Ciprofloxacine est un antibiotique de la classe des fluoroquinolones, utilisé pour traiter un large éventail d’infections bactériennes, notamment les infections urinaires, les infections respiratoires, les infections digestives et certaines infections cutanées. La notice décrit son mécanisme d’action : inhibition des topoisomérases bactériennes, enzymes nécessaires à la réplication et à la réparation de l’ADN bactérien. Il est important de souligner qu’il ne doit pas être utilisé sans prescription médicale et qu’il faut respecter la durée de traitement pour éviter le développement d’une résistance. Ciprofloxacine peut provoquer des effets indésirables tels que nausées, diarrhée, maux de tête, vertiges, insomnie et photosensibilité. Des complications plus rares incluent des tendinopathies, des rupture de tendon, des réactions cutanées sévères et des effets neurologiques. Elle est contre-indiquée chez les enfants et les adolescents en croissance, chez les femmes enceintes et chez les personnes ayant des antécédents de tendinopathie liée aux fluoroquinolones. La notice recommande de boire beaucoup d’eau pendant le traitement et d’éviter l’exposition excessive au soleil. Composition : ciprofloxacine 250 mg ou 500 mg, avec des excipients tels que cellulose microcristalline et stéarate de magnésium.`,
  Ceftriaxone: `Ceftriaxone est un antibiotique injectable de la classe des céphalosporines de troisième génération. Il est utilisé pour traiter les infections bactériennes sévères telles que les méningites bactériennes, les pneumonies, les infections intra-abdominales, les infections urinaires compliquées et certaines infections de la peau et des tissus mous. La notice doit indiquer que l’administration se fait par injection intramusculaire ou intraveineuse, et qu’elle nécessite un suivi médical pour adapter la posologie en fonction du poids et de l’état clinique du patient. Ceftriaxone agit en inhibant la synthèse de la paroi cellulaire bactérienne chez les bactéries sensibles. Elle est contre-indiquée chez les patients ayant des antécédents d’allergie aux céphalosporines ou aux pénicillines, et doit être utilisée avec prudence en cas d’insuffisance hépatique ou rénale. Les effets indésirables possibles incluent réactions au site d’injection, diarrhée, nausées, éruption cutanée et élévation des transaminases hépatiques. En cas de diarrhée persistante, il faut évaluer une colite pseudomembraneuse. La notice indique également qu’un contrôle biologique peut être nécessaire lors de traitements prolongés. Composition : ceftriaxone sodique 250 mg ou 500 mg, associée à des excipients pour préparation injectable, tels que citrate de sodium.`,
  Diclofénac: `Diclofénac est un anti-inflammatoire non stéroïdien (AINS) utilisé pour soulager les douleurs et l’inflammation associées aux affections rhumatologiques, aux lombalgies, aux douleurs articulaires et aux traumatismes. La notice précise qu’il est indiqué pour le traitement symptomatique de la douleur aiguë et de l’inflammation, mais qu’il ne guérit pas la cause sous-jacente. Il agit en inhibant les enzymes COX responsables de la production de prostaglandines inflammatoires. Diclofénac doit être pris à la dose minimale efficace pendant la durée la plus courte possible, de préférence au cours des repas pour réduire l’irritation gastrique. Les effets indésirables comprennent troubles digestifs, brûlures d’estomac, douleurs abdominales, nausées, diarrhée, maux de tête et vertiges. L’utilisation prolongée accroît le risque d’ulcères gastriques, de perforations digestives et de saignements. Il est contre-indiqué en cas d’antécédents d’ulcère gastrique ou de saignement gastro-intestinal actif, d’insuffisance rénale sévère, de maladie inflammatoire chronique de l’intestin et d’insuffisance cardiaque décompensée. En cas de douleur persistante, un avis médical est nécessaire. Composition : diclofénac sodique 50 mg ou 75 mg, avec des excipients tels que amidon et stéarate de magnésium.`,
  Loratadine: `Loratadine est un antihistaminique de deuxième génération utilisé pour soulager les symptômes des allergies saisonnières et des allergies perennes, tels que éternuements, congestion nasale, démangeaisons, larmoiement et urticaire. Elle bloque sélectivement les récepteurs H1 périphériques, réduisant ainsi la réponse histaminique sans provoquer de somnolence marquée chez la plupart des patients. La notice indique qu’une dose unique quotidienne est généralement suffisante, et qu’elle peut être prise avec ou sans nourriture. Les effets indésirables sont généralement légers et peuvent inclure maux de tête, fatigue, sécheresse buccale et nervosité. Elle est utilisée chez les adultes et les enfants de plus de 6 ans, mais doit être utilisée avec prudence en cas d’insuffisance hépatique sévère. La notice conseille de consulter un médecin avant l’utilisation pendant la grossesse ou l’allaitement, et d’éviter l’alcool si l’on ressent de la somnolence. Composition : loratadine 10 mg, avec des excipients tels que cellulose microcristalline et stéarate de magnésium.`,
};

export const getMedicamentCategory = (nom: string): 'antibiotique' | 'analgesique' | 'anti-inflammatoire' | 'antidiabetique' | 'antihypertenseur' | 'antiulcereux' | 'antihistaminique' | 'autre' => {
  const lowerNom = nom.toLowerCase();
  
  if (lowerNom.includes('amoxicilline') || lowerNom.includes('ciprofloxacine') || lowerNom.includes('ceftriaxone')) return 'antibiotique';
  if (lowerNom.includes('paracétamol') || lowerNom.includes('paracetamol')) return 'analgesique';
  if (lowerNom.includes('ibuprofène') || lowerNom.includes('ibuprofen') || lowerNom.includes('diclofénac') || lowerNom.includes('diclofenac')) return 'anti-inflammatoire';
  if (lowerNom.includes('métformine') || lowerNom.includes('metformine')) return 'antidiabetique';
  if (lowerNom.includes('amlodipine')) return 'antihypertenseur';
  if (lowerNom.includes('oméprazole') || lowerNom.includes('omeprazole')) return 'antiulcereux';
  if (lowerNom.includes('aspirine')) return 'analgesique';
  if (lowerNom.includes('loratadine')) return 'antihistaminique';
  
  return 'autre';
};

export const getMedicamentImage = (nom: string): string => {
  const baseName = nom.replace(/\s+\d+(mg|g)$/, '');
  const slug = baseName.toLowerCase().replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ùûü]/g, 'u').replace(/[ç]/g, 'c').replace(/\s+/g, '-');

  if (slug === 'paracetamol') {
    return `/medicaments/${slug}.webp`;
  }

  if (slug === 'ibuprofene' || slug === 'ibuprofen') {
    return `/medicaments/ibuprofen.webp`;
  }

  return `/medicaments/${slug}.svg`;
};

const createMed = (nom: string, prix: number, stock: number): Medicament => {
  const baseName = nom.replace(/\s+\d+(mg|g)$/, '');
  return {
    nom,
    prix,
    stock,
    description: medDescriptions[baseName] ?? 'Notice du médicament non disponible.',
    image: getMedicamentImage(nom),
    categorie: getMedicamentCategory(nom),
  };
};

export interface Pharmacie {
  id: number;
  nom: string;
  adresse: string;
  distance: number;
  garde: boolean;
  telephone: string;
  horaires: string;
  statut: 'active' | 'inactive' | 'attente' | 'rejetee';
  score_ia: number;
  latitude: number;
  longitude: number;
  meds: Medicament[];
  motifSuspension?: string;
  contact?: string;
  licence?: string;
  docs?: string[];
  images?: string[];
}

export const pharmacies: Pharmacie[] = [
  {
    id: 1,
    nom: 'Pharmacie du Palais',
    adresse: 'Bastos, Yaoundé',
    distance: 0.8,
    garde: false,
    telephone: '+237 699 123 456',
    horaires: 'Lun–Ven 07h30–20h00 | Sam 08h00–18h00',
    statut: 'active',
    score_ia: 98,
    latitude: 3.8667,
    longitude: 11.5167,
    contact: 'Dr. Marie Fotso',
    licence: 'LP-2023-00041',
    docs: ['Agrément Ministère Santé', 'Registre de Commerce'],
    images: ['/window.svg', '/globe.svg', '/file.svg'],
    meds: [
      createMed('Amoxicilline 250mg', 900, 30),
      createMed('Amoxicilline 500mg', 1200, 45),
      createMed('Amoxicilline 1000mg', 1800, 20),
      createMed('Paracétamol 500mg', 250, 100),
      createMed('Paracétamol 1g', 400, 120),
      createMed('Paracétamol 650mg', 320, 80),
      createMed('Ibuprofène 200mg', 450, 60),
      createMed('Ibuprofène 400mg', 850, 30),
      createMed('Ibuprofène 600mg', 1100, 15),
      createMed('Métformine 500mg', 750, 50),
      createMed('Métformine 850mg', 950, 60),
      createMed('Métformine 1000mg', 1150, 35),
      createMed('Amlodipine 5mg', 1100, 40),
      createMed('Amlodipine 10mg', 1500, 25),
      createMed('Oméprazole 20mg', 1200, 55),
      createMed('Oméprazole 40mg', 1800, 20),
      createMed('Aspirine 100mg', 220, 90),
      createMed('Aspirine 300mg', 420, 45),
      createMed('Ciprofloxacine 250mg', 1350, 35),
      createMed('Ciprofloxacine 500mg', 1850, 20),
      createMed('Ceftriaxone 250mg', 2200, 12),
      createMed('Ceftriaxone 500mg', 3200, 8),
      createMed('Diclofénac 50mg', 700, 65),
      createMed('Diclofénac 75mg', 950, 30),
      createMed('Loratadine 10mg', 650, 75),
    ],
  },
  {
    id: 2,
    nom: 'Pharmacie Centrale',
    adresse: 'Centre-ville, Yaoundé',
    distance: 1.4,
    garde: true,
    telephone: '+237 677 654 321',
    horaires: 'Lun–Dim 24h/24 (garde)',
    statut: 'active',
    score_ia: 95,
    latitude: 3.8480,
    longitude: 11.5021,
    contact: 'Dr. Jean Nkoa',
    licence: 'LP-2022-00012',
    docs: ['Agrément Ministère Santé', 'Registre de Commerce'],
    images: ['/file.svg', '/window.svg', '/globe.svg'],
    meds: [
      createMed('Amoxicilline 250mg', 950, 70),
      createMed('Amoxicilline 500mg', 1350, 80),
      createMed('Amoxicilline 1000mg', 1900, 25),
      createMed('Paracétamol 500mg', 240, 180),
      createMed('Paracétamol 1g', 350, 200),
      createMed('Paracétamol 650mg', 310, 110),
      createMed('Ibuprofène 200mg', 430, 55),
      createMed('Ibuprofène 400mg', 900, 0),
      createMed('Ibuprofène 600mg', 1150, 12),
      createMed('Métformine 500mg', 770, 90),
      createMed('Métformine 850mg', 980, 60),
      createMed('Métformine 1000mg', 1180, 40),
      createMed('Amlodipine 5mg', 1100, 25),
      createMed('Amlodipine 10mg', 1550, 20),
      createMed('Oméprazole 20mg', 1250, 45),
      createMed('Oméprazole 40mg', 1850, 18),
      createMed('Aspirine 100mg', 210, 125),
      createMed('Aspirine 300mg', 430, 50),
      createMed('Ciprofloxacine 250mg', 1380, 55),
      createMed('Ciprofloxacine 500mg', 1880, 30),
      createMed('Ceftriaxone 250mg', 2250, 9),
      createMed('Ceftriaxone 500mg', 3300, 6),
      createMed('Diclofénac 50mg', 720, 85),
      createMed('Diclofénac 75mg', 980, 28),
      createMed('Loratadine 10mg', 640, 95),
    ],
  },
  {
    id: 3,
    nom: 'Pharmacie Nlongkak',
    adresse: 'Nlongkak, Yaoundé',
    distance: 2.1,
    garde: false,
    telephone: '+237 655 789 012',
    horaires: 'Lun–Ven 08h00–19h00 | Sam 08h00–16h00',
    statut: 'active',
    score_ia: 91,
    latitude: 3.8750,
    longitude: 11.5300,
    contact: 'Dr. Claire Abena',
    licence: 'LP-2023-00078',
    docs: ['Agrément Ministère Santé', 'Registre de Commerce'],
    images: ['/globe.svg', '/window.svg', '/file.svg'],
    meds: [
      createMed('Amoxicilline 250mg', 880, 50),
      createMed('Amoxicilline 500mg', 1100, 55),
      createMed('Amoxicilline 1000mg', 1700, 18),
      createMed('Paracétamol 500mg', 260, 95),
      createMed('Paracétamol 1g', 450, 90),
      createMed('Paracétamol 650mg', 330, 70),
      createMed('Ibuprofène 200mg', 420, 50),
      createMed('Ibuprofène 400mg', 800, 40),
      createMed('Ibuprofène 600mg', 1080, 22),
      createMed('Métformine 500mg', 730, 48),
      createMed('Métformine 850mg', 900, 15),
      createMed('Métformine 1000mg', 1130, 12),
      createMed('Amlodipine 5mg', 1080, 35),
      createMed('Amlodipine 10mg', 1480, 14),
      createMed('Oméprazole 20mg', 1230, 50),
      createMed('Oméprazole 40mg', 1830, 22),
      createMed('Aspirine 100mg', 230, 78),
      createMed('Aspirine 300mg', 440, 37),
      createMed('Ciprofloxacine 250mg', 1400, 28),
      createMed('Ciprofloxacine 500mg', 1900, 16),
      createMed('Ceftriaxone 250mg', 2280, 10),
      createMed('Ceftriaxone 500mg', 3350, 5),
      createMed('Diclofénac 50mg', 710, 52),
      createMed('Diclofénac 75mg', 975, 23),
      createMed('Loratadine 10mg', 630, 82),
    ],
  },
  {
    id: 4,
    nom: 'Pharmacie de la Joie',
    adresse: 'Melen, Yaoundé',
    distance: 2.8,
    garde: false,
    telephone: '+237 699 345 678',
    horaires: 'Lun–Sam 07h00–19h30',
    statut: 'active',
    score_ia: 87,
    latitude: 3.8900,
    longitude: 11.4900,
    contact: 'Dr. Paul Essama',
    licence: 'LP-2021-00099',
    docs: ['Agrément Ministère Santé', 'Registre de Commerce'],
    images: ['/window.svg', '/file.svg', '/globe.svg'],
    meds: [
      createMed('Amoxicilline 250mg', 960, 40),
      createMed('Amoxicilline 500mg', 1400, 30),
      createMed('Amoxicilline 1000mg', 1950, 12),
      createMed('Paracétamol 500mg', 270, 110),
      createMed('Paracétamol 1g', 380, 150),
      createMed('Paracétamol 650mg', 340, 85),
      createMed('Ibuprofène 200mg', 440, 45),
      createMed('Ibuprofène 400mg', 820, 20),
      createMed('Ibuprofène 600mg', 1120, 10),
      createMed('Métformine 500mg', 760, 33),
      createMed('Métformine 850mg', 990, 19),
      createMed('Métformine 1000mg', 1170, 7),
      createMed('Amlodipine 5mg', 1050, 10),
      createMed('Amlodipine 10mg', 1500, 5),
      createMed('Oméprazole 20mg', 1280, 33),
      createMed('Oméprazole 40mg', 1860, 16),
      createMed('Aspirine 100mg', 240, 60),
      createMed('Aspirine 300mg', 450, 22),
      createMed('Ciprofloxacine 250mg', 1420, 20),
      createMed('Ciprofloxacine 500mg', 1920, 10),
      createMed('Ceftriaxone 250mg', 2300, 6),
      createMed('Ceftriaxone 500mg', 3400, 3),
      createMed('Diclofénac 50mg', 730, 28),
      createMed('Diclofénac 75mg', 995, 12),
      createMed('Loratadine 10mg', 650, 48),
    ],
  },
];

export interface Compte {
  email: string;
  password: string;
  nom: string;
  role: Role;
  pharmacieId?: number;
}

// Mot de passe identique pour tous les comptes de démo, pour simplifier les tests
const DEMO_PASSWORD = 'demo1234';

export const comptesPatients: Compte[] = [
  { email: 'jean.martin@mail.com', password: DEMO_PASSWORD, nom: 'Jean Martin', role: 'patient' },
  { email: 'marie.nguema@mail.com', password: DEMO_PASSWORD, nom: 'Marie Nguema', role: 'patient' },
  { email: 'paul.essama@mail.com', password: DEMO_PASSWORD, nom: 'Paul Essama', role: 'patient' },
  { email: 'claire.abena@mail.com', password: DEMO_PASSWORD, nom: 'Claire Abena', role: 'patient' },
  { email: 'sylvie.bella@mail.com', password: DEMO_PASSWORD, nom: 'Sylvie Bella', role: 'patient' },
  { email: 'alain.mbarga@mail.com', password: DEMO_PASSWORD, nom: 'Alain Mbarga', role: 'patient' },
  { email: 'michel.etoo@mail.com', password: DEMO_PASSWORD, nom: "Michel Eto'o", role: 'patient' },
  { email: 'odile.fouda@mail.com', password: DEMO_PASSWORD, nom: 'Odile Fouda', role: 'patient' },
  { email: 'rene.tabi@mail.com', password: DEMO_PASSWORD, nom: 'René Tabi', role: 'patient' },
  { email: 'florence.eyenga@mail.com', password: DEMO_PASSWORD, nom: 'Florence Eyenga', role: 'patient' },
];

export const comptesPharmacies: Compte[] = [
  { email: 'contact@pharmaciedupalais.com', password: DEMO_PASSWORD, nom: 'Pharmacie du Palais', role: 'pharmacie', pharmacieId: 1 },
  { email: 'contact@pharmaciecentrale.com', password: DEMO_PASSWORD, nom: 'Pharmacie Centrale', role: 'pharmacie', pharmacieId: 2 },
  { email: 'contact@pharmacienlongkak.com', password: DEMO_PASSWORD, nom: 'Pharmacie Nlongkak', role: 'pharmacie', pharmacieId: 3 },
  { email: 'contact@pharmaciedelajoie.com', password: DEMO_PASSWORD, nom: 'Pharmacie de la Joie', role: 'pharmacie', pharmacieId: 4 },
];

export const comptesAdmin: Compte[] = [
  { email: 'admin@proximedoc.com', password: DEMO_PASSWORD, nom: 'Administrateur', role: 'admin' },
];

export const comptes: Compte[] = [...comptesPatients, ...comptesPharmacies, ...comptesAdmin];

export const demandesPharmacie: Pharmacie[] = [
  {
    id: 10,
    nom: 'Pharmacie Melen Plus',
    adresse: 'Melen, Yaoundé',
    distance: 0,
    garde: false,
    telephone: '+237 677 234 567',
    horaires: '',
    statut: 'attente',
    score_ia: 98,
    latitude: 3.89,
    longitude: 11.49,
    contact: 'Michel Eto\'o',
    licence: 'LP-2024-00123',
    docs: ['Agrément Ministère Santé', 'Registre de Commerce'],
    meds: [],
  },
  {
    id: 11,
    nom: 'Pharma Express Ngoa Ekelle',
    adresse: "Ngoa-Ekellé, Yaoundé",
    distance: 0,
    garde: false,
    telephone: '+237 699 876 543',
    horaires: '',
    statut: 'attente',
    score_ia: 71,
    latitude: 3.86,
    longitude: 11.51,
    contact: 'Sylvie Bella',
    licence: 'LP-2024-00156',
    docs: ['Agrément Ministère Santé', 'RC (illisible)'],
    meds: [],
  },
  {
    id: 12,
    nom: 'Pharmacie Mvog-Mbi Santé',
    adresse: 'Mvog-Mbi, Yaoundé',
    distance: 0,
    garde: false,
    telephone: '+237 655 112 334',
    horaires: '',
    statut: 'attente',
    score_ia: 34,
    latitude: 3.855,
    longitude: 11.525,
    contact: 'Alain Mbarga',
    licence: 'LP-2024-00189',
    docs: ['Document non conforme'],
    meds: [],
  },
];
