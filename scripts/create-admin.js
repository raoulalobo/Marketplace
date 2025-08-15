// Script pour créer un utilisateur administrateur
const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

// Interface pour les entrées utilisateur
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Fonction utilitaire pour poser des questions
function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

// Fonction pour masquer le mot de passe lors de la saisie
function hiddenQuestion(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    
    process.stdin.on('data', function(char) {
      char = char + '';
      
      switch(char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl+D
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.exit();
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

// Validation des entrées
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password.length >= 6;
}

// Fonction principale
async function createAdmin() {
  console.log('🔧 Script de création d\'un utilisateur administrateur');
  console.log('================================================\n');

  try {
    // Collecte des informations
    console.log('📝 Veuillez saisir les informations de l\'administrateur :\n');

    const email = await question('📧 Email : ');
    if (!validateEmail(email)) {
      console.log('❌ Email invalide. Veuillez utiliser un format valide.');
      process.exit(1);
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('❌ Un utilisateur avec cet email existe déjà.');
      
      if (existingUser.role === UserRole.ADMIN) {
        console.log('ℹ️  Cet utilisateur est déjà administrateur.');
      } else {
        const upgrade = await question('❓ Voulez-vous le promouvoir administrateur ? (oui/non) : ');
        if (upgrade.toLowerCase() === 'oui' || upgrade.toLowerCase() === 'o') {
          await prisma.user.update({
            where: { email },
            data: { role: UserRole.ADMIN }
          });
          console.log('✅ Utilisateur promu administrateur avec succès !');
        }
      }
      process.exit(0);
    }

    const prenom = await question('👤 Prénom : ');
    if (!prenom.trim()) {
      console.log('❌ Le prénom est obligatoire.');
      process.exit(1);
    }

    const nom = await question('👤 Nom : ');
    if (!nom.trim()) {
      console.log('❌ Le nom est obligatoire.');
      process.exit(1);
    }

    const telephone = await question('📱 Téléphone (optionnel) : ');

    const password = await hiddenQuestion('🔒 Mot de passe : ');
    if (!validatePassword(password)) {
      console.log('\n❌ Le mot de passe doit contenir au moins 6 caractères.');
      process.exit(1);
    }

    const passwordConfirm = await hiddenQuestion('🔒 Confirmer le mot de passe : ');
    if (password !== passwordConfirm) {
      console.log('\n❌ Les mots de passe ne correspondent pas.');
      process.exit(1);
    }

    console.log('\n📋 Récapitulatif :');
    console.log(`📧 Email : ${email}`);
    console.log(`👤 Nom complet : ${prenom} ${nom}`);
    console.log(`📱 Téléphone : ${telephone || 'Non renseigné'}`);
    console.log(`👑 Rôle : ADMINISTRATEUR`);

    const confirm = await question('\n❓ Confirmer la création ? (oui/non) : ');
    if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o') {
      console.log('❌ Création annulée.');
      process.exit(0);
    }

    // Hacher le mot de passe
    console.log('\n🔐 Hachage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Créer l'utilisateur admin
    console.log('👤 Création de l\'utilisateur administrateur...');
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        telephone: telephone || null,
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: new Date() // Compte vérifié par défaut
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
    console.log('\n🚀 L\'administrateur peut maintenant se connecter sur :');
    console.log('   📍 URL : /auth/login');
    console.log(`   📧 Email : ${admin.email}`);
    console.log('   🔒 Mot de passe : [le mot de passe saisi]');
    console.log('\n🎯 Accès au dashboard admin : /admin/dashboard');

  } catch (error) {
    console.error('\n❌ Erreur lors de la création de l\'administrateur :');
    console.error(error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Gestion de l'interruption
process.on('SIGINT', async () => {
  console.log('\n\n❌ Création interrompue par l\'utilisateur.');
  await prisma.$disconnect();
  rl.close();
  process.exit(0);
});

// Exécution
createAdmin().catch(async (error) => {
  console.error('❌ Erreur fatale :', error);
  await prisma.$disconnect();
  rl.close();
  process.exit(1);
});