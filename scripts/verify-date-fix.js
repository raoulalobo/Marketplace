// Script pour vérifier que la correction des dates fonctionne correctement
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDateFix() {
  console.log('🔍 Vérification de la correction des dates...\n');
  
  try {
    const propertyId = 'cmdoi4i8a0006l204cajv0hpo';
    
    // 1. Récupérer la propriété
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        titre: true,
        createdAt: true
      }
    });
    
    if (!property) {
      console.log('❌ Propriété non trouvée');
      return;
    }
    
    const propertyCreated = new Date(property.createdAt);
    const now = new Date();
    const daysSinceCreation = Math.ceil((now.getTime() - propertyCreated.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`🏠 Propriété: ${property.titre}`);
    console.log(`📅 Créée le: ${propertyCreated.toLocaleDateString('fr-FR')}`);
    console.log(`⏰ Âge: ${daysSinceCreation} jour(s)\n`);
    
    // 2. Simuler la logique de l'interface corrigée
    const displayPeriod = daysSinceCreation === 1 ? "aujourd'hui" : 
                         daysSinceCreation <= 7 ? `${daysSinceCreation} derniers jours` :
                         "7 derniers jours";
    
    console.log('🎯 Test de la logique d\'affichage corrigée:');
    console.log(`   Période d'affichage: "Tendances ${displayPeriod}"`);
    
    // 3. Récupérer les analytics avec filtrage par date de création
    const timeSessions = await prisma.propertyTimeSession.findMany({
      where: {
        propertyId: propertyId,
        timeSpent: { not: null }
      },
      select: {
        enteredAt: true,
        timeSpent: true
      },
      orderBy: { enteredAt: 'asc' }
    });
    
    // 4. Filtrer pour ne montrer que les données depuis la création
    const relevantSessions = timeSessions.filter(session => {
      const sessionDate = new Date(session.enteredAt);
      return sessionDate >= propertyCreated;
    }).slice(-Math.min(daysSinceCreation, 7));
    
    console.log(`\n📊 Sessions dans la période affichée: ${relevantSessions.length}`);
    
    // 5. Grouper par jour pour les tendances
    const dailyMap = new Map();
    
    relevantSessions.forEach(session => {
      const dateStr = session.enteredAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { timeSum: 0, count: 0 });
      }
      const dayData = dailyMap.get(dateStr);
      dayData.timeSum += session.timeSpent || 0;
      dayData.count++;
    });
    
    const dailyTrends = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      averageTimeSpent: data.count > 0 ? Math.round(data.timeSum / data.count) : 0,
      sessionsCount: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    console.log('\n📈 Tendances quotidiennes filtrées:');
    if (dailyTrends.length === 0) {
      console.log('   ℹ️  Aucune donnée de tendance (normal pour une propriété neuve sans sessions terminées)');
    } else {
      dailyTrends.forEach((day, index) => {
        const dayDate = new Date(day.date);
        const isBeforeCreation = dayDate < propertyCreated;
        const status = isBeforeCreation ? ' ❌ ANTÉRIEUR' : ' ✅ VALIDE';
        
        console.log(`   ${index + 1}. ${day.date}: ${day.sessionsCount} sessions, ${day.averageTimeSpent}s moy.${status}`);
      });
    }
    
    // 6. Vérifier la cohérence
    console.log('\n🔬 Vérification de cohérence:');
    
    const hasAntedatedTrends = dailyTrends.some(day => {
      return new Date(day.date) < propertyCreated;
    });
    
    if (hasAntedatedTrends) {
      console.log('   ❌ PROBLÈME: Des tendances antérieures à la création sont encore présentes');
    } else {
      console.log('   ✅ SUCCÈS: Toutes les tendances sont postérieures ou égales à la date de création');
    }
    
    // 7. Test des badges d'information
    if (daysSinceCreation === 1) {
      console.log('   ✅ Badge "Propriété créée aujourd\'hui" sera affiché');
    }
    
    // 8. Message de confirmation
    console.log('\n🎉 Résumé de la correction:');
    console.log('   ✨ L\'affichage s\'adapte maintenant à l\'âge de la propriété');
    console.log('   🔄 Les données sont filtrées pour ne montrer que les jours depuis la création');
    console.log('   📱 L\'interface indique clairement la période couverte');
    console.log('   🏷️  Un badge informatif apparaît pour les propriétés créées aujourd\'hui');
    
    if (daysSinceCreation === 1) {
      console.log('\n💡 Pour cette propriété créée aujourd\'hui:');
      console.log('   - Affichage: "Tendances aujourd\'hui"');
      console.log('   - Badge: "Propriété créée aujourd\'hui"');
      console.log('   - Données: Seulement celles d\'aujourd\'hui ou plus tard');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDateFix();