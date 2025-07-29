const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAgents() {
  try {
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' },
      select: { id: true, nom: true, prenom: true }
    });
    
    console.log('Agents:', agents);
    
    const properties = await prisma.property.findMany({
      select: { id: true, titre: true, agentId: true }
    });
    
    console.log('Propriétés (3 premières):', properties.slice(0, 3));
    
    // Vérifier quelle agentId est utilisée dans les propriétés
    const agentIds = [...new Set(properties.map(p => p.agentId))];
    console.log('AgentIds uniques dans les propriétés:', agentIds);
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAgents();