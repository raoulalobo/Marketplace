// Script pour tester la configuration Amplitude
require('dotenv').config({ path: '.env.local' });

async function testAmplitudeConfig() {
  console.log('🧪 Test de configuration Amplitude\n');
  
  // 1. Vérifier les variables d'environnement
  console.log('1️⃣ Variables d\'environnement:');
  const amplitudeApiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  const amplitudeSecretKey = process.env.AMPLITUDE_SECRET_KEY;
  
  console.log(`   NEXT_PUBLIC_AMPLITUDE_API_KEY: ${amplitudeApiKey ? amplitudeApiKey.substring(0, 10) + '...' : '❌ Manquante'}`);
  console.log(`   AMPLITUDE_SECRET_KEY: ${amplitudeSecretKey ? amplitudeSecretKey.substring(0, 10) + '...' : '❌ Manquante'}`);
  console.log('');
  
  if (!amplitudeApiKey || !amplitudeSecretKey) {
    console.log('❌ Configuration incomplète. Veuillez configurer vos clés API Amplitude.');
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Créez un compte sur https://amplitude.com');
    console.log('2. Créez un nouveau projet');
    console.log('3. Récupérez votre API Key et Secret Key');
    console.log('4. Ajoutez-les dans .env.local:');
    console.log('   NEXT_PUBLIC_AMPLITUDE_API_KEY="votre-api-key"');
    console.log('   AMPLITUDE_SECRET_KEY="votre-secret-key"');
    return;
  }
  
  // 2. Test de l'API Amplitude
  console.log('2️⃣ Test de l\'API Amplitude:');
  console.log('');
  
  try {
    // Test de l'endpoint d'événements
    console.log('   🔍 Test Events API...');
    
    // Créer un événement de test
    const testEvent = {
      api_key: amplitudeApiKey,
      events: [{
        user_id: 'test_user_' + Date.now(),
        event_type: 'Test Event',
        time: Date.now(),
        event_properties: {
          test_property: 'test_value',
          property_id: 'test_property_123'
        }
      }]
    };
    
    const response = await fetch('https://api2.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEvent)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('   ✅ Events API fonctionne');
      console.log(`      Events ingérés: ${result.events_ingested || 0}`);
    } else {
      console.log('   ❌ Events API échoue');
      console.log(`      Status: ${response.status}`);
      const errorText = await response.text();
      console.log(`      Erreur: ${errorText}`);
    }
    
  } catch (error) {
    console.log('   ❌ Erreur lors du test API:', error.message);
  }
  
  console.log('');
  
  // 3. Test de l'API Dashboard (pour la lecture)
  console.log('3️⃣ Test Dashboard API (lecture):');
  console.log('');
  
  try {
    console.log('   🔍 Test Dashboard REST API...');
    
    // Test d'une requête simple
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const query = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
    
    const response = await fetch('https://amplitude.com/api/2/events/list', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${amplitudeSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query)
    });
    
    if (response.ok) {
      console.log('   ✅ Dashboard API accessible');
    } else {
      console.log('   ⚠️ Dashboard API inaccessible (normal pour les comptes gratuits)');
      console.log(`      Status: ${response.status}`);
    }
    
  } catch (error) {
    console.log('   ❌ Erreur Dashboard API:', error.message);
  }
  
  console.log('');
  console.log('✅ Tests terminés!');
  console.log('');
  console.log('📋 Prochaines étapes:');
  console.log('1. Déployez votre application avec les nouvelles clés');
  console.log('2. Les événements commenceront à être trackés automatiquement');
  console.log('3. Consultez votre dashboard Amplitude: https://analytics.amplitude.com');
  console.log('4. Les analytics apparaîtront dans votre interface après quelques événements');
}

// Exécuter les tests
testAmplitudeConfig().catch(console.error);