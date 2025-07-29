// Vérifier la propriété problématique
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProblematicProperty() {
  const propertyId = 'cmdoi4i8a0006l204cajv0hpo';
  
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      timeSessions: {
        select: {
          id: true,
          enteredAt: true,
          timeSpent: true,
          sessionId: true
        }
      },
      views: {
        select: {
          id: true,
          createdAt: true,
          viewerIp: true
        }
      }
    }
  });
  
  if (!property) {
    console.log('❌ Propriété non trouvée');
    return;
  }
  
  console.log(`🏠 ${property.titre}`);
  console.log(`👤 Agent: ${property.agentId}`);
  console.log(`📅 Créée: ${property.createdAt}`);
  console.log(`\n📊 Sessions: ${property.timeSessions.length}`);
  property.timeSessions.forEach((s, i) => {
    console.log(`   ${i+1}. ${s.sessionId?.slice(-8)} - ${s.enteredAt} (${s.timeSpent}s)`);
  });
  
  console.log(`\n👁️  Vues: ${property.views.length}`);
  property.views.forEach((v, i) => {
    console.log(`   ${i+1}. ${v.createdAt} (${v.viewerIp})`);
  });
  
  await prisma.$disconnect();
}

checkProblematicProperty();