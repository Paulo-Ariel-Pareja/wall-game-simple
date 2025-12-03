# StateManager - Gestor de Estado del Cliente

## Descripción

El `StateManager` es una clase que mantiene el estado local de la aplicación del cliente y notifica a la UI cuando cambia. Actúa como una capa de abstracción entre los eventos del servidor (recibidos por `GameClient`) y la interfaz de usuario (manejada por `UIController`).

## Características Principales

- **Gestión centralizada del estado**: Mantiene toda la información del juego en un solo lugar
- **Notificaciones reactivas**: Notifica automáticamente a los listeners cuando el estado cambia
- **Sincronización con el servidor**: Actualiza el estado basándose en eventos del servidor
- **Temporizador integrado**: Maneja la cuenta regresiva del tiempo de selección
- **Métodos de consulta**: Proporciona métodos convenientes para consultar el estado

## Propiedades del Estado

### Información de Pantalla
- `screen`: Pantalla actual ('home' | 'lobby' | 'game' | 'results')

### Información de Sala
- `roomCode`: Código de la sala actual
- `roomState`: Estado de la sala del servidor

### Información del Jugador
- `playerId`: ID único del jugador
- `playerName`: Nombre del jugador
- `socketId`: ID del socket de conexión

### Jugadores
- `players`: Array de todos los jugadores en la sala
- `playersMap`: Map para acceso rápido a jugadores por ID

### Estado del Juego
- `currentRound`: Número de ronda actual (1-10)
- `maxRounds`: Total de rondas (por defecto 10)
- `scores`: Map de puntuaciones por jugador
- `selectedHeight`: Altura seleccionada por el jugador local
- `timeRemaining`: Tiempo restante en segundos
- `selectionLocked`: Si la selección está bloqueada

### Resultados
- `lastWallHole`: Posición del último hueco revelado
- `lastRoundResults`: Resultados de la última ronda
- `finalScores`: Puntuaciones finales del juego

### Reinicio
- `restartConsents`: Número de jugadores que consintieron reiniciar
- `restartTotal`: Total de jugadores en la sala

## Uso Básico

### Inicialización

```javascript
const stateManager = new StateManager();
```

### Conectar con GameClient

```javascript
const gameClient = new GameClient();
const stateManager = new StateManager();

// Conectar eventos del servidor al StateManager
gameClient.on('connected', (data) => {
  stateManager.handleConnected(data.socketId);
});

gameClient.on('room-created', (roomCode) => {
  stateManager.handleRoomCreated(roomCode);
});

gameClient.on('player-list-updated', (players) => {
  stateManager.handlePlayerListUpdated(players);
});

// ... más eventos
```

### Escuchar Cambios de Estado

```javascript
stateManager.onStateChange((eventType, data, state) => {
  console.log('Estado cambió:', eventType);
  
  // Actualizar UI según el tipo de evento
  switch(eventType) {
    case 'room-created':
      // Mostrar código de sala
      break;
    case 'round-started':
      // Iniciar temporizador visual
      break;
    case 'wall-revealed':
      // Mostrar pared y resultados
      break;
  }
});
```

### Consultar Estado

```javascript
// Obtener jugador actual
const currentPlayer = stateManager.getCurrentPlayer();

// Obtener puntuación de un jugador
const score = stateManager.getPlayerScore('player-id');

// Verificar si todos están listos
const allReady = stateManager.areAllPlayersReady();

// Obtener estado completo
const fullState = stateManager.getState();
```

## Métodos de Actualización de Estado

### Eventos del Servidor
- `handleConnected(socketId)`: Cuando se conecta al servidor
- `handleRoomCreated(roomCode)`: Cuando se crea una sala
- `handleRoomJoined(roomData)`: Cuando se une a una sala
- `handleRoomError(message)`: Cuando hay un error de sala
- `handlePlayerListUpdated(players)`: Cuando se actualiza la lista de jugadores
- `handleGameStarted()`: Cuando inicia el juego
- `handleRoundStarted(data)`: Cuando inicia una ronda
- `handleSelectionLocked()`: Cuando se bloquea la selección
- `handleWallRevealed(data)`: Cuando se revela la pared
- `handleRoundEnded(scores)`: Cuando termina una ronda
- `handleGameEnded(finalScores)`: Cuando termina el juego
- `handleRestartStatus(data)`: Actualización de consentimientos de reinicio
- `handlePlayerDisconnected(playerId)`: Cuando un jugador se desconecta
- `handleDisconnected(data)`: Cuando se desconecta del servidor

### Actualizaciones Locales
- `setPlayerName(name)`: Establece el nombre del jugador local
- `setSelectedHeight(height)`: Establece la altura seleccionada
- `resetForNewGame()`: Reinicia el estado para un nuevo juego
- `clearState()`: Limpia todo el estado (volver a inicio)

## Métodos de Consulta

- `getCurrentPlayer()`: Obtiene el jugador actual
- `getPlayer(playerId)`: Obtiene un jugador por ID
- `getPlayerScore(playerId)`: Obtiene la puntuación de un jugador
- `areAllPlayersReady()`: Verifica si todos los jugadores están listos
- `isCurrentPlayerHost()`: Verifica si el jugador actual es el anfitrión
- `getConnectedPlayersCount()`: Obtiene el número de jugadores conectados
- `getState()`: Obtiene el estado completo

## Eventos de Cambio de Estado

Cuando el estado cambia, se notifica a los listeners con:
- `eventType`: Tipo de evento que causó el cambio
- `data`: Datos asociados al evento
- `state`: Referencia al StateManager completo

### Tipos de Eventos

- `connected`: Conectado al servidor
- `room-created`: Sala creada
- `room-joined`: Unido a sala
- `room-error`: Error de sala
- `player-list-updated`: Lista de jugadores actualizada
- `game-started`: Juego iniciado
- `round-started`: Ronda iniciada
- `selection-locked`: Selección bloqueada
- `wall-revealed`: Pared revelada
- `round-ended`: Ronda terminada
- `game-ended`: Juego terminado
- `restart-status`: Estado de reinicio actualizado
- `player-disconnected`: Jugador desconectado
- `disconnected`: Desconectado del servidor
- `player-name-set`: Nombre de jugador establecido
- `height-selected`: Altura seleccionada
- `game-reset`: Juego reiniciado
- `state-cleared`: Estado limpiado
- `timer-tick`: Tick del temporizador (cada segundo)

## Ejemplo Completo

Ver los archivos de ejemplo:
- `/test-state-manager.html`: Tests unitarios del StateManager
- `/integration-example.html`: Ejemplo de integración con GameClient

## Requisitos Cumplidos

Este StateManager cumple con los siguientes requisitos del documento de especificación:
- **1.4**: Mantiene lista de jugadores conectados en tiempo real
- **2.5**: Mantiene estado de preparación de jugadores
- **5.5**: Mantiene puntuaciones actualizadas
- **6.5**: Mantiene número de ronda actual
- **7.2**: Mantiene clasificación final y puntuaciones

## Próximos Pasos

El siguiente paso es implementar el `UIController` (tarea 16) que utilizará este StateManager para actualizar la interfaz de usuario en respuesta a los cambios de estado.
