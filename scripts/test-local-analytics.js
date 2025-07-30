#!/usr/bin/env node

/**
 * Script pour tester les endpoints avec données locales
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLocalAnalytics() {
  try {
    console.log('🧪 Test des analytics locaux avec données réelles\n');

    // Récupérer une propriété avec des données
    const property = await prisma.property.findFirst({
      where: {
        OR: [
          { id: 'cmdmhgdpb0001dcu9o68jyrpw' }, // Celle avec le plus de sessions
          { id: 'cmdoi4i8a0006l204cajv0hpo' },  // Celle avec des vues
        ]
      },
      include: {
        _count: {
          select: {
            views: true,
            timeSessions: true,
            visitRequests: true,
            favorites: true,
          }
        }
      }
    });

    if (!property) {
      console.log('❌ Aucune propriété trouvée pour le test');
      return;
    }

    console.log(`📊 Test avec la propriété: ${property.titre} (${property.id})`);
    console.log(`   Statistiques de la base:`);
    console.log(`   - Vues: ${property._count.views}`);
    console.log(`   - Sessions temps: ${property._count.timeSessions}`);
    console.log(`   - Demandes visite: ${property._count.visitRequests}`);
    console.log(`   - Favoris: ${property._count.favorites}`);

    // Calculer les analytics locaux
    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Récupérer les données détaillées
    const [views, timeSessions, visitRequests, favorites] = await Promise.all([
      prisma.propertyView.findMany({
        where: {
          propertyId: property.id,
          createdAt: { gte: startDate }
        }
      }),
      prisma.propertyTimeSession.findMany({
        where: {
          propertyId: property.id,
          enteredAt: { gte: startDate }
        }
      }),
      prisma.visitRequest.findMany({
        where: {
          propertyId: property.id,
          createdAt: { gte: startDate }
        }
      }),
      prisma.favorite.findMany({
        where: {
          propertyId: property.id,
          createdAt: { gte: startDate }
        }
      })
    ]);

    console.log(`\n📈 Données détaillées (${days} derniers jours):`);
    console.log(`   Vues détaillées: ${views.length}`);
    console.log(`   Sessions détaillées: ${timeSessions.length}`);
    console.log(`   Demandes détaillées: ${visitRequests.length}`);
    console.log(`   Favoris détaillés: ${favorites.length}`);

    // Calculer les métriques
    const completedSessions = timeSessions.filter(session => 
      session.timeSpent && session.timeSpent > 0
    );
    const totalTime = completedSessions.reduce((sum, session) => 
      sum + (session.timeSpent || 0), 0
    );
    const averageTime = completedSessions.length > 0 ? 
      Math.round(totalTime / completedSessions.length) : 0;

    const shortSessions = completedSessions.filter(session => 
      (session.timeSpent || 0) < 30
    ).length;
    const bounceRate = completedSessions.length > 0 ? 
      Math.round((shortSessions / completedSessions.length) * 100) : 0;

    const conversionRate = timeSessions.length > 0 ? 
      Math.round((visitRequests.length / timeSessions.length) * 100) : 0;

    console.log(`\n📊 Métriques calculées:`);
    console.log(`   Temps moyen: ${averageTime} secondes`);
    console.log(`   Taux de rebond: ${bounceRate}%`);
    console.log(`   Taux de conversion: ${conversionRate}%`);

    // Analyser les sessions temps
    if (timeSessions.length > 0) {
      console.log(`\n⏱️  Analyse des sessions temps:`);
      const sessionTimes = timeSessions
        .filter(s => s.timeSpent)
        .map(s => s.timeSpent)
        .sort((a, b) => a - b);
      
      if (sessionTimes.length > 0) {
        console.log(`   Temps minimum: ${Math.min(...sessionTimes)}s`);
        console.log(`   Temps maximum: ${Math.max(...sessionTimes)}s`);
        console.log(`   Temps médian: ${sessionTimes[Math.floor(sessionTimes.length / 2)]}s`);
        
        // Distribution des temps
        const timeRanges = {
          '0-30s': sessionTimes.filter(t => t <= 30).length,
          '30s-2min': sessionTimes.filter(t => t > 30 && t <= 120).length,
          '2-5min': sessionTimes.filter(t => t > 120 && t <= 300).length,
          '5min+': sessionTimes.filter(t => t > 300).length,
        };
        
        console.log(`   Distribution des temps:`);
        Object.entries(timeRanges).forEach(([range, count]) => {
          console.log(`     ${range}: ${count} sessions`);
        });
      }
    }

    // Analyser les vues par jour
    if (views.length > 0) {
      console.log(`\n📅 Vues par jour:`);
      const viewsByDay = new Map();
      views.forEach(view => {
        const day = view.createdAt.toISOString().split('T')[0];
        viewsByDay.set(day, (viewsByDay.get(day) || 0) + 1);
      });
      
      Array.from(viewsByDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([day, count]) => {
          console.log(`     ${day}: ${count} vues`);
        });
    }

    console.log(`\n✅ Test des analytics locaux réussi !`);
    console.log(`💡 Les endpoints devraient maintenant fonctionner avec les données locales`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLocalAnalytics().catch(console.error);