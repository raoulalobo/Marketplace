#!/usr/bin/env node

/**
 * Script de test direct des APIs PostHog sans serveur web
 * Teste les fonctions PostHog directement avec Node.js
 */

require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

// Importer les fonctions des fichiers d'API
const posthogAnalyticsRoute = require('../src/app/api/properties/[id]/posthog-analytics/route.ts');
const posthogInsightsRoute = require('../src/app/api/properties/[id]/posthog-insights/route.ts');

const prisma = new PrismaClient();

async function testPostHogAPIs() {
  try {
    console.log('🧪 Test direct des APIs PostHog...\n');

    // Récupérer une propriété avec des données
    const property = await prisma.property.findFirst({
      where: {
        OR: [
          { id: 'cmdmhgdpb0001dcu9o68jyrpw' }, // Celle avec le plus de sessions
          { id: 'cmdoi4i8a0006l204cajv0hpo' },  // Celle avec des vues
        ]
      },
      include: {
        _count: {
          select: {
            views: true,
            timeSessions: true,
            visitRequests: true,
          }
        }
      }
    });

    if (!property) {
      console.log('❌ Aucune propriété trouvée pour le test');
      return;
    }

    console.log(`📊 Test avec la propriété: ${property.titre} (${property.id})`);
    console.log(`   Statistiques: ${property._count.views} vues, ${property._count.timeSessions} sessions, ${property._count.visitRequests} demandes\n`);

    // Créer des requêtes simulées
    const request = {
      url: new URL(`http://localhost:3000/api/properties/${property.id}/posthog-analytics?days=30`),
      headers: {
        get: (name) => name === 'content-type' ? 'application/json' : null
      }
    };

    const params = { id: property.id };

    console.log('🔍 Test 1: Endpoint PostHog Analytics');
    try {
      // Simuler un appel GET à l'API
      const response = await posthogAnalyticsRoute.GET(request, { params });
      console.log('✅ Analytics test réussi');
      console.log('   Status:', response.status);
      if (response.status === 200) {
        const data = await response.json();
        console.log('   Données:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      }
    } catch (error) {
      console.log('❌ Analytics test échoué:', error.message);
    }

    console.log('\n🔍 Test 2: Endpoint PostHog Insights');
    try {
      const insightsRequest = {
        url: new URL(`http://localhost:3000/api/properties/${property.id}/posthog-insights?days=30`),
        headers: {
          get: (name) => name === 'content-type' ? 'application/json' : null
        }
      };

      const response = await posthogInsightsRoute.GET(insightsRequest, { params });
      console.log('✅ Insights test réussi');
      console.log('   Status:', response.status);
      if (response.status === 200) {
        const data = await response.json();
        console.log('   Données:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
      }
    } catch (error) {
      console.log('❌ Insights test échoué:', error.message);
    }

    console.log('\n🔍 Test 3: Vérification configuration PostHog');
    console.log('   POSTHOG_PERSONAL_API_KEY:', process.env.POSTHOG_PERSONAL_API_KEY ? '✅ Défini' : '❌ Manquant');
    console.log('   POSTHOG_PROJECT_ID:', process.env.POSTHOG_PROJECT_ID || '❌ Manquant');
    console.log('   NEXT_PUBLIC_POSTHOG_HOST:', process.env.NEXT_PUBLIC_POSTHOG_HOST || '❌ Manquant');

    // Test direct de l'API PostHog
    console.log('\n🔍 Test 4: Appel direct API PostHog');
    try {
      const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
      const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
      
      if (!POSTHOG_PERSONAL_API_KEY || !POSTHOG_PROJECT_ID) {
        throw new Error('Configuration PostHog manquante');
      }

      const queryParams = new URLSearchParams({
        where: JSON.stringify([
          ['properties', 'property_id', 'exact', property.id]
        ]),
        after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        before: new Date().toISOString(),
        orderBy: '-timestamp',
        limit: '10',
      });

      const response = await fetch(
        `https://us.i.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/events/?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('   Status API PostHog:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API PostHog accessible');
        console.log('   Événements trouvés:', data.results?.length || 0);
        
        if (data.results && data.results.length > 0) {
          console.log('   Premier événement:', data.results[0].event);
          console.log('   Timestamp:', data.results[0].timestamp);
        }
      } else {
        const errorText = await response.text();
        console.log('❌ Erreur API PostHog:', errorText);
      }
    } catch (error) {
      console.log('❌ Erreur test API PostHog:', error.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testPostHogAPIs()
  .then(() => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });