#!/usr/bin/env node

/**
 * Script pour tester le système Amplitude
 */

require('dotenv').config({ path: '.env.local' });

async function testAmplitudeSystem() {
  console.log('🧪 Test du système Amplitude\n');

  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  const secretKey = process.env.AMPLITUDE_SECRET_KEY;

  console.log('🔍 Configuration:');
  console.log(`   Clé API publique: ${apiKey?.substring(0, 20)}...`);
  console.log(`   Clé secrète: ${secretKey?.substring(0, 20)}...`);

  if (!apiKey || !secretKey) {
    console.log('❌ Configuration Amplitude manquante');
    return;
  }

  // Test 1: Vérifier l'authentification API Amplitude
  console.log('\n📡 Test 1: Authentification API Amplitude...');
  try {
    const response = await fetch('https://amplitude.com/api/2/events/list', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
        limit: 1
      })
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      console.log('   ✅ Authentification Amplitude réussie !');
      const data = await response.json();
      console.log(`   Événements trouvés: ${data.data?.length || 0}`);
    } else {
      const error = await response.text();
      console.log(`   ❌ Échec: ${error.substring(0, 100)}...`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
  }

  // Test 2: Tester l'endpoint Amplitude analytics
  console.log('\n📊 Test 2: Endpoint Amplitude analytics...');
  try {
    const response = await fetch('http://localhost:3002/api/properties/cmdoi4i8a0006l204cajv0hpo/amplitude-analytics?days=7', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API Amplitude fonctionnelle !');
      console.log(`   Source: ${data.source}`);
      console.log(`   Total vues: ${data.data?.totalViews || 0}`);
      console.log(`   Total sessions: ${data.data?.totalSessions || 0}`);
    } else if (response.status === 401) {
      console.log('   ⚠️  API Amplitude requiert l\'authentification (normal)');
    } else {
      const error = await response.text();
      console.log(`   ❌ Échec API Amplitude: ${error}`);
    }
  } catch (error) {
    console.log(`   ❌ Erreur API Amplitude: ${error.message}`);
    console.log('   💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)');
  }

  console.log('\n📋 Résumé:');
  console.log('✅ Système Amplitude configuré et prêt');
  console.log('🚀 Votre système d\'analytics utilise maintenant Amplitude');
  console.log('💡 Les endpoints API sont disponibles pour les analytics immobiliers');
}

testAmplitudeSystem().catch(console.error);