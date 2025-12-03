/**
 * StateManager - Gestor de estado del cliente
 * Mantiene el estado local de la aplicación y notifica a la UI cuando cambia
 */
class StateManager {
  constructor() {
    // Estado de la pantalla actual
    this.screen = 'home'; // 'home' | 'lobby' | 'game' | 'results'
    
    // Información de la sala
    this.roomCode = null;
    this.roomState = null; // Estado de la sala del servidor
    
    // Información del jugador
    this.playerId = null;
    this.playerName = null;
    this.socketId = null;
    
    // Jugadores en la sala
    this.players = []; // Array de objetos Player
    this.playersMap = new Map(); // Map para acceso rápido por ID
    
    // Estado del juego
    this.currentRound = 0;
    this.maxRounds = 10;
    this.scores = new Map(); // Map<playerId, score>
    this.selectedHeight = null;
    this.timeRemaining = 0;
    this.selectionLocked = false;
    
    // Resultados de la última ronda
    this.lastWallHole = null;
    this.lastRoundResults = [];
    
    // Estado de reinicio
    this.restartConsents = 0;
    this.restartTotal = 0;
    
    // Puntuaciones finales
    this.finalScores = [];
    
    // Listeners para cambios de estado
    this.stateChangeListeners = [];
    
    // Timer para cuenta regresiva
    this.countdownInterval = null;
  }

  // ==================== Métodos de Actualización de Estado ====================

  /**
   * Actualiza el estado cuando se conecta al servidor
   * @param {string} socketId - ID del socket
   */
  handleConnected(socketId) {
    this.socketId = socketId;
    this._notifyStateChange('connected', { socketId });
  }

  /**
   * Actualiza el estado cuando se crea una sala
   * @param {string} roomCode - Código de la sala creada
   */
  handleRoomCreated(roomCode) {
    this.roomCode = roomCode;
    this.screen = 'lobby';
    this._notifyStateChange('room-created', { roomCode });
  }

  /**
   * Actualiza el estado cuando se une a una sala
   * @param {Object} roomData - Datos de la sala
   */
  handleRoomJoined(roomData) {
    this.roomCode = roomData.roomCode;
    this.roomState = roomData.state;
    this.currentRound = roomData.currentRound;
    this.maxRounds = roomData.maxRounds;
    this.screen = 'lobby';
    
    // Actualizar jugadores
    this._updatePlayers(roomData.players);
    
    this._notifyStateChange('room-joined', roomData);
  }

  /**
   * Actualiza el estado cuando hay un error de sala
   * @param {string} message - Mensaje de error
   */
  handleRoomError(message) {
    this._notifyStateChange('room-error', { message });
  }

  /**
   * Actualiza la lista de jugadores
   * @param {Array} players - Array de objetos Player
   */
  handlePlayerListUpdated(players) {
    this._updatePlayers(players);
    this._notifyStateChange('player-list-updated', { players: this.players });
  }

  /**
   * Actualiza el estado cuando el juego inicia
   */
  handleGameStarted() {
    this.screen = 'game';
    this.currentRound = 0;
    this.selectedHeight = null;
    this.selectionLocked = false;
    this._notifyStateChange('game-started', {});
  }

  /**
   * Actualiza el estado cuando inicia una ronda
   * @param {Object} data - { roundNumber, duration }
   */
  handleRoundStarted(data) {
    this.currentRound = data.roundNumber;
    this.timeRemaining = data.duration;
    this.selectedHeight = null;
    this.selectionLocked = false;
    this.lastWallHole = null;
    this.lastRoundResults = [];
    
    // Iniciar cuenta regresiva
    this._startCountdown();
    
    this._notifyStateChange('round-started', data);
  }

  /**
   * Actualiza el estado cuando se bloquea la selección
   */
  handleSelectionLocked() {
    this.selectionLocked = true;
    this._stopCountdown();
    this._notifyStateChange('selection-locked', {});
  }

  /**
   * Actualiza el estado cuando se revela la pared
   * @param {Object} data - { holePosition, results }
   */
  handleWallRevealed(data) {
    this.lastWallHole = data.holePosition;
    this.lastRoundResults = data.results;
    
    // Actualizar puntuaciones
    data.results.forEach(result => {
      this.scores.set(result.playerId, result.totalScore);
    });
    
    this._notifyStateChange('wall-revealed', data);
  }

  /**
   * Actualiza el estado cuando termina una ronda
   * @param {Array} scores - Array de PlayerScore
   */
  handleRoundEnded(scores) {
    // Actualizar puntuaciones
    scores.forEach(score => {
      this.scores.set(score.playerId, score.score);
    });
    
    this._notifyStateChange('round-ended', { scores });
  }

  /**
   * Actualiza el estado cuando termina el juego
   * @param {Array} finalScores - Array de PlayerScore con clasificación
   */
  handleGameEnded(finalScores) {
    this.finalScores = finalScores;
    this.screen = 'results';
    
    // Actualizar puntuaciones finales
    finalScores.forEach(score => {
      this.scores.set(score.playerId, score.score);
    });
    
    this._notifyStateChange('game-ended', { finalScores });
  }

  /**
   * Actualiza el estado de consentimientos para reinicio
   * @param {Object} data - { consents, total }
   */
  handleRestartStatus(data) {
    this.restartConsents = data.consents;
    this.restartTotal = data.total;
    this._notifyStateChange('restart-status', data);
  }

  /**
   * Maneja el reinicio del juego
   */
  handleGameRestarted() {
    this.resetForNewGame();
    this._notifyStateChange('game-restarted', {});
  }

  /**
   * Actualiza el estado cuando un jugador se desconecta
   * @param {string} playerId - ID del jugador desconectado
   */
  handlePlayerDisconnected(playerId) {
    const player = this.playersMap.get(playerId);
    if (player) {
      player.isConnected = false;
      this._notifyStateChange('player-disconnected', { playerId, player });
    }
  }

  /**
   * Actualiza el estado cuando un jugador sale de la sala
   * @param {Object} data - { playerId, playerName }
   */
  handlePlayerLeft(data) {
    // Eliminar jugador de la lista
    this.playersMap.delete(data.playerId);
    this.players = this.players.filter(p => p.id !== data.playerId);
    this._notifyStateChange('player-left', data);
  }

  /**
   * Actualiza el estado cuando se desconecta del servidor
   * @param {Object} data - { reason, isIntentional }
   */
  handleDisconnected(data) {
    this._stopCountdown();
    this._notifyStateChange('disconnected', data);
  }

  /**
   * Actualiza el estado cuando se pierde la conexión
   * @param {Object} data - { reason }
   */
  handleConnectionLost(data) {
    this._stopCountdown();
    this._notifyStateChange('connection-lost', data);
  }

  /**
   * Actualiza el estado cuando hay un error de conexión
   * @param {Object} data - { error }
   */
  handleConnectionError(data) {
    this._notifyStateChange('connection-error', data);
  }

  /**
   * Actualiza el estado cuando hay un timeout de conexión
   */
  handleConnectionTimeout() {
    this._notifyStateChange('connection-timeout', {});
  }

  /**
   * Actualiza el estado cuando se está reconectando
   * @param {Object} data - { attempt, maxAttempts }
   */
  handleReconnecting(data) {
    this._notifyStateChange('reconnecting', data);
  }

  /**
   * Actualiza el estado cuando se reconecta exitosamente
   * @param {Object} data - { attempts }
   */
  handleReconnected(data) {
    this._notifyStateChange('reconnected', data);
  }

  /**
   * Actualiza el estado cuando falla la reconexión
   */
  handleReconnectFailed() {
    this._notifyStateChange('reconnect-failed', {});
  }

  // ==================== Métodos de Actualización Local ====================

  /**
   * Establece el nombre del jugador local
   * @param {string} name - Nombre del jugador
   */
  setPlayerName(name) {
    this.playerName = name;
    
    // Actualizar en la lista de jugadores si ya existe
    const player = Array.from(this.playersMap.values()).find(
      p => p.socketId === this.socketId
    );
    if (player) {
      player.name = name;
      this.playerId = player.id;
    }
    
    this._notifyStateChange('player-name-set', { name });
  }

  /**
   * Establece la altura seleccionada localmente
   * @param {number} height - Altura seleccionada (1-10)
   */
  setSelectedHeight(height) {
    if (!this.selectionLocked && height >= 1 && height <= 10) {
      this.selectedHeight = height;
      this._notifyStateChange('height-selected', { height });
    }
  }

  /**
   * Reinicia el estado para un nuevo juego
   */
  resetForNewGame() {
    this.currentRound = 0;
    this.scores.clear();
    this.selectedHeight = null;
    this.selectionLocked = false;
    this.lastWallHole = null;
    this.lastRoundResults = [];
    this.finalScores = [];
    this.restartConsents = 0;
    this.restartTotal = 0;
    this.screen = 'lobby';
    
    this._notifyStateChange('game-reset', {});
  }

  /**
   * Limpia todo el estado (volver a inicio)
   */
  clearState() {
    this.screen = 'home';
    this.roomCode = null;
    this.roomState = null;
    this.playerId = null;
    this.playerName = null;
    this.socketId = null;
    this.players = [];
    this.playersMap.clear();
    this.currentRound = 0;
    this.maxRounds = 10;
    this.scores.clear();
    this.selectedHeight = null;
    this.timeRemaining = 0;
    this.selectionLocked = false;
    this.lastWallHole = null;
    this.lastRoundResults = [];
    this.restartConsents = 0;
    this.restartTotal = 0;
    this.finalScores = [];
    
    this._stopCountdown();
    this._notifyStateChange('state-cleared', {});
  }

  // ==================== Métodos Auxiliares Privados ====================

  /**
   * Actualiza la lista de jugadores y el mapa
   * @private
   */
  _updatePlayers(players) {
    this.players = players;
    this.playersMap.clear();
    
    players.forEach(player => {
      this.playersMap.set(player.id, player);
      
      // Si este jugador tiene nuestro socketId, guardar el playerId
      if (player.socketId === this.socketId) {
        this.playerId = player.id;
        if (player.name) {
          this.playerName = player.name;
        }
      }
      
      // Actualizar puntuaciones
      if (player.score !== undefined) {
        this.scores.set(player.id, player.score);
      }
    });
  }

  /**
   * Inicia la cuenta regresiva del temporizador
   * @private
   */
  _startCountdown() {
    this._stopCountdown();
    
    this.countdownInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this._notifyStateChange('timer-tick', { timeRemaining: this.timeRemaining });
      } else {
        this._stopCountdown();
      }
    }, 1000);
  }

  /**
   * Detiene la cuenta regresiva del temporizador
   * @private
   */
  _stopCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  /**
   * Notifica a todos los listeners sobre un cambio de estado
   * @private
   */
  _notifyStateChange(eventType, data) {
    this.stateChangeListeners.forEach(listener => {
      try {
        listener(eventType, data, this);
      } catch (error) {
        console.error('Error en listener de cambio de estado:', error);
      }
    });
  }

  // ==================== Métodos de Suscripción ====================

  /**
   * Registra un listener para cambios de estado
   * @param {Function} listener - Función que recibe (eventType, data, state)
   */
  onStateChange(listener) {
    if (typeof listener === 'function') {
      this.stateChangeListeners.push(listener);
    }
  }

  /**
   * Elimina un listener de cambios de estado
   * @param {Function} listener - Función a eliminar
   */
  offStateChange(listener) {
    const index = this.stateChangeListeners.indexOf(listener);
    if (index > -1) {
      this.stateChangeListeners.splice(index, 1);
    }
  }

  // ==================== Métodos de Consulta de Estado ====================

  /**
   * Obtiene el jugador actual (el jugador local)
   * @returns {Object|null}
   */
  getCurrentPlayer() {
    return this.playerId ? this.playersMap.get(this.playerId) : null;
  }

  /**
   * Obtiene un jugador por ID
   * @param {string} playerId - ID del jugador
   * @returns {Object|null}
   */
  getPlayer(playerId) {
    return this.playersMap.get(playerId);
  }

  /**
   * Obtiene la puntuación de un jugador
   * @param {string} playerId - ID del jugador
   * @returns {number}
   */
  getPlayerScore(playerId) {
    return this.scores.get(playerId) || 0;
  }

  /**
   * Verifica si todos los jugadores están listos
   * @returns {boolean}
   */
  areAllPlayersReady() {
    return this.players.length > 0 && 
           this.players.every(p => p.isReady);
  }

  /**
   * Verifica si el jugador actual es el anfitrión
   * @returns {boolean}
   */
  isCurrentPlayerHost() {
    const player = this.getCurrentPlayer();
    return player ? player.isHost : false;
  }

  /**
   * Obtiene el número de jugadores conectados
   * @returns {number}
   */
  getConnectedPlayersCount() {
    return this.players.filter(p => p.isConnected).length;
  }

  /**
   * Obtiene el estado actual completo (para debugging)
   * @returns {Object}
   */
  getState() {
    return {
      screen: this.screen,
      roomCode: this.roomCode,
      roomState: this.roomState,
      playerId: this.playerId,
      playerName: this.playerName,
      socketId: this.socketId,
      players: this.players,
      currentRound: this.currentRound,
      maxRounds: this.maxRounds,
      scores: Object.fromEntries(this.scores),
      selectedHeight: this.selectedHeight,
      timeRemaining: this.timeRemaining,
      selectionLocked: this.selectionLocked,
      lastWallHole: this.lastWallHole,
      lastRoundResults: this.lastRoundResults,
      restartConsents: this.restartConsents,
      restartTotal: this.restartTotal,
      finalScores: this.finalScores
    };
  }
}

console.log('StateManager class loaded');
