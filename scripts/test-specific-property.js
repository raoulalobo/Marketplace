const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSpecificProperty() {
  console.log('🧪 Test d\'une propriété spécifique avec sessions...\n');
  
  try {
    // Propriété avec le plus de sessions : "Résidence standing avec piscine à Omnisport"
    const propertyId = 'cmdmc854m000idcll17fyiimn';
    
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { 
        id: true, 
        titre: true, 
        agentId: true,
        _count: {
          select: {
            favorites: true,
            visitRequests: true,
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
    console.log(`👤 Agent ID: ${property.agentId}`);
    console.log(`📊 Sessions dans _count: ${property._count.timeSessions}\n`);
    
    // Sessions terminées
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
    if (completedTimeStats._count.id > 0) {
      console.log(`   - Temps moyen: ${completedTimeStats._avg.timeSpent}s`);
      console.log(`   - Temps actif moyen: ${completedTimeStats._avg.activeTime}s`);
      console.log(`   - Scroll depth moyen: ${completedTimeStats._avg.scrollDepth}%`);
    }
    
    // Sessions incomplètes
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
    
    console.log(`\n⏳ Sessions incomplètes trouvées: ${incompleteSessions.length}`);
    
    // Estimer le temps pour les sessions incomplètes
    let incompleteTimeSum = 0;
    let incompleteScrollSum = 0;
    let validIncompleteSessions = 0;
    
    for (const session of incompleteSessions) {
      if (session.lastActiveAt) {
        const estimatedTime = Math.round(
          (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
        );
        
        console.log(`   • Session ${session.sessionId.slice(-8)}: ${estimatedTime}s estimés, scroll: ${session.scrollDepth || 0}%`);
        
        if (estimatedTime >= 5 && estimatedTime <= 3600) {
          incompleteTimeSum += estimatedTime;
          incompleteScrollSum += (session.scrollDepth || 0);
          validIncompleteSessions++;
        }
      } else {
        console.log(`   • Session ${session.sessionId.slice(-8)}: pas de lastActiveAt`);
      }
    }
    
    console.log(`\n📈 Sessions incomplètes valides: ${validIncompleteSessions}`);
    
    // Calculer les moyennes combinées
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
    
    // Vues réelles
    const realViewsCount = await prisma.propertyView.count({
      where: { propertyId: property.id }
    });
    
    console.log(`\n📊 Résultats finaux:`);
    console.log(`    - Vues réelles: ${realViewsCount}`);
    console.log(`    - Sessions totales valides: ${totalValidSessions}`);
    console.log(`    - Temps moyen combiné: ${averageTimeSpent}s`);
    console.log(`    - Scroll depth moyen: ${averageScrollDepth}%`);
    
    // Calculer taux de rebond
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
    
    console.log(`    - Bounces: ${totalBounces}/${totalValidSessions} = ${Math.round(bounceRate * 100) / 100}%`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSpecificProperty();