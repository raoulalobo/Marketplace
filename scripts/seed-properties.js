// Script pour peupler la base avec 15 propriétés réalistes pour le Cameroun
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const agentId = 'cmdmbmt3z0000dctynv24q9sr';

const properties = [
  // Maisons/Villas (5)
  {
    titre: 'Villa luxueuse avec piscine à Bonapriso',
    description: `Magnifique villa de standing située dans le quartier résidentiel haut de gamme de Bonapriso à Douala. Cette propriété exceptionnelle offre 5 chambres spacieuses avec climatisation, 4 salles de bains modernes, un salon cathédrale avec cheminée, une cuisine américaine entièrement équipée.

L'extérieur dispose d'une piscine de 10x5 mètres, d'un jardin tropical paysagé de 600m², d'une terrasse couverte pour barbecue et d'un garage pour 3 véhicules.

Sécurité 24h/24, groupe électrogène, château d'eau de 10000L, système d'alarme et vidéosurveillance. Vue imprenable sur le Wouri.

Idéale pour famille expatriée ou cadre supérieur cherchant le luxe à proximité du centre d'affaires de Douala.`,
    type: 'MAISON',
    prix: 95000000,
    superficie: 320,
    adresse: 'Rue des Palmiers, Bonapriso, Douala',
    fraisVisite: 8000,
    photos: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    titre: 'Maison familiale moderne à Bastos',
    description: `Belle maison familiale de 4 chambres située dans le prestigieux quartier de Bastos à Yaoundé. Construction récente (2022) avec finitions haut de gamme.

La maison comprend un salon spacieux, une salle à manger, une cuisine équipée, 4 chambres avec placards intégrés, 3 salles de bains et un bureau.

Jardin arboré de 400m², terrasse couverte, garage double, bâtiment annexe pour domestiques. Quartier calme et sécurisé, proche des écoles internationales et ambassades.

Parfaite pour famille recherchant le confort et la tranquillité dans la capitale.`,
    type: 'MAISON',
    prix: 85000000,
    superficie: 280,
    adresse: 'Avenue de la Réunification, Bastos, Yaoundé',
    fraisVisite: 6000,
    photos: [
      'https://images.unsplash.com/photo-1591474200742-8e512e6f98f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    titre: 'Villa avec vue panoramique à Dschang',
    description: `Superbe villa perchée offrant une vue panoramique exceptionnelle sur la ville de Dschang et les montagnes environnantes. Construction de qualité avec matériaux locaux et modernes.

3 chambres principales, 2 chambres d'invités, salon avec cheminée, cuisine équipée, véranda panoramique. Terrain de 800m² avec jardin potager et arbres fruitiers.

Climat tempéré agréable toute l'année. Accès facile au centre-ville et à l'université. Parfait pour retraite paisible ou maison de campagne.`,
    type: 'MAISON',
    prix: 45000000,
    superficie: 220,
    adresse: 'Quartier Forêt, Dschang',
    fraisVisite: 4000,
    photos: [
      'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1449844908441-8829872d2607?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    titre: 'Duplex moderne à Bonanjo',
    description: `Magnifique duplex moderne dans le quartier d'affaires de Bonanjo à Douala. Vue sur le fleuve Wouri et proximité immédiate des banques et administrations.

Rez-de-chaussée: salon, salle à manger, cuisine équipée, toilettes invités, terrasse.
Étage: 3 chambres climatisées, 2 salles de bains, bureau, balcon avec vue.

Finitions contemporaines, carrelage de qualité, électroménager inclus. Parking sécurisé, ascenseur, gardiennage 24h/24.`,
    type: 'MAISON',
    prix: 72000000,
    superficie: 180,
    adresse: 'Boulevard de la Liberté, Bonanjo, Douala',
    fraisVisite: 5000,
    photos: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    titre: 'Résidence standing avec piscine à Omnisport',
    description: `Élégante résidence de 4 chambres dans le quartier prisé d'Omnisport à Yaoundé. Construction récente avec architecture moderne et espaces bien pensés.

Salon cathédrale, cuisine américaine haut de gamme, 4 suites avec dressing, bureau, cellier. Piscine 8x4m, pool house, jardin paysagé de 500m².

Quartier résidentiel calme, proche du stade omnisport et du centre commercial. Sécurité renforcée, rue goudronnée, éclairage public.`,
    type: 'MAISON',
    prix: 110000000,
    superficie: 300,
    adresse: 'Rue de la Paix, Omnisport, Yaoundé',
    fraisVisite: 7000,
    photos: [
      'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // Terrains (5)
  {
    titre: 'Terrain titré 1000m² à Biyem-Assi',
    description: `Excellent terrain résidentiel de 1000m² situé dans le quartier en plein développement de Biyem-Assi à Yaoundé. Titre foncier définitif en règle.

Terrain plat, viabilisé avec accès à l'électricité ENEO et à l'eau CAMWATER. Voie d'accès carrossable, évacuation des eaux pluviales aménagée.

Zone résidentielle calme, proche des écoles et commerces. Idéal pour construction de villa familiale ou petit immeuble.`,
    type: 'TERRAIN',
    prix: 35000000,
    superficie: 1000,
    adresse: 'Carrefour Biyem-Assi, Yaoundé',
    fraisVisite: 3000,
    photos: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1574013624853-6ca103ce7ac4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    titre: 'Grand terrain commercial à Akwa',
    description: `Superbe terrain commercial de 1500m² en bordure de route principale dans le quartier d'Akwa à Douala. Emplacement stratégique pour activités commerciales.

Façade de 30m sur route bitumée à forte circulation. Terrain légèrement en pente, facilement aménageable. Toutes commodités disponibles: électricité, eau, égouts.

Zone commerciale dynamique, proche du marché central et du port. Idéal pour construction de centre commercial, hôtel, bureaux ou entrepôt.`,
    type: 'TERRAIN',
    prix: 180000000,
    superficie: 1500,
    adresse: 'Avenue Douala Manga Bell, Akwa, Douala',
    fraisVisite: 5000,
    photos: [
      'https://images.unsplash.com/photo-1590725175092-8cb6961d08a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    titre: 'Terrain agricole 5 hectares à Bafoussam',
    description: `Vaste terrain agricole de 5 hectares (50000m²) situé à la périphérie de Bafoussam. Sol fertile, légèrement vallonné, adapté à diverses cultures.

Accès par piste carrossable toute saison. Point d'eau naturel traversant le terrain. Vue dégagée sur les collines environnantes.

Zone agricole reconnue, pas de restriction d'usage. Parfait pour agriculture, élevage, ou projet agro-pastoral.`,
    type: 'TERRAIN',
    prix: 25000000,
    superficie: 50000,
    adresse: 'Route de Foumbot, sortie Bafoussam',
    fraisVisite: 2000,
    photos: [
      'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1574324768093-4e0b60baa72b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    titre: 'Terrain résidentiel 800m² à Mendong',
    description: `Beau terrain résidentiel de 800m² dans le quartier paisible de Mendong à Yaoundé. Zone en plein essor avec nombreuses constructions récentes.

Terrain rectangulaire, légèrement en pente douce, facilement constructible. Électricité et eau disponibles en bordure. Route d'accès en cours de bitumage.

Quartier familial tranquille, proche de l'école publique et du marché de Mendong. Transport public régulier vers le centre-ville.`,
    type: 'TERRAIN',
    prix: 28000000,
    superficie: 800,
    adresse: 'Carrefour Mendong, Yaoundé',
    fraisVisite: 2500,
    photos: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    titre: 'Terrain industriel 2000m² zone Bonabéri',
    description: `Terrain industriel de 2000m² situé dans la zone industrielle de Bonabéri à Douala. Emplacement stratégique pour activités industrielles et logistiques.

Accès direct depuis la route nationale, proche du port autonome de Douala. Terrain plat, délimité, avec possibilité de raccordement aux réseaux industriels.

Zone classée industrielle, autorisations d'exploitation facilitées. Idéal pour usine, entrepôt, centre de distribution ou activités de transformation.`,
    type: 'TERRAIN',
    prix: 120000000,
    superficie: 2000,
    adresse: 'Zone industrielle Bonabéri, Douala',
    fraisVisite: 4000,
    photos: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // Bureaux/Locaux commerciaux (3)
  {
    titre: 'Bureau moderne 150m² centre-ville Douala',
    description: `Spacieux bureau de 150m² situé au cœur du centre d'affaires de Douala. Immeuble moderne avec ascenseur, climatisation centrale et groupe électrogène.

L'espace comprend 5 bureaux individuels, 1 salle de réunion, 1 espace d'accueil, 2 toilettes et 1 kitchenette. Finitions contemporaines, cloisons amovibles.

Parking sécurisé, gardiennage 24h/24, internet haut débit. Proximité immédiate des banques, ministères et centres d'affaires.`,
    type: 'BUREAU',
    prix: 55000000,
    superficie: 150,
    adresse: 'Immeuble Perspectives, Bonanjo, Douala',
    fraisVisite: 3000,
    photos: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    titre: 'Local commercial 200m² marché central',
    description: `Excellent local commercial de 200m² situé dans la galerie marchande du marché central de Yaoundé. Emplacement de premier choix pour commerce de détail.

Local en rez-de-chaussée avec vitrine sur rue passante. Aménagement modulable, réserve de 30m², bureau administratif, 2 toilettes.

Forte affluence garantie, clientèle fidèle du marché. Parfait pour vente de produits alimentaires, vêtements, électronique ou services.`,
    type: 'BUREAU',
    prix: 45000000,
    superficie: 200,
    adresse: 'Galerie marchande, Marché central, Yaoundé',
    fraisVisite: 2500,
    photos: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },

  // Hangars/Entrepôts (2)
  {
    titre: 'Hangar industriel 500m² zone Bonabéri',
    description: `Grand hangar industriel de 500m² situé dans la zone industrielle de Bonabéri à Douala. Structure métallique moderne, hauteur sous plafond 8 mètres.

Hangar équipé avec portail coulissant automatique, quai de déchargement, bureau administratif de 50m², toilettes et vestiaires.

Accès poids lourds facilité, cour de manœuvre bitumée de 300m². Électricité industrielle triphasée, compteur ENEO dédié.`,
    type: 'HANGAR',
    prix: 85000000,
    superficie: 500,
    adresse: 'Zone industrielle Bonabéri, Douala',
    fraisVisite: 4000,
    photos: [
      'https://images.unsplash.com/photo-1565096362593-b6195894f2a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  },
  {
    titre: 'Entrepôt logistique 800m² avec bureaux',
    description: `Moderne entrepôt logistique de 800m² avec espace bureaux de 100m² intégré. Situé sur l'axe Douala-Yaoundé pour faciliter la distribution.

Structure béton armé, isolation thermique, système de ventilation. 2 quais de chargement, parking 20 véhicules, aire de manœuvre poids lourds.

Bureaux climatisés avec salle de contrôle, vestiaires, réfectoire. Système de sécurité avec caméras et alarme anti-intrusion.`,
    type: 'HANGAR',
    prix: 125000000,
    superficie: 900,
    adresse: 'PK12 Route Douala-Yaoundé, Edéa',
    fraisVisite: 5000,
    photos: [
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1565096362593-b6195894f2a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'
    ]
  }
];

async function seedProperties() {
  console.log('🌱 Début du peuplement des propriétés...');
  
  try {
    // Créer toutes les propriétés avec leurs médias
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      const { photos, ...propertyData } = property;
      
      const created = await prisma.property.create({
        data: {
          ...propertyData,
          agentId,
          medias: {
            create: photos.map((url, index) => ({
              url,
              type: 'PHOTO',
              order: index
            }))
          }
        },
        include: {
          medias: true
        }
      });
      
      console.log(`✅ Propriété ${i + 1}/15 créée: ${created.titre} (${created.medias.length} photos)`);
    }
    
    console.log('🎉 Toutes les 15 propriétés ont été créées avec succès !');
    
    // Afficher le résumé
    const count = await prisma.property.count({
      where: { agentId }
    });
    
    console.log(`📊 Total des propriétés pour l'agent: ${count}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProperties();