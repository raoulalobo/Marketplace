const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCleanedProperty() {
  console.log('🧪 Test d\'une propriété après nettoyage...\n');
  
  try {
    // Test avec "En pratique, de nombreux développeurs combinent les deux" qui avait plusieurs sessions incomplètes
    const propertyId = 'cmdmhgdpb0001dcu9o68jyrpw';
    
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { 
        id: true, 
        titre: true, 
        agentId: true,
        _count: {
          select: {
            timeSessions: true
          }
        }
      }
    });
    
    if (!property) {
      console.log('❌ Propriété non trouvée');
      return;
    }
    
    console.log(`🏠 Propriété: ${property.titre}`);
    console.log(`📊 Sessions totales: ${property._count.timeSessions}\n`);
    
    // Appliquer la logique complète de l'API dashboard
    
    // 1. Sessions terminées
    const completedTimeStats = await prisma.propertyTimeSession.aggregate({
      where: {
        propertyId: property.id,
        timeSpent: { not: null }
      },
      _avg: {
        timeSpent: true,
        activeTime: true,
        scrollDepth: true
      },
      _count: {
        id: true
      }
    });
    
    console.log(`✅ Sessions terminées: ${completedTimeStats._count.id}`);
    
    // 2. Sessions incomplètes restantes
    const incompleteSessions = await prisma.propertyTimeSession.findMany({
      where: {
        propertyId: property.id,
        timeSpent: null
      },
      select: {
        sessionId: true,
        enteredAt: true,
        lastActiveAt: true,
        scrollDepth: true
      }
    });
    
    console.log(`⏳ Sessions incomplètes restantes: ${incompleteSessions.length}`);
    
    // 3. Estimer le temps pour les sessions incomplètes restantes
    let incompleteTimeSum = 0;
    let incompleteScrollSum = 0;
    let validIncompleteSessions = 0;
    
    for (const session of incompleteSessions) {
      if (session.lastActiveAt) {
        const estimatedTime = Math.round(
          (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
        );
        
        console.log(`   • Session ${session.sessionId.slice(-8)}: ${estimatedTime}s estimés`);
        
        if (estimatedTime >= 5 && estimatedTime <= 3600) {
          incompleteTimeSum += estimatedTime;
          incompleteScrollSum += (session.scrollDepth || 0);
          validIncompleteSessions++;
        }
      }
    }
    
    // 4. Combiner les statistiques
    const completedCount = completedTimeStats._count.id;
    const totalValidSessions = completedCount + validIncompleteSessions;
    
    let averageTimeSpent = 0;
    let averageScrollDepth = 0;
    
    if (totalValidSessions > 0) {
      const completedTimeSum = (completedTimeStats._avg.timeSpent || 0) * completedCount;
      const completedScrollSum = (completedTimeStats._avg.scrollDepth || 0) * completedCount;
      
      averageTimeSpent = Math.round((completedTimeSum + incompleteTimeSum) / totalValidSessions);
      averageScrollDepth = Math.round(((completedScrollSum + incompleteScrollSum) / totalValidSessions) * 100) / 100;
    }
    
    // 5. Vues réelles
    const realViewsCount = await prisma.propertyView.count({
      where: { propertyId: property.id }
    });
    
    // 6. Taux de rebond
    const completedBounceCount = await prisma.propertyTimeSession.count({
      where: {
        propertyId: property.id,
        timeSpent: { lt: 30, not: null }
      }
    });
    
    const incompleteBounceCount = incompleteSessions.filter(session => {
      if (!session.lastActiveAt) return false;
      const estimatedTime = Math.round(
        (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
      );
      return estimatedTime >= 5 && estimatedTime < 30;
    }).length;
    
    const totalBounces = completedBounceCount + incompleteBounceCount;
    const bounceRate = totalValidSessions > 0 ? (totalBounces / totalValidSessions) * 100 : 0;
    
    console.log(`\n📊 Résultats finaux (comme dans le dashboard):`);
    console.log(`    - Vues: ${realViewsCount}`);
    console.log(`    - Sessions valides: ${totalValidSessions}`);
    console.log(`    - Temps moyen: ${averageTimeSpent}s`);
    console.log(`    - Scroll depth moyen: ${averageScrollDepth}%`);
    console.log(`    - Taux de rebond: ${Math.round(bounceRate * 100) / 100}%`);
    
    // Comparer avec l'ancien système (seulement sessions terminées)
    const oldAverageTime = Math.round(completedTimeStats._avg.timeSpent || 0);
    const oldBounceRate = completedCount > 0 ? (completedBounceCount / completedCount) * 100 : 0;
    
    console.log(`\n🔄 Comparaison avec l'ancien système:`);
    console.log(`    - Ancien temps moyen: ${oldAverageTime}s → Nouveau: ${averageTimeSpent}s`);
    console.log(`    - Ancien taux rebond: ${Math.round(oldBounceRate * 100) / 100}% → Nouveau: ${Math.round(bounceRate * 100) / 100}%`);
    console.log(`    - Anciennes sessions: ${completedCount} → Nouvelles: ${totalValidSessions}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCleanedProperty();