// Script de nettoyage rétroactif pour les sessions PropertyTimeSession incomplètes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupIncompleteSessions() {
  console.log('🧹 Nettoyage rétroactif des sessions incomplètes...\n');
  
  try {
    // 1. Analyser les sessions incomplètes
    const incompleteSessions = await prisma.propertyTimeSession.findMany({
      where: {
        timeSpent: null
      },
      select: {
        id: true,
        sessionId: true,
        enteredAt: true,
        lastActiveAt: true,
        scrollDepth: true,
        property: {
          select: { titre: true }
        }
      }
    });
    
    console.log(`📊 ${incompleteSessions.length} sessions incomplètes trouvées`);
    
    let processed = 0;
    let updated = 0;
    let skipped = 0;
    
    for (const session of incompleteSessions) {
      processed++;
      
      if (!session.lastActiveAt) {
        console.log(`⏭️  Session ${session.sessionId.slice(-8)}: pas de lastActiveAt, ignorée`);
        skipped++;
        continue;
      }
      
      // Calculer le temps estimé
      let estimatedTime = Math.round(
        (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
      );
      
      // Filtrer les sessions valides (5s minimum, 1h maximum)
      if (estimatedTime < 5) {
        console.log(`⏭️  Session ${session.sessionId.slice(-8)}: ${estimatedTime}s trop court, ignorée`);
        skipped++;
        continue;
      }
      
      if (estimatedTime > 3600) {
        console.log(`⏭️  Session ${session.sessionId.slice(-8)}: ${estimatedTime}s trop long, limitée à 3600s`);
        // Limiter à 1 heure maximum
        estimatedTime = 3600;
      }
      
      try {
        // Mettre à jour la session avec les valeurs calculées
        await prisma.propertyTimeSession.update({
          where: { id: session.id },
          data: {
            timeSpent: estimatedTime,
            activeTime: estimatedTime, // Approximation : temps total = temps actif
            leftAt: session.lastActiveAt // Utiliser lastActiveAt comme leftAt
          }
        });
        
        console.log(`✅ Session ${session.sessionId.slice(-8)} (${session.property.titre}): ${estimatedTime}s ajoutés`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Erreur mise à jour session ${session.sessionId.slice(-8)}:`, error.message);
        skipped++;
      }
    }
    
    console.log('\n📊 Résumé du nettoyage:');
    console.log(`   - Sessions traitées: ${processed}`);
    console.log(`   - Sessions mises à jour: ${updated}`);
    console.log(`   - Sessions ignorées: ${skipped}`);
    
    // 2. Vérifier l'impact sur les statistiques
    console.log('\n📈 Impact sur les statistiques:');
    
    const propertiesWithSessions = await prisma.property.findMany({
      where: {
        timeSessions: {
          some: {}
        }
      },
      select: {
        id: true,
        titre: true,
        _count: {
          select: {
            timeSessions: true
          }
        }
      }
    });
    
    for (const property of propertiesWithSessions.slice(0, 5)) { // Limiter à 5 pour l'affichage
      const completedCount = await prisma.propertyTimeSession.count({
        where: {
          propertyId: property.id,
          timeSpent: { not: null }
        }
      });
      
      const avgTimeSpent = await prisma.propertyTimeSession.aggregate({
        where: {
          propertyId: property.id,
          timeSpent: { not: null }
        },
        _avg: {
          timeSpent: true
        }
      });
      
      const viewsCount = await prisma.propertyView.count({
        where: { propertyId: property.id }
      });
      
      console.log(`🏠 ${property.titre}`);
      console.log(`   - Sessions complètes: ${completedCount}/${property._count.timeSessions}`);
      console.log(`   - Temps moyen: ${Math.round(avgTimeSpent._avg.timeSpent || 0)}s`);
      console.log(`   - Vues: ${viewsCount}`);
    }
    
    // 3. Statistiques globales après nettoyage
    console.log('\n🎯 Statistiques globales après nettoyage:');
    
    const totalSessions = await prisma.propertyTimeSession.count();
    const completedSessions = await prisma.propertyTimeSession.count({
      where: { timeSpent: { not: null } }
    });
    const completionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0;
    
    console.log(`   - Total sessions: ${totalSessions}`);
    console.log(`   - Sessions complètes: ${completedSessions}`);
    console.log(`   - Taux de completion: ${completionRate}%`);
    
    if (updated > 0) {
      console.log(`\n🎉 ${updated} sessions ont été récupérées et peuvent maintenant être utilisées dans les statistiques !`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Option pour annuler le nettoyage (dry-run)
async function dryRunCleanup() {
  console.log('🔍 Mode DRY-RUN - Simulation sans modifications...\n');
  
  try {
    const incompleteSessions = await prisma.propertyTimeSession.findMany({
      where: {
        timeSpent: null
      },
      select: {
        sessionId: true,
        enteredAt: true,
        lastActiveAt: true,
        property: {
          select: { titre: true }
        }
      }
    });
    
    console.log(`📊 ${incompleteSessions.length} sessions incomplètes analysées`);
    
    let wouldUpdate = 0;
    let wouldSkip = 0;
    
    for (const session of incompleteSessions) {
      if (!session.lastActiveAt) {
        wouldSkip++;
        continue;
      }
      
      const estimatedTime = Math.round(
        (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
      );
      
      if (estimatedTime >= 5 && estimatedTime <= 3600) {
        console.log(`✓ Serait mise à jour: ${session.sessionId.slice(-8)} (${session.property.titre}) - ${estimatedTime}s`);
        wouldUpdate++;
      } else {
        wouldSkip++;
      }
    }
    
    console.log(`\n📊 Résumé de la simulation:`);
    console.log(`   - Sessions qui seraient mises à jour: ${wouldUpdate}`);
    console.log(`   - Sessions qui seraient ignorées: ${wouldSkip}`);
    console.log(`\nPour exécuter le nettoyage réel, utilisez: node scripts/cleanup-incomplete-sessions.js --execute`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Vérifier les arguments de ligne de commande
const args = process.argv.slice(2);
if (args.includes('--execute')) {
  cleanupIncompleteSessions();
} else {
  dryRunCleanup();
}