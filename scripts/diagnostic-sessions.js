// Script de diagnostic pour analyser l'état des sessions PropertyTimeSession
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function diagnosticSessions() {
  console.log('🔍 Diagnostic des sessions PropertyTimeSession...\n');
  
  try {
    // 1. Statistiques générales des sessions
    const totalSessions = await prisma.propertyTimeSession.count();
    console.log(`📊 Total des sessions: ${totalSessions}`);
    
    // 2. Sessions terminées (avec timeSpent défini)
    const completedSessions = await prisma.propertyTimeSession.count({
      where: {
        timeSpent: { not: null }
      }
    });
    console.log(`✅ Sessions terminées: ${completedSessions}`);
    
    // 3. Sessions incomplètes (timeSpent = null)
    const incompleteSessions = await prisma.propertyTimeSession.count({
      where: {
        timeSpent: null
      }
    });
    console.log(`❌ Sessions incomplètes: ${incompleteSessions}`);
    
    // 4. Pourcentage de sessions terminées
    const completionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0;
    console.log(`📈 Taux de completion: ${completionRate}%\n`);
    
    // 5. Analyse par propriété
    console.log('📋 Analyse par propriété:');
    const propertyStats = await prisma.propertyTimeSession.groupBy({
      by: ['propertyId'],
      _count: {
        id: true
      },
      _sum: {
        timeSpent: true
      }
    });
    
    for (const stat of propertyStats) {
      // Récupérer les infos de la propriété
      const property = await prisma.property.findUnique({
        where: { id: stat.propertyId },
        select: { titre: true }
      });
      
      // Compter les sessions complètes vs incomplètes pour cette propriété
      const completed = await prisma.propertyTimeSession.count({
        where: {
          propertyId: stat.propertyId,
          timeSpent: { not: null }
        }
      });
      
      const incomplete = await prisma.propertyTimeSession.count({
        where: {
          propertyId: stat.propertyId,
          timeSpent: null
        }
      });
      
      console.log(`  • ${property?.titre || 'Propriété inconnue'}`);
      console.log(`    Total: ${stat._count.id} | Terminées: ${completed} | Incomplètes: ${incomplete}`);
      console.log(`    Temps total: ${stat._sum.timeSpent || 0}s`);
    }
    
    console.log('\n🔍 Détail des sessions incomplètes récentes:');
    
    // 6. Examiner quelques sessions incomplètes récentes
    const recentIncomplete = await prisma.propertyTimeSession.findMany({
      where: {
        timeSpent: null
      },
      include: {
        property: {
          select: { titre: true }
        }
      },
      orderBy: {
        enteredAt: 'desc'
      },
      take: 5
    });
    
    for (const session of recentIncomplete) {
      const duration = session.lastActiveAt ? 
        Math.round((new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000) : 0;
      
      console.log(`  • Session ${session.sessionId.slice(-8)}`);
      console.log(`    Propriété: ${session.property.titre}`);
      console.log(`    Entrée: ${session.enteredAt.toLocaleString()}`);
      console.log(`    Dernière activité: ${session.lastActiveAt?.toLocaleString() || 'N/A'}`);
      console.log(`    Durée estimée: ${duration}s`);
      console.log(`    Scroll depth: ${session.scrollDepth || 0}%`);
      console.log('');
    }
    
    // 7. Suggestions d'amélioration
    console.log('💡 Suggestions:');
    if (incompleteSessions > completedSessions) {
      console.log('  ⚠️  Plus de 50% des sessions sont incomplètes');
      console.log('  → Considérer une logique de nettoyage automatique');
      console.log('  → Modifier l\'API dashboard pour inclure les sessions incomplètes');
    }
    
    if (totalSessions > 0) {
      console.log(`  📊 ${incompleteSessions} sessions peuvent être récupérées avec un script de nettoyage`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour estimer le temps des sessions incomplètes
async function estimateIncompleteSessionTime() {
  console.log('\n⏱️  Estimation du temps pour les sessions incomplètes...');
  
  try {
    const incompleteSessions = await prisma.propertyTimeSession.findMany({
      where: {
        timeSpent: null
      },
      select: {
        id: true,
        sessionId: true,
        enteredAt: true,
        lastActiveAt: true,
        property: {
          select: { titre: true }
        }
      }
    });
    
    let totalEstimatedTime = 0;
    let sessionsWithEstimate = 0;
    
    console.log(`📋 ${incompleteSessions.length} sessions à analyser:`);
    
    for (const session of incompleteSessions.slice(0, 10)) { // Limiter à 10 pour l'affichage
      if (session.lastActiveAt) {
        const estimatedTime = Math.round(
          (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
        );
        
        if (estimatedTime > 0 && estimatedTime < 3600) { // Sessions de moins d'1 heure
          totalEstimatedTime += estimatedTime;
          sessionsWithEstimate++;
          
          console.log(`  • ${session.property.titre}`);
          console.log(`    Session: ${session.sessionId.slice(-8)}`);
          console.log(`    Temps estimé: ${estimatedTime}s`);
        }
      }
    }
    
    if (sessionsWithEstimate > 0) {
      const averageTime = Math.round(totalEstimatedTime / sessionsWithEstimate);
      console.log(`\n📊 Temps moyen estimé: ${averageTime}s`);
      console.log(`📈 ${sessionsWithEstimate} sessions récupérables sur ${incompleteSessions.length}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'estimation:', error);
  }
}

// Exécuter les diagnostics
diagnosticSessions().then(() => {
  return estimateIncompleteSessionTime();
});