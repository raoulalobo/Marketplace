#!/usr/bin/env node

/**
 * Script pour mettre à jour facilement la clé API PostHog
 */

const fs = require('fs');
const path = require('path');

function updatePostHogApiKey(newApiKey) {
  if (!newApiKey || !newApiKey.startsWith('phc_')) {
    console.log('❌ Clé API invalide. Doit commencer par "phc_"');
    return false;
  }

  const envPath = path.join(__dirname, '../.env.local');
  
  try {
    // Lire le fichier actuel
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Remplacer ou ajouter la clé API
    const apiKeyRegex = /^POSTHOG_PERSONAL_API_KEY=.*$/m;
    
    if (apiKeyRegex.test(envContent)) {
      // Remplacer la clé existante
      envContent = envContent.replace(apiKeyRegex, `POSTHOG_PERSONAL_API_KEY=${newApiKey}`);
    } else {
      // Ajouter la clé si elle n'existe pas
      envContent += `\nPOSTHOG_PERSONAL_API_KEY=${newApiKey}\n`;
    }

    // Écrire le fichier mis à jour
    fs.writeFileSync(envPath, envContent);
    
    console.log('✅ Clé API PostHog mise à jour avec succès !');
    console.log(`📝 Fichier: ${envPath}`);
    console.log(`🔑 Clé: ${newApiKey.substring(0, 20)}...`);
    
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error.message);
    return false;
  }
}

// Si une clé est fournie en argument
const apiKey = process.argv[2];
if (apiKey) {
  updatePostHogApiKey(apiKey);
} else {
  console.log('Usage: node scripts/update-posthog-key.js <votre_cle_api_phc_...>');
  console.log('Exemple: node scripts/update-posthog-key.js phc_votre_cle_complete');
}