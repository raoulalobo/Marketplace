#!/usr/bin/env node

/**
 * Script pour lister toutes les propriétés de la base de données
 * Utilisé pour obtenir des IDs de propriétés pour les tests PostHog
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function listProperties() {
  try {
    console.log('🔍 Récupération des propriétés depuis la base de données...\n');

    const properties = await prisma.property.findMany({
      select: {
        id: true,
        titre: true,
        type: true,
        prix: true,
        adresse: true,
        isActive: true,
        viewsCount: true,
        createdAt: true,
        agent: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        _count: {
          select: {
            views: true,
            timeSessions: true,
            visitRequests: true,
            favorites: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (properties.length === 0) {
      console.log('❌ Aucune propriété trouvée dans la base de données.');
      return;
    }

    console.log(`📊 ${properties.length} propriétés trouvées:\n`);
    console.log('='.repeat(100));
    console.log('ID                               | Titre                              | Type    | Prix        | Vues | Sessions | Demandes');
    console.log('='.repeat(100));

    properties.forEach((property, index) => {
      const id = property.id;
      const titre = property.titre.length > 35 ? property.titre.substring(0, 32) + '...' : property.titre.padEnd(35);
      const type = property.type.padEnd(7);
      const prix = `${(property.prix / 1000000).toFixed(1)}M FCFA`.padEnd(11);
      const vues = property._count.views.toString().padEnd(4);
      const sessions = property._count.timeSessions.toString().padEnd(8);
      const demandes = property._count.visitRequests.toString().padEnd(8);

      console.log(`${id} | ${titre} | ${type} | ${prix} | ${vues} | ${sessions} | ${demandes}`);
    });

    console.log('='.repeat(100));
    console.log('\n📋 Détails pour les tests PostHog:\n');

    properties.forEach((property, index) => {
      console.log(`Propriété ${index + 1}:`);
      console.log(`  ID: ${property.id}`);
      console.log(`  Titre: ${property.titre}`);
      console.log(`  Type: ${property.type}`);
      console.log(`  Prix: ${property.prix.toLocaleString()} FCFA`);
      console.log(`  Adresse: ${property.adresse}`);
      console.log(`  Agent: ${property.agent.prenom} ${property.agent.nom} (${property.agent.email})`);
      console.log(`  Statut: ${property.isActive ? 'Actif' : 'Inactif'}`);
      console.log(`  Créé le: ${property.createdAt.toLocaleDateString('fr-FR')}`);
      console.log(`  Statistiques:`);
      console.log(`    - Vues totales: ${property._count.views}`);
      console.log(`    - Sessions temps: ${property._count.timeSessions}`);
      console.log(`    - Demandes visite: ${property._count.visitRequests}`);
      console.log(`    - Favoris: ${property._count.favorites}`);
      console.log(`  URLs de test:`);
      console.log(`    - Analytics: /api/properties/${property.id}/posthog-analytics`);
      console.log(`    - Insights: /api/properties/${property.id}/posthog-insights`);
      console.log('');
    });

    console.log('💡 Commandes curl pour tester:');
    console.log('# Remplacer PROPERTY_ID par un ID réel ci-dessus\n');
    
    properties.slice(0, 3).forEach((property) => {
      console.log(`# Pour la propriété: ${property.titre}`);
      console.log(`curl -X GET "http://localhost:3000/api/properties/${property.id}/posthog-analytics?days=30"`);
      console.log(`curl -X GET "http://localhost:3000/api/properties/${property.id}/posthog-insights?days=30"`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des propriétés:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
if (require.main === module) {
  listProperties()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { listProperties };