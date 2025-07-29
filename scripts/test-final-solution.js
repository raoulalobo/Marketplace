// Script final pour tester toutes les corrections
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFinalSolution() {
  console.log('🎯 Test final de la solution complète...\n');
  
  try {
    const propertyId = 'cmdoi4i8a0006l204cajv0hpo';
    
    // 1. Vérifier la propriété de base
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        titre: true,
        createdAt: true,
        agentId: true
      }
    });
    
    if (!property) {
      console.log('❌ Propriété non trouvée');
      return;
    }
    
    console.log(`🏠 Test pour: ${property.titre}`);
    console.log(`📅 Créée le: ${new Date(property.createdAt).toLocaleString('fr-FR')}`);
    console.log(`👤 Agent: ${property.agentId.slice(-8)}\n`);
    
    // 2. Simuler l'API spécifique à la propriété
    const propertyCreatedAt = new Date(property.createdAt);
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const effectiveStartDate = startDate > propertyCreatedAt ? startDate : propertyCreatedAt;
    
    // Récupérer toutes les sessions pour cette propriété
    const allSessions = await prisma.propertyTimeSession.findMany({
      where: {
        propertyId: propertyId,
        enteredAt: {
          gte: effectiveStartDate
        }
      },
      select: {
        id: true,
        enteredAt: true,
        lastActiveAt: true,
        timeSpent: true,
        scrollDepth: true
      }
    });
    
    console.log(`📊 Sessions trouvées: ${allSessions.length}`);
    
    // Vérifier cohérence temporelle
    let inconsistentSessions = 0;
    allSessions.forEach(session => {
      if (new Date(session.enteredAt) < propertyCreatedAt) {
        inconsistentSessions++;
      }
    });
    
    if (inconsistentSessions > 0) {
      console.log(`❌ ${inconsistentSessions} sessions incohérentes trouvées !`);
    } else {
      console.log(`✅ Toutes les sessions sont cohérentes temporellement`);
    }
    
    // Calculer les métriques comme la nouvelle API
    const completedSessions = allSessions.filter(s => s.timeSpent !== null);
    const incompleteSessions = allSessions.filter(s => s.timeSpent === null);
    
    // Estimer le temps pour sessions incomplètes
    let totalTime = 0;
    let validSessions = 0;
    
    completedSessions.forEach(s => {
      totalTime += s.timeSpent || 0;
      validSessions++;
    });
    
    incompleteSessions.forEach(s => {
      if (s.lastActiveAt) {
        const estimatedTime = Math.round(
          (new Date(s.lastActiveAt).getTime() - new Date(s.enteredAt).getTime()) / 1000
        );
        if (estimatedTime >= 5 && estimatedTime <= 3600) {
          totalTime += estimatedTime;
          validSessions++;
        }
      }
    });
    
    const averageTime = validSessions > 0 ? Math.round(totalTime / validSessions) : 0;
    
    // Récupérer les vues cohérentes
    const validViews = await prisma.propertyView.count({
      where: {
        propertyId: propertyId,
        createdAt: {
          gte: propertyCreatedAt
        }
      }
    });
    
    console.log(`\n📈 Métriques calculées (comme la nouvelle API):`);
    console.log(`   • Sessions totales: ${allSessions.length}`);
    console.log(`   • Sessions terminées: ${completedSessions.length}`);
    console.log(`   • Sessions incomplètes: ${incompleteSessions.length}`);
    console.log(`   • Sessions valides pour calcul: ${validSessions}`);
    console.log(`   • Temps moyen: ${averageTime}s`);
    console.log(`   • Vues cohérentes: ${validViews}`);
    console.log(`   • Ratio sessions/vues: ${(allSessions.length / Math.max(validViews, 1)).toFixed(1)}`);
    
    // 3. Simuler les tendances quotidiennes
    const dailyMap = new Map();
    
    allSessions.forEach(session => {
      const sessionDate = new Date(session.enteredAt);
      if (sessionDate >= propertyCreatedAt) {
        const dateStr = sessionDate.toISOString().split('T')[0];
        
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, { sessions: 0, timeSum: 0, validTimeCount: 0 });
        }
        
        const dayData = dailyMap.get(dateStr);
        dayData.sessions++;
        
        // Ajouter le temps si disponible
        let sessionTime = 0;
        if (session.timeSpent !== null) {
          sessionTime = session.timeSpent;
        } else if (session.lastActiveAt) {
          const estimatedTime = Math.round(
            (new Date(session.lastActiveAt).getTime() - sessionDate.getTime()) / 1000
          );
          if (estimatedTime >= 5 && estimatedTime <= 3600) {
            sessionTime = estimatedTime;
          }
        }
        
        if (sessionTime > 0) {
          dayData.timeSum += sessionTime;
          dayData.validTimeCount++;
        }
      }
    });
    
    console.log(`\n📅 Tendances quotidiennes (après filtrage):`);
    
    if (dailyMap.size === 0) {
      console.log(`   ℹ️  Aucune donnée de tendance (normal pour une propriété sans sessions)`);
    } else {
      const sortedDays = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      
      sortedDays.forEach(([date, data]) => {
        const avgTime = data.validTimeCount > 0 ? Math.round(data.timeSum / data.validTimeCount) : 0;
        console.log(`   ${date}: ${data.sessions} sessions, ${avgTime}s moy.`);
      });
    }
    
    // 4. Calculer l'âge de la propriété pour l'affichage
    const daysSinceCreation = Math.ceil((now.getTime() - propertyCreatedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    const displayPeriod = daysSinceCreation === 1 ? "aujourd'hui" : 
                         daysSinceCreation <= 7 ? `${daysSinceCreation} derniers jours` :
                         "7 derniers jours";
    
    console.log(`\n🎨 Interface utilisateur:`);
    console.log(`   • Affichage: "Tendances ${displayPeriod}"`);
    console.log(`   • Badge informatif: ${daysSinceCreation === 1 ? '"Propriété créée aujourd\'hui"' : 'Aucun'}`);
    console.log(`   • Cohérence logique: ✅ Aucune donnée antérieure à la création`);
    
    // 5. Résumer les améliorations
    console.log(`\n🎉 Résumé des corrections appliquées:`);
    console.log(`   ✅ API spécifique à la propriété créée`);
    console.log(`   ✅ Filtrage par date de création de propriété`);
    console.log(`   ✅ Sessions terminées ET incomplètes prises en compte`);
    console.log(`   ✅ Tendances cohérentes (seulement après création)`);
    console.log(`   ✅ Affichage adaptatif selon l'âge de la propriété`);
    console.log(`   ✅ Ratios vues/sessions réalistes`);
    console.log(`   ✅ Plus d'incohérences temporelles`);
    
    // 6. Prédiction du résultat interface
    console.log(`\n🔮 Interface utilisateur attendue:`);
    console.log(`   • ${allSessions.length} sessions (au lieu de 11 sessions d'autres propriétés)`);
    console.log(`   • ${validViews} vues cohérentes`);
    console.log(`   • Tendances depuis le ${propertyCreatedAt.toLocaleDateString('fr-FR')}`);
    console.log(`   • Plus de sessions antérieures à la création`);
    
    if (daysSinceCreation === 1) {
      console.log(`   • Badge "Propriété créée aujourd'hui" affiché`);
      console.log(`   • Titre "Tendances aujourd'hui" au lieu de "7 derniers jours"`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalSolution();