// Test simple de PostHog
require('dotenv').config({ path: '.env.local' });
console.log('🧪 Test de PostHog...\n');

// Vérifier les variables d'environnement
const requiredEnvVars = [
  'NEXT_PUBLIC_POSTHOG_KEY',
  'NEXT_PUBLIC_POSTHOG_HOST',
  'POSTHOG_PERSONAL_API_KEY',
  'POSTHOG_PROJECT_ID'
];

console.log('🔍 Vérification de la configuration:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value && value !== 'phc_your_public_key_here' && value !== 'phx_your_personal_api_key_here' && value !== 'your_project_id_here') {
    console.log(`✅ ${envVar}: configuré`);
  } else {
    console.log(`❌ ${envVar}: manquant ou non configuré`);
  }
});

// Test de l'API PostHog
console.log('\n📡 Test de l\'API PostHog:');
const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;

if (!POSTHOG_PERSONAL_API_KEY || !POSTHOG_PROJECT_ID) {
  console.log('❌ Configuration PostHog manquante - impossible de tester l\'API');
} else {
  console.log('✅ Configuration PostHog détectée');
  console.log(`   Project ID: ${POSTHOG_PROJECT_ID}`);
  console.log(`   API Key: ${POSTHOG_PERSONAL_API_KEY.substring(0, 20)}...`);
  
  // Test simple d'appel API
  const testApiCall = async () => {
    try {
      const response = await fetch(
        `https://us.i.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/`,
        {
          headers: {
            'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (response.ok) {
        console.log('✅ API PostHog accessible');
        const data = await response.json();
        console.log(`   Nom du projet: ${data.name || 'N/A'}`);
        console.log(`   Organisation: ${data.organization?.name || 'N/A'}`);
      } else {
        console.log(`❌ Erreur API PostHog: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Erreur de connexion à l'API PostHog: ${error.message}`);
    }
  };
  
  testApiCall();
}

console.log('\n🎯 Test terminé!');