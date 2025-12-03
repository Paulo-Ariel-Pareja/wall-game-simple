/**
 * GameClient - Cliente WebSocket para el juego de salto y pared
 * Encapsula la comunicación con el servidor mediante Socket.IO
 */
class GameClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventHandlers = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // 1 segundo inicial
  }

  /**
   * Establece conexión con el servidor WebSocket
   * @param {string} url - URL del servidor (opcional, por defecto usa la URL actual)
   */
  connect(url = '') {
    if (this.socket && this.isConnected) {
      console.log('Ya existe una conexión activa');
      return;
    }

    // Conectar al namespace /game
    const socketUrl = url || window.location.origin;
    const fullUrl = socketUrl + '/game';

    // Configuración de Socket.IO con reconexión automática
    this.socket = io(fullUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true
    });

    // Configurar listeners de conexión
    this._setupConnectionListeners();
    
    // Configurar listeners de eventos del servidor
    this._setupServerEventListeners();

    console.log('Iniciando conexión con el servidor...');
  }

  /**
   * Desconecta del servidor
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      console.log('Desconectado del servidor');
    }
  }

  /**
   * Configura los listeners de estado de conexión
   * @private
   */
  _setupConnectionListeners() {
    // Conexión establecida
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('Conectado al servidor. Socket ID:', this.socket.id);
      this._triggerEvent('connected', { socketId: this.socket.id });
    });

    // Desconexión
    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('Desconectado del servidor. Razón:', reason);
      
      // Determinar si es una desconexión intencional o error
      const isIntentional = reason === 'io client disconnect';
      this._triggerEvent('disconnected', { reason, isIntentional });
      
      // Si no es intencional, intentar reconectar
      if (!isIntentional) {
        this._triggerEvent('connection-lost', { reason });
      }
    });

    // Error de conexión
    this.socket.on('connect_error', (error) => {
      console.error('Error de conexión:', error.message);
      this._triggerEvent('connection-error', { error: error.message });
    });

    // Timeout de conexión
    this.socket.on('connect_timeout', () => {
      console.error('Timeout de conexión');
      this._triggerEvent('connection-timeout', {});
    });

    // Intento de reconexión
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.reconnectAttempts = attemptNumber;
      console.log(`Intento de reconexión #${attemptNumber}`);
      this._triggerEvent('reconnecting', { attempt: attemptNumber, maxAttempts: this.maxReconnectAttempts });
    });

    // Reconexión exitosa
    this.socket.on('reconnect', (attemptNumber) => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log(`Reconectado después de ${attemptNumber} intentos`);
      this._triggerEvent('reconnected', { attempts: attemptNumber });
    });

    // Fallo en reconexión
    this.socket.on('reconnect_failed', () => {
      console.error('Fallo en la reconexión después de múltiples intentos');
      this._triggerEvent('reconnect-failed', {});
    });

    // Error general
    this.socket.on('error', (error) => {
      console.error('Error del socket:', error);
      this._triggerEvent('socket-error', { error: error.message || error });
    });
  }

  /**
   * Configura los listeners para eventos del servidor
   * @private
   */
  _setupServerEventListeners() {
    // Sala creada
    this.socket.on('room-created', (data) => {
      console.log('Sala creada:', data);
      // El servidor envía { roomCode, playerId }
      this._triggerEvent('room-created', data.roomCode || data);
    });

    // Unido a sala
    this.socket.on('room-joined', (data) => {
      console.log('Unido a sala:', data);
      this._triggerEvent('room-joined', data);
    });

    // Estado de la sala (enviado después de crear/unirse)
    this.socket.on('room-state', (roomData) => {
      console.log('Estado de sala recibido:', roomData);
      this._triggerEvent('room-joined', roomData);
    });

    // Error de sala
    this.socket.on('room-error', (data) => {
      const message = typeof data === 'string' ? data : data.message;
      console.error('Error de sala:', message);
      this._triggerEvent('room-error', message);
    });

    // Lista de jugadores actualizada
    this.socket.on('player-list-updated', (data) => {
      const players = data.players || data;
      console.log('Lista de jugadores actualizada:', players);
      this._triggerEvent('player-list-updated', players);
    });

    // Juego iniciado
    this.socket.on('game-started', () => {
      console.log('Juego iniciado');
      this._triggerEvent('game-started', {});
    });

    // Ronda iniciada
    this.socket.on('round-started', (data) => {
      console.log(`Ronda ${data.roundNumber} iniciada. Duración: ${data.duration}s`);
      this._triggerEvent('round-started', data);
    });

    // Selección bloqueada
    this.socket.on('selection-locked', () => {
      console.log('Selección bloqueada');
      this._triggerEvent('selection-locked', {});
    });

    // Pared revelada
    this.socket.on('wall-revealed', (data) => {
      console.log('Pared revelada. Hueco en:', data.holePosition);
      this._triggerEvent('wall-revealed', data);
    });

    // Ronda terminada
    this.socket.on('round-ended', (data) => {
      const scores = data.scores || data;
      console.log('Ronda terminada. Puntuaciones:', scores);
      this._triggerEvent('round-ended', scores);
    });

    // Juego terminado
    this.socket.on('game-ended', (data) => {
      const finalScores = data.finalScores || data;
      console.log('Juego terminado. Puntuaciones finales:', finalScores);
      this._triggerEvent('game-ended', finalScores);
    });

    // Estado de reinicio
    this.socket.on('restart-status', (data) => {
      console.log(`Estado de reinicio: ${data.consents}/${data.total} jugadores`);
      this._triggerEvent('restart-status', data);
    });

    // Juego reiniciado
    this.socket.on('game-restarted', () => {
      console.log('Juego reiniciado, volviendo al lobby');
      this._triggerEvent('game-restarted', {});
    });

    // Jugador desconectado (durante el juego)
    this.socket.on('player-disconnected', (data) => {
      const playerId = data.playerId || data;
      console.log('Jugador desconectado:', playerId);
      this._triggerEvent('player-disconnected', playerId);
    });

    // Jugador salió de la sala (en lobby)
    this.socket.on('player-left', (data) => {
      console.log('Jugador salió de la sala:', data.playerName);
      this._triggerEvent('player-left', data);
    });
  }

  /**
   * Dispara un evento personalizado a los handlers registrados
   * @private
   */
  _triggerEvent(eventName, data) {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error en handler de evento '${eventName}':`, error);
        }
      });
    }
  }

  /**
   * Registra un handler para un evento específico
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar cuando ocurra el evento
   */
  on(event, callback) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(callback);
  }

  /**
   * Elimina un handler de un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función a eliminar
   */
  off(event, callback) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(callback);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emite un evento al servidor con manejo de errores
   * @private
   */
  _emit(event, data = {}) {
    if (!this.socket || !this.isConnected) {
      console.error(`No se puede emitir '${event}': no hay conexión`);
      this._triggerEvent('emit-error', { event, error: 'No hay conexión' });
      return false;
    }

    try {
      this.socket.emit(event, data);
      return true;
    } catch (error) {
      console.error(`Error al emitir '${event}':`, error);
      this._triggerEvent('emit-error', { event, error: error.message });
      return false;
    }
  }

  // ==================== Métodos de Emisión de Eventos ====================

  /**
   * Solicita crear una nueva sala
   */
  createRoom() {
    console.log('Solicitando crear sala...');
    return this._emit('create-room');
  }

  /**
   * Solicita unirse a una sala existente
   * @param {string} roomCode - Código de la sala (6 caracteres)
   */
  joinRoom(roomCode) {
    // Validar código de sala
    const validation = Validators.validateRoomCode(roomCode);
    if (!validation.isValid) {
      console.error('Código de sala inválido:', validation.error);
      this._triggerEvent('room-error', validation.error);
      return false;
    }

    const sanitizedCode = Validators.sanitizeRoomCode(roomCode);
    console.log('Solicitando unirse a sala:', sanitizedCode);
    return this._emit('join-room', { roomCode: sanitizedCode });
  }

  /**
   * Establece el nombre del jugador
   * @param {string} name - Nombre del jugador (2-20 caracteres)
   */
  setPlayerName(name) {
    // Validar nombre
    const validation = Validators.validatePlayerName(name);
    if (!validation.isValid) {
      console.error('Nombre inválido:', validation.error);
      this._triggerEvent('room-error', validation.error);
      return false;
    }

    const sanitizedName = Validators.sanitizePlayerName(name);
    console.log('Estableciendo nombre de jugador:', sanitizedName);
    return this._emit('set-player-name', { name: sanitizedName });
  }

  /**
   * Marca al jugador como listo para comenzar
   */
  markReady() {
    console.log('Marcando jugador como listo...');
    return this._emit('player-ready');
  }

  /**
   * Selecciona una altura de salto
   * @param {number} height - Altura seleccionada (1-10)
   */
  selectHeight(height) {
    // Validar altura
    const validation = Validators.validateHeight(height);
    if (!validation.isValid) {
      console.error('Altura inválida:', validation.error);
      this._triggerEvent('room-error', validation.error);
      return false;
    }

    console.log('Seleccionando altura:', height);
    return this._emit('select-height', { height });
  }

  /**
   * Da consentimiento para reiniciar el juego
   */
  giveRestartConsent() {
    console.log('Dando consentimiento para reiniciar...');
    return this._emit('restart-consent');
  }

  // ==================== Métodos de Utilidad ====================

  /**
   * Verifica si está conectado al servidor
   * @returns {boolean}
   */
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  /**
   * Obtiene el ID del socket actual
   * @returns {string|null}
   */
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  /**
   * Obtiene el número de intentos de reconexión
   * @returns {number}
   */
  getReconnectAttempts() {
    return this.reconnectAttempts;
  }
}

console.log('GameClient class loaded');
