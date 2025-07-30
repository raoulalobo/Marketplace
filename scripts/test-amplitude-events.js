// Script pour tester l'envoi d'événements Amplitude
require('dotenv').config({ path: '.env.local' });

async function testAmplitudeEvents() {
  console.log('🧪 Test d\'envoi d\'événements Amplitude\n');
  
  const amplitudeApiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  
  if (!amplitudeApiKey) {
    console.log('❌ Clé API Amplitude manquante');
    return;
  }
  
  // Créer plusieurs événements de test immobiliers
  const testEvents = [
    {
      user_id: 'test_user_' + Date.now(),
      event_type: 'Property Viewed',
      time: Date.now(),
      event_properties: {
        property_id: 'test_property_123',
        property_type: 'MAISON',
        property_price: 75000000,
        property_surface: 150,
        user_role: 'CLIENT',
        page_url: '/properties/test_property_123'
      }
    },
    {
      user_id: 'test_user_' + Date.now(),
      event_type: 'Property Session Started',
      time: Date.now(),
      event_properties: {
        property_id: 'test_property_123',
        property_type: 'MAISON',
        user_role: 'CLIENT'
      }
    },
    {
      user_id: 'test_user_' + Date.now(),
      event_type: 'Purchase Intent Signal',
      time: Date.now(),
      event_properties: {
        property_id: 'test_property_123',
        intent_level: 'high',
        engagement_type: 'visit_request',
        user_role: 'CLIENT'
      }
    },
    {
      user_id: 'test_user_' + Date.now(),
      event_type: 'Visit Request Submitted',
      time: Date.now(),
      event_properties: {
        property_id: 'test_property_123',
        property_type: 'MAISON',
        user_role: 'CLIENT'
      }
    }
  ];
  
  // Envoyer les événements
  for (let i = 0; i < testEvents.length; i++) {
    const event = testEvents[i];
    console.log(`📊 Envoi événement ${i + 1}/4: ${event.event_type}`);
    
    try {
      const payload = {
        api_key: amplitudeApiKey,
        events: [event]
      };
      
      const response = await fetch('https://api2.amplitude.com/2/httpapi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Succès - Events ingérés: ${result.events_ingested || 0}`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Échec - Status: ${response.status}`);
        console.log(`      Erreur: ${errorText}`);
      }
      
      // Attendre un peu entre chaque événement
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Test terminé !');
  console.log('\n📋 Vérifications:');
  console.log('1. Connectez-vous à votre dashboard Amplitude: https://analytics.amplitude.com');
  console.log('2. Allez dans "Events" pour voir les événements en temps réel');
  console.log('3. Vérifiez que les 4 événements de test apparaissent');
  console.log('4. Les propriétés comme property_id, intent_level doivent être visibles');
}

// Exécuter le test
testAmplitudeEvents().catch(console.error);