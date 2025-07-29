// Script pour analyser l'incohérence des dates dans le tracking
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDateInconsistency() {
  console.log('🔍 Analyse de l\'incohérence des dates...\n');
  
  try {
    const propertyId = 'cmdoi4i8a0006l204cajv0hpo';
    
    // 1. Vérifier les détails de la propriété
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        titre: true,
        createdAt: true,
        updatedAt: true,
        agentId: true
      }
    });
    
    if (!property) {
      console.log('❌ Propriété non trouvée:', propertyId);
      return;
    }
    
    console.log('🏠 Propriété analysée:');
    console.log(`   ID: ${property.id}`);
    console.log(`   Titre: ${property.titre}`);
    console.log(`   Créée le: ${property.createdAt.toLocaleString('fr-FR', { 
      dateStyle: 'full', 
      timeStyle: 'medium',
      timeZone: 'Africa/Douala'
    })}`);
    console.log(`   Modifiée le: ${property.updatedAt.toLocaleString('fr-FR', { 
      dateStyle: 'full', 
      timeStyle: 'medium',
      timeZone: 'Africa/Douala'
    })}`);
    console.log('');
    
    // 2. Analyser les vues (PropertyView)
    const propertyViews = await prisma.propertyView.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        createdAt: true,
        viewerIp: true,
        userAgent: true
      }
    });
    
    console.log(`👁️  PropertyView - ${propertyViews.length} enregistrements:`);
    propertyViews.forEach((view, index) => {
      const timeDiff = new Date(view.createdAt) - new Date(property.createdAt);
      const diffHours = Math.round(timeDiff / (1000 * 60 * 60));
      
      console.log(`   ${index + 1}. Vue créée le: ${view.createdAt.toLocaleString('fr-FR', { 
        dateStyle: 'full', 
        timeStyle: 'medium',
        timeZone: 'Africa/Douala'
      })}`);
      console.log(`      IP: ${view.viewerIp}`);
      console.log(`      Différence avec création propriété: ${diffHours}h`);
      
      if (timeDiff < 0) {
        console.log(`      ⚠️  PROBLÈME: Vue antérieure à la création de la propriété !`);
      }
      console.log('');
    });
    
    // 3. Analyser les sessions de temps (PropertyTimeSession)
    const timeSessions = await prisma.propertyTimeSession.findMany({
      where: { propertyId },
      orderBy: { enteredAt: 'asc' },
      select: {
        id: true,
        sessionId: true,
        enteredAt: true,
        lastActiveAt: true,
        leftAt: true,
        timeSpent: true,
        viewerIp: true
      }
    });
    
    console.log(`⏱️  PropertyTimeSession - ${timeSessions.length} enregistrements:`);
    timeSessions.forEach((session, index) => {
      const timeDiff = new Date(session.enteredAt) - new Date(property.createdAt);
      const diffHours = Math.round(timeDiff / (1000 * 60 * 60));
      
      console.log(`   ${index + 1}. Session ${session.sessionId.slice(-8)}`);
      console.log(`      Entrée: ${session.enteredAt.toLocaleString('fr-FR', { 
        dateStyle: 'full', 
        timeStyle: 'medium',
        timeZone: 'Africa/Douala'
      })}`);
      console.log(`      IP: ${session.viewerIp}`);
      console.log(`      Temps passé: ${session.timeSpent || 'Non terminée'}s`);
      console.log(`      Différence avec création propriété: ${diffHours}h`);
      
      if (timeDiff < 0) {
        console.log(`      ⚠️  PROBLÈME: Session antérieure à la création de la propriété !`);
      }
      console.log('');
    });
    
    // 4. Vérifier s'il y a des données de test/développement
    console.log('🔍 Analyse des patterns suspects:');
    
    // Check des IPs communes (localhost, développement)
    const suspiciousIPs = ['127.0.0.1', '::1', 'localhost'];
    const allIPs = [
      ...propertyViews.map(v => v.viewerIp),
      ...timeSessions.map(s => s.viewerIp)
    ];
    
    const devIPs = allIPs.filter(ip => suspiciousIPs.includes(ip));
    if (devIPs.length > 0) {
      console.log(`   🔧 ${devIPs.length} vues/sessions depuis localhost détectées`);
    }
    
    // Check des créations en masse (même minute)
    const creationTimes = propertyViews.map(v => v.createdAt.getTime());
    const timeClusters = {};
    creationTimes.forEach(time => {
      const minute = Math.floor(time / 60000) * 60000;
      timeClusters[minute] = (timeClusters[minute] || 0) + 1;
    });
    
    const massClusters = Object.entries(timeClusters).filter(([_, count]) => count > 2);
    if (massClusters.length > 0) {
      console.log(`   📊 ${massClusters.length} clusters de vues simultanées détectées (possibles données de test)`);
    }
    
    // 5. Recommandations
    console.log('\n💡 Analyse et recommandations:');
    
    const hasAntedatedData = [...propertyViews, ...timeSessions].some(record => {
      const recordDate = record.createdAt || record.enteredAt;
      return new Date(recordDate) < new Date(property.createdAt);
    });
    
    if (hasAntedatedData) {
      console.log('   ❌ PROBLÈME CONFIRMÉ: Données antérieures à la création de la propriété');
      console.log('   🔧 Causes possibles:');
      console.log('      • Données de test non nettoyées');
      console.log('      • Script de peuplement avec dates incorrectes'); 
      console.log('      • Bug dans le système de tracking');
      console.log('      • Migration de données mal configurée');
      console.log('');
      console.log('   🛠️  Solutions recommandées:');
      console.log('      1. Supprimer les vues/sessions antérieures à la création');
      console.log('      2. Ajouter une validation côté API');
      console.log('      3. Nettoyer les données de développement');
    } else {
      console.log('   ✅ Dates cohérentes trouvées');
    }
    
    // 6. Proposer un script de nettoyage
    if (hasAntedatedData) {
      console.log('\n🧹 Script de nettoyage suggéré:');
      console.log(`
-- Supprimer les vues antérieures à la création de la propriété
DELETE FROM "PropertyView" 
WHERE "propertyId" = '${propertyId}' 
AND "createdAt" < (SELECT "createdAt" FROM "Property" WHERE "id" = '${propertyId}');

-- Supprimer les sessions antérieures à la création de la propriété  
DELETE FROM "PropertyTimeSession"
WHERE "propertyId" = '${propertyId}'
AND "enteredAt" < (SELECT "createdAt" FROM "Property" WHERE "id" = '${propertyId}');
      `);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDateInconsistency();