// Script pour tester l'API agent-time-analytics corrigée
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCorrectedAPI() {
  console.log('🧪 Test de l\'API agent-time-analytics corrigée...\n');
  
  try {
    // Simuler la logique de l'API corrigée
    const agentId = 'cmdmbmt3z0000dctynv24q9sr'; // Agent de test
    const days = 30;
    
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    console.log(`🔍 Analyse pour l'agent ${agentId.slice(-8)} sur ${days} jours\n`);
    
    // Récupérer toutes les sessions (ancienne logique)
    const allTimeSessions = await prisma.propertyTimeSession.findMany({
      where: {
        property: {
          agentId: agentId
        },
        enteredAt: {
          gte: startDate
        },
        timeSpent: {
          not: null
        }
      },
      include: {
        property: {
          select: {
            id: true,
            titre: true,
            createdAt: true,
            _count: {
              select: {
                visitRequests: true
              }
            }
          }
        }
      },
      orderBy: {
        enteredAt: 'desc'
      }
    });
    
    console.log(`📊 Sessions récupérées (avant filtrage): ${allTimeSessions.length}\n`);
    
    // Appliquer le nouveau filtre (sessions postérieures à la création de propriété)
    const filteredTimeSessions = allTimeSessions.filter(session => {
      const sessionDate = new Date(session.enteredAt);
      const propertyCreationDate = new Date(session.property.createdAt);
      return sessionDate >= propertyCreationDate;
    });
    
    console.log(`✅ Sessions après filtrage cohérence: ${filteredTimeSessions.length}\n`);
    
    // Analyser les sessions éliminées
    const eliminatedSessions = allTimeSessions.filter(session => {
      const sessionDate = new Date(session.enteredAt);
      const propertyCreationDate = new Date(session.property.createdAt);
      return sessionDate < propertyCreationDate;
    });
    
    if (eliminatedSessions.length > 0) {
      console.log(`❌ ${eliminatedSessions.length} sessions incohérentes éliminées:`);  
      eliminatedSessions.forEach((session, idx) => {
        const sessionDate = new Date(session.enteredAt);
        const propertyCreationDate = new Date(session.property.createdAt);
        const diffHours = Math.round((propertyCreationDate - sessionDate) / (1000 * 60 * 60));
        console.log(`   ${idx + 1}. ${session.property.titre}: session du ${sessionDate.toLocaleDateString('fr-FR')} (${diffHours}h avant création)`);
      });
      console.log('');
    }
    
    // Grouper par propriété pour les performances
    const propertiesMap = new Map();
    
    filteredTimeSessions.forEach(session => {
      const propId = session.property.id;
      if (!propertiesMap.has(propId)) {
        propertiesMap.set(propId, {
          title: session.property.titre,
          createdAt: session.property.createdAt,
          sessions: [],
          visitRequestsCount: session.property._count.visitRequests
        });
      }
      propertiesMap.get(propId).sessions.push(session);
    });
    
    // Calculer les performances par propriété (logique API)
    const propertiesPerformance = Array.from(propertiesMap.entries()).map(([propertyId, data]) => {
      const sessions = data.sessions;
      const sessionCount = sessions.length;
      const avgTime = sessionCount > 0 ? 
        sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / sessionCount : 0;
      const avgScrollDepth = sessionCount > 0 ? 
        sessions.reduce((sum, s) => sum + (s.scrollDepth || 0), 0) / sessionCount : 0;
      const bounces = sessions.filter(s => (s.timeSpent || 0) < 30).length;
      const propertyBounceRate = sessionCount > 0 ? (bounces / sessionCount) * 100 : 0;
      
      return {
        propertyId,
        propertyTitle: data.title,
        propertyCreatedAt: data.createdAt,
        totalSessions: sessionCount,
        averageTimeSpent: Math.round(avgTime),
        averageScrollDepth: Math.round(avgScrollDepth * 100) / 100,
        bounceRate: Math.round(propertyBounceRate * 100) / 100,
      };
    }).sort((a, b) => b.totalSessions - a.totalSessions);
    
    // Tendances quotidiennes (logique API corrigée)
    const dailyMap = new Map();
    
    filteredTimeSessions.forEach(session => {
      const dateStr = session.enteredAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { timeSum: 0, count: 0 });
      }
      const dayData = dailyMap.get(dateStr);
      dayData.timeSum += session.timeSpent || 0;
      dayData.count++;
    });
    
    const dailyAverages = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      averageTimeSpent: data.count > 0 ? Math.round(data.timeSum / data.count) : 0,
      sessionsCount: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    // Afficher les résultats
    console.log('🏠 Performances par propriété (après correction):');
    propertiesPerformance.forEach((prop, idx) => {
      const createdDate = new Date(prop.propertyCreatedAt).toLocaleDateString('fr-FR');
      console.log(`   ${idx + 1}. ${prop.propertyTitle} (créée le ${createdDate})`);
      console.log(`      Sessions cohérentes: ${prop.totalSessions}`);
      console.log(`      Temps moyen: ${prop.averageTimeSpent}s`);
      console.log(`      Taux rebond: ${prop.bounceRate}%`);
      console.log('');
    });
    
    console.log('📈 Tendances quotidiennes (filtrées):');
    if (dailyAverages.length === 0) {
      console.log('   ℹ️  Aucune tendance (pas de sessions cohérentes)');
    } else {
      dailyAverages.forEach((day, idx) => {
        console.log(`   ${idx + 1}. ${day.date}: ${day.sessionsCount} sessions, ${day.averageTimeSpent}s moy.`);
      });
    }
    
    // Comparer avec les données de PropertyView
    console.log('\n👁️  Comparaison avec les vues réelles:');
    for (const [propertyId, data] of propertiesMap.entries()) {
      const viewsCount = await prisma.propertyView.count({
        where: { propertyId: propertyId }
      });
      
      const validViewsCount = await prisma.propertyView.count({
        where: { 
          propertyId: propertyId,
          createdAt: {
            gte: new Date(data.createdAt)
          }
        }
      });
      
      const ratio = data.sessions.length / Math.max(validViewsCount, 1);
      console.log(`   ${data.title}:`);
      console.log(`     Vues totales: ${viewsCount} | Vues valides: ${validViewsCount}`);
      console.log(`     Sessions cohérentes: ${data.sessions.length}`);
      console.log(`     Ratio sessions/vues valides: ${ratio.toFixed(1)}`);
      console.log('');
    }
    
    console.log('✨ Test de l\'API corrigée terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCorrectedAPI();