#!/usr/bin/env node

/**
 * Script pour tester les endpoints API directement
 */

const http = require('http');

// Fonction pour tester un endpoint
async function testEndpoint(path, propertyId, days = 30) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: `/api/properties/${propertyId}${path}?days=${days}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          };
          resolve(result);
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testAPIEndpoints() {
  console.log('🧪 Test des endpoints API avec données locales\n');

  const propertyId = 'cmdoi4i8a0006l204cajv0hpo'; // Propriété avec des données
  
  console.log(`📊 Test avec la propriété: ${propertyId}`);

  // Test 1: Endpoint Analytics
  console.log('\n🔍 Test 1: Endpoint /posthog-analytics');
  try {
    const result = await testEndpoint('/posthog-analytics', propertyId);
    console.log(`   Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('   ✅ Analytics endpoint réussi !');
      console.log(`   Source: ${result.data.source}`);
      console.log(`   Total vues: ${result.data.data?.totalViews || 0}`);
      console.log(`   Total sessions: ${result.data.data?.totalSessions || 0}`);
      console.log(`   Temps moyen: ${result.data.data?.averageTime || 0}s`);
      
      if (result.data.note) {
        console.log(`   Note: ${result.data.note}`);
      }
    } else {
      console.log('   ❌ Analytics endpoint échoué');
      console.log(`   Erreur: ${result.data.error || result.data}`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur de connexion: ${error.message}`);
  }

  // Test 2: Endpoint Insights
  console.log('\n🔍 Test 2: Endpoint /posthog-insights');
  try {
    const result = await testEndpoint('/posthog-insights', propertyId);
    console.log(`   Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('   ✅ Insights endpoint réussi !');
      console.log(`   Total vues: ${result.data.data?.totalViews || 0}`);
      console.log(`   Total sessions: ${result.data.data?.totalSessions || 0}`);
    } else {
      console.log('   ❌ Insights endpoint échoué');
      console.log(`   Erreur: ${result.data.error || result.data}`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur de connexion: ${error.message}`);
  }

  // Test 3: Tester avec une autre propriété
  console.log('\n🔍 Test 3: Test avec une autre propriété');
  const propertyId2 = 'cmdmhgdpb0001dcu9o68jyrpw';
  try {
    const result = await testEndpoint('/posthog-analytics', propertyId2);
    console.log(`   Status: ${result.status}`);
    
    if (result.status === 200) {
      console.log('   ✅ Deuxième propriété testée avec succès !');
      console.log(`   Total vues: ${result.data.data?.totalViews || 0}`);
      console.log(`   Total sessions: ${result.data.data?.totalSessions || 0}`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }

  console.log('\n📋 Résumé des tests:');
  console.log('   Les endpoints utilisent maintenant les données locales de la base de données');
  console.log('   PostHog est contourné temporairement jusqu\'à résolution du problème d\'API');
  console.log('   Les analytics sont calculés depuis les tables property_views et property_time_sessions');
}

testAPIEndpoints().catch(console.error);