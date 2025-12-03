/**
 * Script de Verificación de Integración
 * Verifica que todos los componentes necesarios estén presentes
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - FALTA: ${filePath}`, 'red');
    return false;
  }
}

function checkDirectory(dirPath, description) {
  const exists = fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  if (exists) {
    log(`✓ ${description}`, 'green');
    return true;
  } else {
    log(`✗ ${description} - FALTA: ${dirPath}`, 'red');
    return false;
  }
}

function main() {
  log('\n=== VERIFICACIÓN DE INTEGRACIÓN ===\n', 'cyan');
  
  let allChecks = true;

  // Backend Files
  log('Backend (NestJS):', 'blue');
  allChecks &= checkFile('src/main.ts', 'Archivo principal del servidor');
  allChecks &= checkFile('src/app.module.ts', 'Módulo principal de la aplicación');
  allChecks &= checkFile('src/game/game.module.ts', 'Módulo de juego');
  allChecks &= checkFile('src/game/game.gateway.ts', 'Gateway WebSocket');
  allChecks &= checkFile('src/game/game.service.ts', 'Servicio de juego');
  allChecks &= checkFile('src/game/room.service.ts', 'Servicio de salas');
  
  log('\nDTOs:', 'blue');
  allChecks &= checkFile('src/game/dto/join-room.dto.ts', 'DTO de unirse a sala');
  allChecks &= checkFile('src/game/dto/set-player-name.dto.ts', 'DTO de establecer nombre');
  allChecks &= checkFile('src/game/dto/select-height.dto.ts', 'DTO de seleccionar altura');
  
  log('\nInterfaces:', 'blue');
  allChecks &= checkFile('src/game/interfaces/player.interface.ts', 'Interface de jugador');
  allChecks &= checkFile('src/game/interfaces/room.interface.ts', 'Interface de sala');
  allChecks &= checkFile('src/game/interfaces/game-events.interface.ts', 'Interface de eventos');
  
  log('\nUtilidades:', 'blue');
  allChecks &= checkFile('src/game/utils/code-generator.util.ts', 'Generador de códigos');
  allChecks &= checkFile('src/game/utils/score-calculator.util.ts', 'Calculador de puntuación');
  
  log('\nConfiguración:', 'blue');
  allChecks &= checkFile('src/config/game.config.ts', 'Configuración del juego');
  
  // Frontend Files
  log('\nFrontend (Cliente):', 'blue');
  allChecks &= checkFile('public/index.html', 'Página HTML principal');
  allChecks &= checkFile('public/styles/main.css', 'Estilos CSS');
  allChecks &= checkFile('public/scripts/game-client.js', 'Cliente WebSocket');
  allChecks &= checkFile('public/scripts/state-manager.js', 'Gestor de estado');
  allChecks &= checkFile('public/scripts/ui-controller.js', 'Controlador de UI');
  allChecks &= checkFile('public/scripts/validators.js', 'Validadores del cliente');
  
  // Configuration Files
  log('\nArchivos de Configuración:', 'blue');
  allChecks &= checkFile('package.json', 'Configuración de npm');
  allChecks &= checkFile('tsconfig.json', 'Configuración de TypeScript');
  allChecks &= checkFile('nest-cli.json', 'Configuración de NestJS CLI');
  allChecks &= checkFile('.env.example', 'Ejemplo de variables de entorno');
  
  // Documentation
  log('\nDocumentación:', 'blue');
  allChecks &= checkFile('README.md', 'README principal');
  allChecks &= checkFile('MANUAL_TESTING_GUIDE.md', 'Guía de pruebas manuales');
  
  // Check node_modules
  log('\nDependencias:', 'blue');
  allChecks &= checkDirectory('node_modules', 'Módulos de Node.js instalados');
  
  // Summary
  log('\n=== RESUMEN ===\n', 'cyan');
  
  if (allChecks) {
    log('✓ Todos los componentes están presentes', 'green');
    log('\nPróximos pasos:', 'cyan');
    log('1. Copiar .env.example a .env (si no existe)', 'yellow');
    log('2. Ejecutar: npm run start:dev', 'yellow');
    log('3. Abrir navegador en: http://localhost:3000', 'yellow');
    log('4. Seguir la guía: MANUAL_TESTING_GUIDE.md', 'yellow');
    return 0;
  } else {
    log('✗ Faltan algunos componentes', 'red');
    log('\nPor favor, verifica los archivos faltantes marcados arriba.', 'yellow');
    return 1;
  }
}

process.exit(main());
