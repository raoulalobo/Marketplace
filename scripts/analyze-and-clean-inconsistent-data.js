// Script pour analyser et nettoyer les données incohérentes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeAndCleanInconsistentData() {
  console.log('🔍 Analyse et nettoyage des données incohérentes...\n');
  
  try {
    // 1. Analyser toutes les propriétés avec des sessions antérieures à leur création
    console.log('📊 Recherche des incohérences temporelles...\n');
    
    const inconsistentSessions = await prisma.propertyTimeSession.findMany({
      where: {
        enteredAt: {
          lt: prisma.property.findFirst({
            where: { id: prisma.propertyTimeSession.fields.propertyId },
            select: { createdAt: true }
          })
        }
      },
      include: {
        property: {
          select: {
            id: true,
            titre: true,
            createdAt: true,
            agentId: true
          }
        }
      }
    });

    console.log(`❌ ${inconsistentSessions.length} sessions incohérentes trouvées\n`);

    // Analyser les détails
    const problemsByProperty = new Map();
    
    for (const session of inconsistentSessions) {
      const propId = session.property.id;
      if (!problemsByProperty.has(propId)) {
        problemsByProperty.set(propId, {
          property: session.property,
          sessions: [],
          views: []
        });
      }
      problemsByProperty.get(propId).sessions.push(session);
    }

    // 2. Analyser les vues incohérentes
    const inconsistentViews = await prisma.propertyView.findMany({
      where: {
        createdAt: {
          lt: prisma.property.findFirst({
            where: { id: prisma.propertyView.fields.propertyId },
            select: { createdAt: true }
          })
        }
      },
      include: {
        property: {
          select: {
            id: true,
            titre: true,
            createdAt: true
          }
        }
      }
    });

    console.log(`❌ ${inconsistentViews.length} vues incohérentes trouvées\n`);

    // Ajouter les vues aux problèmes
    for (const view of inconsistentViews) {
      const propId = view.property.id;
      if (!problemsByProperty.has(propId)) {
        problemsByProperty.set(propId, {
          property: view.property,
          sessions: [],
          views: []
        });
      }
      problemsByProperty.get(propId).views.push(view);
    }

    // 3. Analyser les ratios anormaux vues/sessions
    console.log('📈 Analyse des ratios vues/sessions...\n');
    
    const propertiesStats = await prisma.property.findMany({
      include: {
        _count: {
          select: {
            propertyViews: true,
            timeSessions: true
          }
        }
      }
    });

    const suspiciousProperties = propertiesStats.filter(prop => {
      const viewsCount = prop._count.propertyViews;
      const sessionsCount = prop._count.timeSessions;
      
      // Ratio suspect : plus de 5 sessions par vue ou plus de 10 sessions au total avec moins de 3 vues
      return (viewsCount > 0 && sessionsCount / viewsCount > 5) || 
             (sessionsCount > 10 && viewsCount < 3);
    });

    console.log(`⚠️  ${suspiciousProperties.length} propriétés avec ratios suspects:\n`);
    
    suspiciousProperties.forEach(prop => {
      const ratio = prop._count.timeSessions / Math.max(prop._count.propertyViews, 1);
      console.log(`   • ${prop.titre}: ${prop._count.propertyViews} vues, ${prop._count.timeSessions} sessions (ratio: ${ratio.toFixed(1)})`);
    });

    // 4. Résumé des problèmes par propriété
    console.log('\n🏠 Résumé des problèmes par propriété:\n');
    
    Array.from(problemsByProperty.entries()).forEach(([propId, data]) => {
      const prop = data.property;
      const sessionsCount = data.sessions.length;
      const viewsCount = data.views.length;
      
      console.log(`📋 ${prop.titre} (créée le ${new Date(prop.createdAt).toLocaleDateString('fr-FR')}):`);
      
      if (sessionsCount > 0) {
        console.log(`   ❌ ${sessionsCount} sessions antérieures à la création`);
        data.sessions.forEach((session, idx) => {
          const diffHours = Math.round((new Date(prop.createdAt) - new Date(session.enteredAt)) / (1000 * 60 * 60));
          console.log(`      ${idx + 1}. Session du ${new Date(session.enteredAt).toLocaleDateString('fr-FR')} (${diffHours}h avant création)`);
        });
      }
      
      if (viewsCount > 0) {
        console.log(`   ❌ ${viewsCount} vues antérieures à la création`);
        data.views.forEach((view, idx) => {
          const diffHours = Math.round((new Date(prop.createdAt) - new Date(view.createdAt)) / (1000 * 60 * 60));
          console.log(`      ${idx + 1}. Vue du ${new Date(view.createdAt).toLocaleDateString('fr-FR')} (${diffHours}h avant création)`);
        });
      }
      console.log('');
    });

    // 5. Proposer le nettoyage
    const totalInconsistentRecords = inconsistentSessions.length + inconsistentViews.length;
    
    if (totalInconsistentRecords > 0) {
      console.log('🧹 PLAN DE NETTOYAGE RECOMMANDÉ:\n');
      console.log(`   1. Supprimer ${inconsistentSessions.length} sessions antérieures`);
      console.log(`   2. Supprimer ${inconsistentViews.length} vues antérieures`);
      console.log(`   3. Recalculer les compteurs viewsCount`);
      console.log(`   4. Vérifier l'intégrité des données\n`);
      
      // Demander confirmation pour le nettoyage automatique
      console.log('💡 Voulez-vous procéder au nettoyage automatique ?');
      console.log('   • Modifiez ce script et décommenter la section NETTOYAGE ci-dessous');
      console.log('   • Ou exécutez les commandes SQL manuellement\n');
      
      // SECTION NETTOYAGE (décommenter pour exécuter)
      /*
      console.log('🔧 Nettoyage en cours...\n');
      
      // Supprimer les sessions incohérentes
      for (const session of inconsistentSessions) {
        await prisma.propertyTimeSession.delete({
          where: { id: session.id }
        });
        console.log(`   ✅ Session ${session.id} supprimée`);
      }
      
      // Supprimer les vues incohérentes  
      for (const view of inconsistentViews) {
        await prisma.propertyView.delete({
          where: { id: view.id }
        });
        console.log(`   ✅ Vue ${view.id} supprimée`);
      }
      
      // Recalculer les compteurs
      const propertiesToUpdate = Array.from(problemsByProperty.keys());
      for (const propId of propertiesToUpdate) {
        const newViewsCount = await prisma.propertyView.count({
          where: { propertyId: propId }
        });
        
        await prisma.property.update({
          where: { id: propId },
          data: { viewsCount: newViewsCount }
        });
        
        console.log(`   ✅ Compteur mis à jour pour propriété ${propId}: ${newViewsCount} vues`);
      }
      
      console.log('\n🎉 Nettoyage terminé avec succès !');
      */
      
    } else {
      console.log('✅ Aucune incohérence trouvée - les données sont cohérentes !');
    }
    
    // 6. Vérification finale
    console.log('\n🔬 Vérification post-analyse:');
    console.log(`   • ${problemsByProperty.size} propriétés avec des problèmes identifiés`);
    console.log(`   • ${suspiciousProperties.length} propriétés avec ratios suspects`);
    console.log(`   • ${totalInconsistentRecords} enregistrements incohérents au total`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeAndCleanInconsistentData();