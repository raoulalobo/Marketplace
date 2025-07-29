// Script simple pour nettoyer les données incohérentes
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanInconsistentData() {
  console.log('🔍 Nettoyage des données incohérentes...\n');
  
  try {
    // 1. Identifier la propriété problématique spécifique
    const propertyId = 'cmdoi4i8a0006l204cajv0hpo'; // La propriété de l'image
    
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
    
    console.log(`🏠 Analyse de: ${property.titre}`);
    console.log(`📅 Créée le: ${new Date(property.createdAt).toLocaleString('fr-FR')}\n`);
    
    // 2. Trouver les sessions antérieures à la création
    const badSessions = await prisma.propertyTimeSession.findMany({
      where: {
        propertyId: propertyId,
        enteredAt: {
          lt: property.createdAt
        }
      },
      select: {
        id: true,
        sessionId: true,
        enteredAt: true,
        timeSpent: true,
        viewerIp: true
      }
    });
    
    console.log(`❌ ${badSessions.length} sessions antérieures à la création trouvées:`);
    badSessions.forEach((session, idx) => {
      const diffHours = Math.round((new Date(property.createdAt) - new Date(session.enteredAt)) / (1000 * 60 * 60));
      console.log(`   ${idx + 1}. ${session.sessionId.slice(-8)} - ${new Date(session.enteredAt).toLocaleString('fr-FR')} (${diffHours}h avant)`);
    });
    console.log('');
    
    // 3. Trouver les vues antérieures à la création
    const badViews = await prisma.propertyView.findMany({
      where: {
        propertyId: propertyId,
        createdAt: {
          lt: property.createdAt
        }
      },
      select: {
        id: true,
        createdAt: true,
        viewerIp: true
      }
    });
    
    console.log(`❌ ${badViews.length} vues antérieures à la création trouvées:`);
    badViews.forEach((view, idx) => {
      const diffHours = Math.round((new Date(property.createdAt) - new Date(view.createdAt)) / (1000 * 60 * 60));
      console.log(`   ${idx + 1}. Vue du ${new Date(view.createdAt).toLocaleString('fr-FR')} (${diffHours}h avant)`);
    });
    console.log('');
    
    // 4. Analyser le ratio vues/sessions actuel
    const totalViews = await prisma.propertyView.count({
      where: { propertyId: propertyId }
    });
    
    const totalSessions = await prisma.propertyTimeSession.count({
      where: { propertyId: propertyId }
    });
    
    const validViews = totalViews - badViews.length;
    const validSessions = totalSessions - badSessions.length;
    
    console.log('📊 Statistiques actuelles:');
    console.log(`   • Vues totales: ${totalViews} (dont ${badViews.length} invalides) → ${validViews} valides`);
    console.log(`   • Sessions totales: ${totalSessions} (dont ${badSessions.length} invalides) → ${validSessions} valides`);
    console.log(`   • Ratio actuel: ${totalSessions}/${totalViews} = ${(totalSessions/Math.max(totalViews,1)).toFixed(1)}`);
    console.log(`   • Ratio après nettoyage: ${validSessions}/${validViews} = ${(validSessions/Math.max(validViews,1)).toFixed(1)}\n`);
    
    // 5. Nettoyage si nécessaire
    if (badSessions.length > 0 || badViews.length > 0) {
      console.log('🧹 Nettoyage des données incohérentes...\n');
      
      // Supprimer les sessions invalides
      if (badSessions.length > 0) {
        const deleteSessionsResult = await prisma.propertyTimeSession.deleteMany({
          where: {
            id: {
              in: badSessions.map(s => s.id)
            }
          }
        });
        console.log(`   ✅ ${deleteSessionsResult.count} sessions supprimées`);
      }
      
      // Supprimer les vues invalides
      if (badViews.length > 0) {
        const deleteViewsResult = await prisma.propertyView.deleteMany({
          where: {
            id: {
              in: badViews.map(v => v.id)
            }
          }
        });
        console.log(`   ✅ ${deleteViewsResult.count} vues supprimées`);
      }
      
      // Mettre à jour le compteur viewsCount
      const newViewsCount = await prisma.propertyView.count({
        where: { propertyId: propertyId }
      });
      
      await prisma.property.update({
        where: { id: propertyId },
        data: { viewsCount: newViewsCount }
      });
      
      console.log(`   ✅ Compteur viewsCount mis à jour: ${newViewsCount}\n`);
      
    } else {
      console.log('✅ Aucune donnée incohérente trouvée pour cette propriété\n');
    }
    
    // 6. Vérification générale (toutes les propriétés)
    console.log('🌍 Vérification générale sur toutes les propriétés...\n');
    
    // Compter toutes les sessions et vues incohérentes
    const allBadSessions = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM "property_time_sessions" pts
      JOIN "properties" p ON pts."propertyId" = p.id
      WHERE pts."enteredAt" < p."createdAt"
    `;
    
    const allBadViews = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "property_views" pv  
      JOIN "properties" p ON pv."propertyId" = p.id
      WHERE pv."createdAt" < p."createdAt"
    `;
    
    console.log(`📈 Incohérences globales:`);
    console.log(`   • Sessions incohérentes: ${allBadSessions[0].count}`);
    console.log(`   • Vues incohérentes: ${allBadViews[0].count}`);
    
    if (Number(allBadSessions[0].count) === 0 && Number(allBadViews[0].count) === 0) {
      console.log('\n🎉 Toutes les données sont maintenant cohérentes !');
    } else {
      console.log('\n⚠️  Il reste des incohérences dans d\'autres propriétés.');
      console.log('   Exécutez ce script pour chaque propriété problématique.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanInconsistentData();