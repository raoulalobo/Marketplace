// Script automatisé pour créer un utilisateur administrateur (pour les tests)
const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Fonction pour créer un admin automatiquement avec des paramètres
async function createAdminAuto(adminData = {}) {
  const {
    email = 'admin@marketplace-immo.cm',
    prenom = 'Admin',
    nom = 'Système',
    telephone = '+237612345678',
    password = 'Admin123!'
  } = adminData;

  console.log('🔧 Création automatique d\'un utilisateur administrateur');
  console.log('====================================================\n');

  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ Un utilisateur avec cet email existe déjà.');
      
      if (existingUser.role === UserRole.ADMIN) {
        console.log('ℹ️  Cet utilisateur est déjà administrateur.');
        console.log('✅ Aucune action nécessaire.');
        return existingUser;
      } else {
        console.log('🔄 Promotion de l\'utilisateur existant en administrateur...');
        const updatedUser = await prisma.user.update({
          where: { email },
          data: { role: UserRole.ADMIN }
        });
        console.log('✅ Utilisateur promu administrateur avec succès !');
        return updatedUser;
      }
    }

    // Hacher le mot de passe
    console.log('🔐 Hachage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur admin
    console.log('👤 Création de l\'utilisateur administrateur...');
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        telephone,
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: new Date()
      }
    });

    console.log('\n✅ Utilisateur administrateur créé avec succès !');
    console.log('==========================================');
    console.log(`🆔 ID : ${admin.id}`);
    console.log(`📧 Email : ${admin.email}`);
    console.log(`👤 Nom : ${admin.prenom} ${admin.nom}`);
    console.log(`👑 Rôle : ${admin.role}`);
    console.log(`✅ Actif : ${admin.isActive ? 'Oui' : 'Non'}`);
    console.log('==========================================');
    console.log('\n🚀 Informations de connexion :');
    console.log(`   📧 Email : ${admin.email}`);
    console.log(`   🔒 Mot de passe : ${password}`);
    console.log('\n🎯 Accès au dashboard admin : /admin/dashboard');

    return admin;

  } catch (error) {
    console.error('\n❌ Erreur lors de la création de l\'administrateur :');
    console.error(error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Si le script est exécuté directement
if (require.main === module) {
  // Récupérer les arguments de ligne de commande
  const args = process.argv.slice(2);
  const adminData = {};
  
  // Parser les arguments --key=value
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (value) {
        adminData[key] = value;
      }
    }
  });

  createAdminAuto(adminData)
    .then(() => {
      console.log('\n🎉 Script terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale :', error);
      process.exit(1);
    });
}

module.exports = { createAdminAuto };