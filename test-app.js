// Script de test simple pour vérifier l'application
const { spawn } = require('child_process');

console.log('🚀 Démarrage de l'application Next.js...');

const dev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

dev.on('close', (code) => {
  console.log(`Application fermée avec le code ${code}`);
});

// Arrêt propre
process.on('SIGINT', () => {
  console.log('\n⏹️ Arrêt de l\'application...');
  dev.kill('SIGINT');
  process.exit(0);
});

console.log('📝 Application disponible sur http://localhost:3000');
console.log('⚠️  Pour arrêter, appuyez sur Ctrl+C');