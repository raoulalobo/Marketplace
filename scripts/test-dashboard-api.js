// Script pour tester directement l'API dashboard sans authentification
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDashboardLogic() {
  console.log('🧪 Test de la logique du dashboard...\n');
  
  try {
    // Récupérer l'agent ID - utiliser l'agent qui a des propriétés
    const agent = await prisma.user.findFirst({
      where: { 
        role: 'AGENT',
        id: 'cmdmbmt3z0000dctynv24q9sr' // Agent Alobo qui a les propriétés
      },
      select: { id: true, nom: true, prenom: true }
    });
    
    if (!agent) {
      console.log('❌ Aucun agent trouvé');
      return;
    }
    
    console.log(`👤 Agent trouvé: ${agent.prenom} ${agent.nom} (${agent.id})`);
    
    // Récupérer les propriétés de l'agent
    const properties = await prisma.property.findMany({
      where: { agentId: agent.id },
      include: {
        medias: {
          where: { type: 'PHOTO' },
          take: 1,
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            favorites: true,
            visitRequests: true,
            timeSessions: true
          }
        }
      },
      take: 3 // Limiter pour le test
    });
    
    console.log(`🏠 ${properties.length} propriétés trouvées pour cet agent\n`);
    
    // Appliquer la même logique que l'API dashboard pour chaque propriété
    for (const property of properties) {
      console.log(`📊 Analyse de: ${property.titre}`);
      
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
      
      console.log(`  ✅ Sessions terminées: ${completedTimeStats._count.id}`);
      
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
      
      console.log(`  ⏳ Sessions incomplètes trouvées: ${incompleteSessions.length}`);
      
      // Estimer le temps pour les sessions incomplètes
      let incompleteTimeSum = 0;
      let validIncompleteSessions = 0;
      
      for (const session of incompleteSessions) {
        if (session.lastActiveAt) {
          const estimatedTime = Math.round(
            (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
          );
          
          if (estimatedTime >= 5 && estimatedTime <= 3600) {
            incompleteTimeSum += estimatedTime;
            validIncompleteSessions++;
            console.log(`    • Session: ${estimatedTime}s estimés`);
          }
        }
      }
      
      console.log(`  📈 Sessions incomplètes valides: ${validIncompleteSessions}`);
      
      // Calculer les moyennes
      const completedCount = completedTimeStats._count.id;
      const totalValidSessions = completedCount + validIncompleteSessions;
      
      let averageTimeSpent = 0;
      if (totalValidSessions > 0) {
        const completedTimeSum = (completedTimeStats._avg.timeSpent || 0) * completedCount;
        averageTimeSpent = Math.round((completedTimeSum + incompleteTimeSum) / totalValidSessions);
      }
      
      // Vues réelles
      const realViewsCount = await prisma.propertyView.count({
        where: { propertyId: property.id }
      });
      
      console.log(`  📊 Résultats:`);
      console.log(`    - Vues: ${realViewsCount}`);
      console.log(`    - Sessions totales: ${totalValidSessions}`);
      console.log(`    - Temps moyen: ${averageTimeSpent}s`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardLogic();