# Juego de Salto y Pared

Un juego multijugador en tiempo real basado en navegador web donde los jugadores compiten durante 10 rondas eligiendo alturas de salto (1-10) para pasar a través de huecos en paredes móviles.

## Descripción

Este proyecto implementa un juego multijugador usando NestJS con WebSockets (Socket.IO) para comunicación en tiempo real. Los jugadores pueden crear salas, unirse usando códigos únicos, y competir en un juego de 10 rondas donde deben elegir la altura correcta para pasar por un hueco en la pared.

## Stack Tecnológico

- **Backend**: NestJS, Socket.IO, TypeScript
- **Frontend**: HTML5, CSS3, JavaScript, Socket.IO Client
- **Validación**: class-validator, class-transformer
- **Almacenamiento**: En memoria (Map/Object)

## Configuración del Proyecto

### Instalación

```bash
npm install
```

### Variables de Entorno

El proyecto utiliza variables de entorno para configurar el comportamiento del servidor y las reglas del juego. Para comenzar:

1. Copia el archivo `.env.example` y renómbralo a `.env`:

```bash
# En Windows (CMD)
copy .env.example .env

# En Windows (PowerShell) o Linux/Mac
cp .env.example .env
```

2. Edita el archivo `.env` según tus necesidades.

#### Variables Disponibles

##### Configuración del Servidor

| Variable | Descripción | Valor por Defecto | Notas |
|----------|-------------|-------------------|-------|
| `PORT` | Puerto del servidor | `3000` | Asegúrate de que el puerto esté disponible |
| `NODE_ENV` | Entorno de ejecución | `development` | Valores: `development`, `production`, `test` |

##### Configuración del Juego

| Variable | Descripción | Valor por Defecto | Rango Recomendado |
|----------|-------------|-------------------|-------------------|
| `SELECTION_DURATION` | Duración del período de selección (segundos) | `15` | 10-30 segundos |
| `REVEAL_DURATION` | Duración del período de revelación (segundos) | `5` | 3-10 segundos |
| `MAX_ROOMS` | Número máximo de salas simultáneas | `100` | Ajustar según capacidad del servidor |
| `MAX_PLAYERS_PER_ROOM` | Número máximo de jugadores por sala | `10` | 2-20 jugadores |
| `ROOM_TIMEOUT` | Tiempo de inactividad antes de eliminar sala (ms) | `1800000` | 1800000 = 30 minutos |

#### Ejemplos de Configuración

**Modo Rápido (partidas más cortas):**
```env
SELECTION_DURATION=10
REVEAL_DURATION=3
```

**Modo Competitivo (más tiempo para pensar):**
```env
SELECTION_DURATION=30
REVEAL_DURATION=8
```

**Servidor de Alta Capacidad:**
```env
MAX_ROOMS=500
MAX_PLAYERS_PER_ROOM=20
```

## Ejecutar el Proyecto

```bash
# Modo desarrollo
npm run start

# Modo desarrollo con watch
npm run start:dev

# Modo producción
npm run start:prod
```

El servidor estará disponible en `http://localhost:3000`

## Compilar el Proyecto

```bash
npm run build
```

## Ejecutar Tests

### Tests Automatizados

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura de tests
npm run test:cov
```

### Tests Manuales

El proyecto incluye documentación completa para pruebas manuales:

#### 🚀 Inicio Rápido
```bash
# 1. Verificar que todos los componentes están presentes
node verify-integration.js

# 2. Iniciar el servidor
npm run start:dev

# 3. Abrir navegador en http://localhost:3000
```

## Deployment (Despliegue)

### Preparación para Producción

1. **Compilar el proyecto:**
```bash
npm run build
```

2. **Configurar variables de entorno:**
   - Crea un archivo `.env` en el servidor con las variables apropiadas
   - Asegúrate de establecer `NODE_ENV=production`
   - Configura el `PORT` según tu infraestructura

3. **Ejecutar en producción:**
```bash
npm run start:prod
```

### Consideraciones de Deployment

#### Requisitos del Sistema
- Node.js 18.x o superior
- NPM 9.x o superior
- Memoria RAM: Mínimo 512MB (recomendado 1GB+)
- CPU: 1 core mínimo (recomendado 2+ cores para múltiples salas)

#### Variables de Entorno en Producción

```env
PORT=3000
NODE_ENV=production
SELECTION_DURATION=15
REVEAL_DURATION=5
MAX_ROOMS=100
MAX_PLAYERS_PER_ROOM=10
ROOM_TIMEOUT=1800000
```

#### Opciones de Hosting

**Opción 1: Servidor VPS (DigitalOcean, AWS EC2, etc.)**
```bash
# Instalar dependencias
npm ci --production

# Compilar
npm run build

# Usar PM2 para gestión de procesos
npm install -g pm2
pm2 start dist/main.js --name jump-wall-game

# Configurar PM2 para inicio automático
pm2 startup
pm2 save
```

**Opción 2: Plataformas PaaS (Heroku, Railway, Render)**
- Asegúrate de que el `Procfile` o comando de inicio esté configurado
- Configura las variables de entorno en el panel de la plataforma
- El puerto será asignado automáticamente por la plataforma

**Opción 3: Contenedores Docker**
```dockerfile
# Ejemplo de Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

#### Monitoreo y Logs

- Usa PM2 para monitoreo: `pm2 monit`
- Revisa logs: `pm2 logs jump-wall-game`
- Configura alertas para uso de memoria y CPU

#### Seguridad en Producción

- Configura CORS apropiadamente (no usar `origin: '*'` en producción)
- Implementa rate limiting para prevenir abuso
- Usa HTTPS con certificados SSL/TLS
- Mantén las dependencias actualizadas: `npm audit`

#### Escalabilidad

Para manejar más jugadores simultáneos:
- Aumenta `MAX_ROOMS` y `MAX_PLAYERS_PER_ROOM`
- Considera usar un balanceador de carga
- Implementa Redis para estado compartido entre instancias (futuro)
- Monitorea el uso de memoria y CPU

## Estructura del Proyecto

```
jump-wall-game/
├── src/
│   ├── config/          # Configuración del juego
│   ├── game/            # Módulo principal del juego
│   ├── app.module.ts    # Módulo raíz
│   └── main.ts          # Punto de entrada
├── public/              # Archivos estáticos del cliente
│   ├── index.html
│   ├── styles/
│   └── scripts/
└── test/                # Tests
```

## Características

- ✅ Salas de juego con códigos únicos
- ✅ Comunicación en tiempo real con WebSockets
- ✅ Sistema de puntuación (20, -5, -10 puntos)
- ✅ 10 rondas por partida
- ✅ Sincronización de temporizadores
- ✅ Manejo de desconexiones
- ✅ Reinicio de partidas

## Troubleshooting (Solución de Problemas)

### El servidor no inicia

**Problema:** Error "Puerto ya en uso"
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solución:**
- Cambia el puerto en el archivo `.env`: `PORT=3001`
- O detén el proceso que está usando el puerto 3000

### Los clientes no se conectan

**Problema:** Error de conexión WebSocket

**Solución:**
- Verifica que el servidor esté corriendo
- Revisa la configuración de CORS en `main.ts`
- Asegúrate de que el firewall permita conexiones en el puerto configurado

### Las salas se eliminan muy rápido

**Problema:** Las salas desaparecen antes de terminar el juego

**Solución:**
- Aumenta `ROOM_TIMEOUT` en el archivo `.env`
- Ejemplo: `ROOM_TIMEOUT=3600000` (60 minutos)

### Problemas de sincronización

**Problema:** Los temporizadores no están sincronizados entre jugadores

**Solución:**
- Verifica que todos los clientes tengan buena conexión a internet
- Revisa los logs del servidor para errores
- Considera reducir `SELECTION_DURATION` si hay mucha latencia

## Estado del Proyecto

✅ **Completado:**
- Configuración del proyecto NestJS
- Modelos de datos e interfaces
- Utilidades del sistema (generación de códigos, cálculo de puntuación)
- RoomService y GameService
- DTOs con validación
- GameGateway con manejo de eventos WebSocket
- Sincronización de temporizadores
- Manejo de desconexiones
- Interfaz de usuario completa (inicio, lobby, juego, resultados)
- Cliente WebSocket JavaScript
- Gestor de estado del cliente
- Validación de entrada en cliente
- Manejo de errores en cliente
- Configuración de variables de entorno

✅ **Pruebas:**
- Documentación completa de pruebas manuales
- Script de verificación de integración
- Guía de inicio rápido para pruebas
- Checklist de ejecución de pruebas

🔄 **Opcional:**
- Pruebas unitarias del backend
- Pruebas de integración automatizadas

## Contribuir

Si deseas contribuir al proyecto:
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

## Licencia

UNLICENSED
