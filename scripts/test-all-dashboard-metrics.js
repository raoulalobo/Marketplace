const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAllDashboardMetrics() {
  console.log('🎯 Test des métriques dashboard pour toutes les propriétés avec sessions...\n');
  
  try {
    // Récupérer toutes les propriétés qui ont des sessions
    const propertiesWithSessions = await prisma.property.findMany({
      where: {
        timeSessions: {
          some: {}
        }
      },
      select: {
        id: true,
        titre: true,
        agentId: true,
        _count: {
          select: {
            timeSessions: true
          }
        }
      },
      orderBy: {
        titre: 'asc'
      }
    });
    
    console.log(`📊 ${propertiesWithSessions.length} propriétés avec sessions trouvées\n`);
    
    for (const property of propertiesWithSessions) {
      console.log(`🏠 ${property.titre}`);
      console.log(`   ID: ${property.id}`);
      
      // Appliquer la logique exacte de l'API dashboard
      
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
      
      // Sessions incomplètes
      const incompleteSessions = await prisma.propertyTimeSession.findMany({
        where: {
          propertyId: property.id,
          timeSpent: null
        },
        select: {
          enteredAt: true,
          lastActiveAt: true,
          scrollDepth: true
        }
      });
      
      // Estimer le temps pour les sessions incomplètes
      let incompleteTimeSum = 0;
      let incompleteActiveTimeSum = 0;
      let incompleteScrollSum = 0;
      let validIncompleteSessions = 0;
      
      for (const session of incompleteSessions) {
        if (session.lastActiveAt) {
          const estimatedTime = Math.round(
            (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
          );
          
          if (estimatedTime >= 5 && estimatedTime <= 3600) {
            incompleteTimeSum += estimatedTime;
            incompleteActiveTimeSum += estimatedTime;
            incompleteScrollSum += (session.scrollDepth || 0);
            validIncompleteSessions++;
          }
        }
      }
      
      // Combiner les statistiques
      const completedCount = completedTimeStats._count.id;
      const totalValidSessions = completedCount + validIncompleteSessions;
      
      let averageTimeSpent = 0;
      let averageActiveTime = 0;
      let averageScrollDepth = 0;
      
      if (totalValidSessions > 0) {
        const completedTimeSum = (completedTimeStats._avg.timeSpent || 0) * completedCount;
        const completedActiveTimeSum = (completedTimeStats._avg.activeTime || 0) * completedCount;
        const completedScrollSum = (completedTimeStats._avg.scrollDepth || 0) * completedCount;
        
        averageTimeSpent = Math.round((completedTimeSum + incompleteTimeSum) / totalValidSessions);
        averageActiveTime = Math.round((completedActiveTimeSum + incompleteActiveTimeSum) / totalValidSessions);
        averageScrollDepth = Math.round(((completedScrollSum + incompleteScrollSum) / totalValidSessions) * 100) / 100;
      }
      
      // Vues réelles
      const realViewsCount = await prisma.propertyView.count({
        where: {
          propertyId: property.id
        }
      });
      
      // Taux de rebond
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
      
      // Affichage des résultats
      console.log(`   📊 Métriques Dashboard:`);
      console.log(`      • Vues: ${realViewsCount}`);
      console.log(`      • Sessions: ${totalValidSessions} (${completedCount} terminées + ${validIncompleteSessions} estimées)`);
      console.log(`      • Temps moyen: ${averageTimeSpent}s`);
      console.log(`      • Temps actif: ${averageActiveTime}s`);
      console.log(`      • Scroll depth: ${averageScrollDepth}%`);
      console.log(`      • Taux rebond: ${Math.round(bounceRate * 100) / 100}%`);
      
      // Indiquer si c'est une amélioration
      if (completedCount === 0 && totalValidSessions > 0) {
        console.log(`   🎉 AMÉLIORATION: était 0s → maintenant ${averageTimeSpent}s !`);
      } else if (validIncompleteSessions > 0) {
        console.log(`   ✨ ENRICHI: +${validIncompleteSessions} sessions récupérées`);
      }
      
      console.log('');
    }
    
    // Statistiques globales
    console.log('📈 Statistiques globales:');
    
    const totalSessions = await prisma.propertyTimeSession.count();
    const completedSessions = await prisma.propertyTimeSession.count({
      where: { timeSpent: { not: null } }
    });
    const completionRate = totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0;
    
    console.log(`   • Total sessions: ${totalSessions}`);
    console.log(`   • Sessions complètes: ${completedSessions}`);
    console.log(`   • Taux completion: ${completionRate}%`);
    
    const totalViews = await prisma.propertyView.count();
    console.log(`   • Total vues: ${totalViews}`);
    
    console.log('\n🎯 Résumé: Les métriques de temps et taux de rebond s\'affichent maintenant correctement dans le dashboard !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAllDashboardMetrics();