#!/usr/bin/env node

/**
 * Script pour aider au débogage de la configuration PostHog
 */

require('dotenv').config({ path: '.env.local' });

async function debugPostHogConfig() {
  console.log('🔍 Débogage configuration PostHog\n');

  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  console.log('Configuration actuelle:');
  console.log(`  POSTHOG_PERSONAL_API_KEY: ${apiKey ? apiKey.substring(0, 10) + '...' : 'Non définie'}`);
  console.log(`  POSTHOG_PROJECT_ID: ${projectId || 'Non défini'}`);
  console.log(`  NEXT_PUBLIC_POSTHOG_HOST: ${host || 'Non défini'}`);

  if (!apiKey || !projectId || !host) {
    console.log('\n❌ Configuration incomplète');
    return;
  }

  // Vérifier le format de la clé
  console.log('\n📋 Analyse de la clé API:');
  if (apiKey.startsWith('phc_')) {
    console.log('  ✅ Format correct (commence par phc_)');
  } else if (apiKey.startsWith('phx_')) {
    console.log('  ⚠️  Clé publique détectée (phx_) - vous avez besoin d\'une clé personnelle (phc_)');
  } else {
    console.log('  ❌ Format incorrect - devrait commencer par phc_');
  }

  // Tester différentes régions
  const regions = [
    { name: 'US', api: 'https://us.i.posthog.com', app: 'https://app.posthog.com' },
    { name: 'EU', api: 'https://eu.i.posthog.com', app: 'https://eu.posthog.com' }
  ];

  console.log('\n🌍 Test des différentes régions:');

  for (const region of regions) {
    console.log(`\n--- Test région ${region.name} ---`);
    
    try {
      const response = await fetch(`${region.api}/api/projects/${projectId}/events/?limit=1`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      console.log(`  Status: ${response.status}`);
      
      if (response.ok) {
        console.log('  ✅ Connexion réussie!');
        console.log(`  💡 Votre projet est dans la région ${region.name}`);
        console.log(`  🌐 URL d\'accès: ${region.app}`);
        return;
      } else if (response.status === 401) {
        console.log('  ❌ Clé API invalide pour cette région');
      } else if (response.status === 404) {
        console.log('  ❌ Projet non trouvé dans cette région');
      } else {
        const text = await response.text();
        console.log(`  ❌ Autre erreur: ${text.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Erreur de connexion: ${error.message}`);
    }
  }

  console.log('\n💡 Conseils:');
  console.log('1. Vérifiez que vous utilisez une clé PERSONNELLE (phc_) et non une clé publique (phx_)');
  console.log('2. Allez dans votre dashboard PostHog > Settings > Personal API Keys');
  console.log('3. Créez une nouvelle clé si nécessaire');
  console.log('4. Assurez-vous que le projet ID correspond bien à votre projet');
}

debugPostHogConfig().catch(console.error);