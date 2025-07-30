#!/usr/bin/env node

/**
 * Script pour tester l'accès au projet PostHog de différentes manières
 */

require('dotenv').config({ path: '.env.local' });

async function testProjectAccess() {
  console.log('🔍 Test d\'accès au projet PostHog\n');

  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;

  console.log(`Clé API: ${apiKey?.substring(0, 20)}...`);
  console.log(`Projet ID: ${projectId}`);

  if (!apiKey || !projectId) {
    console.log('❌ Configuration incomplète');
    return;
  }

  // Test 1: Vérifier si le projet existe
  console.log('\n📋 Test 1: Vérification du projet...');
  try {
    const response = await fetch(`https://eu.i.posthog.com/api/projects/${projectId}/`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const project = await response.json();
      console.log('✅ Projet trouvé!');
      console.log(`Nom: ${project.name || 'N/A'}`);
      console.log(`ID: ${project.id || 'N/A'}`);
      console.log(`Région: ${project.region || 'N/A'}`);
    } else {
      const text = await response.text();
      console.log(`❌ Projet non trouvé: ${text.substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }

  // Test 2: Lister les projets accessibles
  console.log('\n📋 Test 2: Liste des projets accessibles...');
  try {
    const response = await fetch('https://eu.i.posthog.com/api/projects/', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const projects = await response.json();
      console.log(`✅ ${projects.results?.length || 0} projets trouvés`);
      
      if (projects.results && projects.results.length > 0) {
        console.log('\nProjets accessibles:');
        projects.results.forEach((project, index) => {
          console.log(`${index + 1}. ${project.name} (ID: ${project.id})`);
        });
        
        // Vérifier si notre projet ID est dans la liste
        const foundProject = projects.results.find(p => p.id == projectId);
        if (foundProject) {
          console.log(`\n✅ Votre projet (ID: ${projectId}) est dans la liste!`);
          console.log(`Nom correct: ${foundProject.name}`);
        } else {
          console.log(`\n❌ Votre projet ID (${projectId}) n'est pas dans la liste`);
          console.log('💡 Utilisez un des IDs ci-dessus');
        }
      }
    } else {
      const text = await response.text();
      console.log(`❌ Erreur: ${text.substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }

  // Test 3: Vérifier les permissions de la clé
  console.log('\n📋 Test 3: Vérification des permissions...');
  try {
    const response = await fetch('https://eu.i.posthog.com/api/users/@me/', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const user = await response.json();
      console.log('✅ Utilisateur authentifié!');
      console.log(`Email: ${user.email || 'N/A'}`);
      console.log(`UUID: ${user.uuid || 'N/A'}`);
      console.log(`Organisation: ${user.organization?.name || 'N/A'}`);
    } else {
      const text = await response.text();
      console.log(`❌ Erreur d\'authentification: ${text.substring(0, 100)}`);
    }
  } catch (error) {
    console.log(`❌ Erreur: ${error.message}`);
  }
}

testProjectAccess().catch(console.error);