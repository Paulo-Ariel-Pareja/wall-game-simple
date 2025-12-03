/**
 * UIController - Controlador de interfaz de usuario
 * Conecta el StateManager con los elementos DOM y gestiona las interacciones del usuario
 */
class UIController {
  constructor(gameClient, stateManager) {
    this.client = gameClient;
    this.state = stateManager;
    
    // Referencias a elementos DOM - Pantallas
    this.screens = {
      home: document.getElementById('home-screen'),
      lobby: document.getElementById('lobby-screen'),
      game: document.getElementById('game-screen'),
      results: document.getElementById('results-screen')
    };
    
    // Referencias a elementos DOM - Home
    this.homeElements = {
      createRoomBtn: document.getElementById('create-room-btn'),
      roomCodeInput: document.getElementById('room-code-input'),
      joinRoomBtn: document.getElementById('join-room-btn'),
      errorMessage: document.getElementById('home-error')
    };
    
    // Elementos de notificación global
    this.notificationContainer = this._createNotificationContainer();
    
    // Referencias a elementos DOM - Lobby
    this.lobbyElements = {
      roomCodeDisplay: document.getElementById('room-code-display'),
      copyCodeBtn: document.getElementById('copy-code-btn'),
      copyFeedback: document.getElementById('copy-feedback'),
      playerNameInput: document.getElementById('player-name-input'),
      nameError: document.getElementById('name-error'),
      playersList: document.getElementById('players-list'),
      playerCount: document.getElementById('player-count'),
      readyBtn: document.getElementById('ready-btn'),
      readyInfo: document.getElementById('ready-info')
    };
    
    // Referencias a elementos DOM - Game
    this.gameElements = {
      playerNameDisplay: document.getElementById('player-name-display'),
      roundDisplay: document.getElementById('round-display'),
      timerDisplay: document.getElementById('timer-display'),
      wallDisplay: document.getElementById('wall-display'),
      playersPositions: document.getElementById('players-positions'),
      heightButtons: document.querySelectorAll('.height-btn'),
      selectionFeedback: document.getElementById('selection-feedback'),
      scoresTable: document.getElementById('scores-table')
    };
    
    // Referencias a elementos DOM - Results
    this.resultsElements = {
      leaderboardList: document.getElementById('leaderboard-list'),
      restartBtn: document.getElementById('restart-btn'),
      restartCount: document.getElementById('restart-count'),
      restartTotal: document.getElementById('restart-total'),
      restartProgressBar: document.getElementById('restart-progress-bar')
    };
    
    // Estado interno del controlador
    this.currentScreen = 'home';
    this.previousScores = new Map();
    this.isReconnecting = false;
    this.reconnectNotificationId = null;
    
    // Inicializar
    this._setupEventListeners();
    this._setupStateListeners();
  }

  // ==================== Creación de Elementos ====================

  /**
   * Crea el contenedor de notificaciones
   * @private
   */
  _createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
  }

  // ==================== Configuración ====================

  /**
   * Configura los event listeners de los elementos DOM
   * @private
   */
  _setupEventListeners() {
    // Home screen
    this.homeElements.createRoomBtn.addEventListener('click', () => this._handleCreateRoom());
    this.homeElements.joinRoomBtn.addEventListener('click', () => this._handleJoinRoom());
    this.homeElements.roomCodeInput.addEventListener('input', (e) => this._handleRoomCodeInput(e));
    this.homeElements.roomCodeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this._handleJoinRoom();
    });
    
    // Lobby screen
    this.lobbyElements.copyCodeBtn.addEventListener('click', () => this._handleCopyCode());
    this.lobbyElements.playerNameInput.addEventListener('input', (e) => this._handleNameInput(e));
    this.lobbyElements.playerNameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.lobbyElements.readyBtn.disabled) {
        this._handlePlayerReady();
      }
    });
    this.lobbyElements.readyBtn.addEventListener('click', () => this._handlePlayerReady());
    
    // Game screen
    this.gameElements.heightButtons.forEach(btn => {
      btn.addEventListener('click', () => this._handleHeightSelection(btn));
    });
    
    // Results screen
    this.resultsElements.restartBtn.addEventListener('click', () => this._handleRestart());
  }

  /**
   * Configura los listeners del StateManager
   * @private
   */
  _setupStateListeners() {
    this.state.onStateChange((eventType, data, state) => {
      this._handleStateChange(eventType, data, state);
    });
  }

  // ==================== Manejo de Cambios de Estado ====================

  /**
   * Maneja todos los cambios de estado del StateManager
   * @private
   */
  _handleStateChange(eventType, data, state) {
    switch (eventType) {
      case 'connected':
        console.log('UI: Conectado al servidor');
        this._showNotification('Conectado al servidor', 'success', 2000);
        break;
        
      case 'room-created':
        this._showScreen('lobby');
        this._updateRoomCode(data.roomCode);
        this._hideError();
        break;
        
      case 'room-joined':
        this._showScreen('lobby');
        this._updateRoomCode(state.roomCode);
        this._hideError();
        break;
        
      case 'room-error':
        this._handleRoomError(data.message);
        break;
        
      case 'player-list-updated':
        this._renderPlayersList(data.players);
        this._updateReadyButton();
        break;
        
      case 'player-name-set':
        this._updateReadyButton();
        break;
        
      case 'game-started':
        this._showScreen('game');
        this._updatePlayerNameDisplay();
        this._resetGameUI();
        break;
        
      case 'round-started':
        this._updateRoundDisplay(data.roundNumber, state.maxRounds);
        this._updateTimer(data.duration);
        this._enableHeightSelection();
        this._clearWallVisualization();
        this.gameElements.selectionFeedback.textContent = '';
        break;
        
      case 'timer-tick':
        this._updateTimer(data.timeRemaining);
        break;
        
      case 'height-selected':
        this._updateHeightButtons(data.height);
        this.gameElements.selectionFeedback.textContent = `Has seleccionado altura ${data.height}`;
        break;
        
      case 'selection-locked':
        this._disableHeightSelection();
        this.gameElements.selectionFeedback.textContent = '¡Tiempo agotado! Esperando resultados...';
        break;
        
      case 'wall-revealed':
        this._showWallHole(data.holePosition);
        this._showPlayerPositions(data.results);
        this._updateScoresTable(state.scores);
        break;
        
      case 'round-ended':
        this._updateScoresTable(state.scores);
        break;
        
      case 'game-ended':
        this._showScreen('results');
        this._renderLeaderboard(data.finalScores);
        break;
        
      case 'restart-status':
        this._updateRestartStatus(data.consents, data.total);
        break;
        
      case 'game-restarted':
        this._showScreen('lobby');
        this._showNotification('¡Juego reiniciado! Todos vuelven al lobby', 'success', 3000);
        break;
        
      case 'player-left':
        this._renderPlayersList(state.players);
        this._showNotification(`${data.playerName || 'Un jugador'} ha salido de la sala`, 'info', 3000);
        break;
        
      case 'player-disconnected':
        this._renderPlayersList(state.players);
        this._showNotification('Un jugador se ha desconectado', 'warning', 3000);
        break;
        
      case 'connection-lost':
        this._handleConnectionLost(data);
        break;
        
      case 'connection-error':
        this._handleConnectionError(data);
        break;
        
      case 'connection-timeout':
        this._handleConnectionTimeout();
        break;
        
      case 'reconnecting':
        this._handleReconnecting(data);
        break;
        
      case 'reconnected':
        this._handleReconnected(data);
        break;
        
      case 'reconnect-failed':
        this._handleReconnectFailed();
        break;
        
      case 'disconnected':
        if (!data.isIntentional) {
          this._handleConnectionLost(data);
        }
        break;
    }
  }

  // ==================== Gestión de Pantallas ====================

  /**
   * Cambia entre pantallas con animación
   * @param {string} screenName - Nombre de la pantalla ('home', 'lobby', 'game', 'results')
   */
  _showScreen(screenName) {
    if (this.currentScreen === screenName) return;
    
    // Ocultar pantalla actual
    if (this.screens[this.currentScreen]) {
      this.screens[this.currentScreen].classList.remove('active');
    }
    
    // Mostrar nueva pantalla
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add('active');
      this.currentScreen = screenName;
    }
  }

  // ==================== Handlers de Eventos de Usuario ====================

  /**
   * Maneja la entrada del código de sala en tiempo real
   * @private
   */
  _handleRoomCodeInput(event) {
    let value = event.target.value.toUpperCase();
    
    // Filtrar solo caracteres alfanuméricos
    value = value.replace(/[^A-Z0-9]/g, '');
    
    // Limitar a 6 caracteres
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    
    event.target.value = value;
    
    // Validar y mostrar/ocultar error
    if (value.length > 0 && value.length < 6) {
      this._showError('El código debe tener 6 caracteres');
    } else {
      this._hideError();
    }
    
    // Habilitar/deshabilitar botón de unirse
    this.homeElements.joinRoomBtn.disabled = value.length !== 6;
  }

  /**
   * Maneja la creación de una sala
   * @private
   */
  _handleCreateRoom() {
    // Deshabilitar botón durante procesamiento
    this.homeElements.createRoomBtn.disabled = true;
    this.homeElements.createRoomBtn.textContent = 'Creando...';
    this._hideError();
    
    this.client.createRoom();
    
    // Re-habilitar después de un tiempo
    setTimeout(() => {
      this.homeElements.createRoomBtn.disabled = false;
      this.homeElements.createRoomBtn.innerHTML = '<span class="btn-icon">➕</span> Crear Sala';
    }, 2000);
  }

  /**
   * Maneja la unión a una sala
   * @private
   */
  _handleJoinRoom() {
    const roomCode = Validators.sanitizeRoomCode(this.homeElements.roomCodeInput.value);
    
    // Validar código de sala
    const validation = Validators.validateRoomCode(roomCode);
    if (!validation.isValid) {
      this._showError(validation.error);
      this.homeElements.roomCodeInput.focus();
      return;
    }
    
    // Deshabilitar botón y input durante procesamiento
    this.homeElements.joinRoomBtn.disabled = true;
    this.homeElements.roomCodeInput.disabled = true;
    this.homeElements.joinRoomBtn.textContent = 'Uniéndose...';
    this._hideError();
    
    this.client.joinRoom(roomCode);
    
    // Re-habilitar después de un tiempo
    setTimeout(() => {
      this.homeElements.joinRoomBtn.disabled = false;
      this.homeElements.roomCodeInput.disabled = false;
      this.homeElements.joinRoomBtn.innerHTML = '<span class="btn-icon">🚪</span> Unirse a Sala';
    }, 2000);
  }

  /**
   * Maneja la copia del código de sala
   * @private
   */
  _handleCopyCode() {
    const roomCode = this.state.roomCode;
    if (!roomCode) return;
    
    navigator.clipboard.writeText(roomCode).then(() => {
      this.lobbyElements.copyFeedback.classList.add('show');
      setTimeout(() => {
        this.lobbyElements.copyFeedback.classList.remove('show');
      }, 2000);
    }).catch(err => {
      console.error('Error al copiar código:', err);
    });
  }

  /**
   * Maneja la entrada del nombre del jugador
   * @private
   */
  _handleNameInput(event) {
    const name = Validators.sanitizePlayerName(event.target.value);
    
    // Validar nombre en tiempo real
    const validation = Validators.validatePlayerName(name);
    
    if (validation.isValid) {
      this.lobbyElements.nameError.classList.remove('show');
      this.state.setPlayerName(name);
    } else if (name.length > 0) {
      // Solo mostrar error si el usuario ha empezado a escribir
      this.lobbyElements.nameError.textContent = validation.error;
      this.lobbyElements.nameError.classList.add('show');
    } else {
      // Ocultar error si el campo está vacío
      this.lobbyElements.nameError.classList.remove('show');
    }
    
    this._updateReadyButton();
  }

  /**
   * Maneja cuando el jugador marca que está listo
   * @private
   */
  _handlePlayerReady() {
    const name = Validators.sanitizePlayerName(this.lobbyElements.playerNameInput.value);
    
    // Validar nombre antes de enviar
    const validation = Validators.validatePlayerName(name);
    if (!validation.isValid) {
      this.lobbyElements.nameError.textContent = validation.error;
      this.lobbyElements.nameError.classList.add('show');
      this.lobbyElements.playerNameInput.focus();
      return;
    }
    
    // Deshabilitar controles durante procesamiento
    this.lobbyElements.readyBtn.disabled = true;
    this.lobbyElements.playerNameInput.disabled = true;
    this.lobbyElements.readyBtn.textContent = 'Enviando...';
    this.lobbyElements.nameError.classList.remove('show');
    
    // Enviar nombre al servidor
    this.client.setPlayerName(name);
    
    // Marcar como listo
    setTimeout(() => {
      this.client.markReady();
      this.lobbyElements.readyBtn.innerHTML = '<span class="btn-icon">✓</span> Estás Listo';
    }, 100);
  }

  /**
   * Maneja la selección de altura
   * @private
   */
  _handleHeightSelection(button) {
    if (this.state.selectionLocked) {
      this.gameElements.selectionFeedback.textContent = 'El tiempo de selección ha terminado';
      return;
    }
    
    const height = parseInt(button.dataset.height);
    
    // Validar altura
    const validation = Validators.validateHeight(height);
    if (!validation.isValid) {
      this.gameElements.selectionFeedback.textContent = validation.error;
      console.error('Altura inválida:', validation.error);
      return;
    }
    
    // Deshabilitar botones temporalmente durante procesamiento
    this._disableHeightSelection();
    
    this.state.setSelectedHeight(height);
    this.client.selectHeight(height);
    
    // Re-habilitar botones después de un breve momento
    setTimeout(() => {
      if (!this.state.selectionLocked) {
        this._enableHeightSelection();
        this._updateHeightButtons(height);
      }
    }, 200);
  }

  /**
   * Maneja el reinicio del juego
   * @private
   */
  _handleRestart() {
    // Deshabilitar botón durante procesamiento
    this.resultsElements.restartBtn.disabled = true;
    this.resultsElements.restartBtn.textContent = '✓ Esperando otros jugadores...';
    
    this.client.giveRestartConsent();
  }

  // ==================== Renderizado de UI - Lobby ====================

  /**
   * Actualiza el código de sala mostrado
   * @private
   */
  _updateRoomCode(roomCode) {
    this.lobbyElements.roomCodeDisplay.textContent = roomCode;
  }

  /**
   * Renderiza la lista de jugadores
   * @private
   */
  _renderPlayersList(players) {
    this.lobbyElements.playersList.innerHTML = '';
    this.lobbyElements.playerCount.textContent = `(${players.length})`;
    
    players.forEach(player => {
      const playerItem = this._createPlayerItem(player);
      this.lobbyElements.playersList.appendChild(playerItem);
    });
    
    this._updateReadyInfo(players);
  }

  /**
   * Crea un elemento de jugador para la lista
   * @private
   */
  _createPlayerItem(player) {
    const div = document.createElement('div');
    div.className = 'player-item';
    if (player.isReady) div.classList.add('ready');
    
    const initial = player.name ? player.name.charAt(0).toUpperCase() : '?';
    const isCurrentPlayer = player.id === this.state.playerId;
    
    div.innerHTML = `
      <div class="player-info">
        <div class="player-avatar">${initial}</div>
        <div class="player-details">
          <div class="player-name">${player.name || 'Sin nombre'}</div>
          <div class="player-badges">
            ${player.isHost ? '<span class="badge badge-host">Anfitrión</span>' : ''}
            ${isCurrentPlayer ? '<span class="badge badge-you">Tú</span>' : ''}
          </div>
        </div>
      </div>
      <div class="player-status">
        <div class="status-indicator ${player.isReady ? 'ready' : ''}"></div>
        <span class="status-text ${player.isReady ? 'ready' : ''}">
          ${player.isReady ? 'Listo' : 'Esperando'}
        </span>
      </div>
    `;
    
    return div;
  }

  /**
   * Actualiza el botón de listo
   * @private
   */
  _updateReadyButton() {
    const name = Validators.sanitizePlayerName(this.lobbyElements.playerNameInput.value);
    const currentPlayer = this.state.getCurrentPlayer();
    
    if (currentPlayer && currentPlayer.isReady) {
      this.lobbyElements.readyBtn.disabled = true;
      this.lobbyElements.readyBtn.innerHTML = '<span class="btn-icon">✓</span> Estás Listo';
    } else {
      const validation = Validators.validatePlayerName(name);
      this.lobbyElements.readyBtn.disabled = !validation.isValid;
    }
  }

  /**
   * Actualiza la información de jugadores listos
   * @private
   */
  _updateReadyInfo(players) {
    const readyCount = players.filter(p => p.isReady).length;
    const totalCount = players.length;
    
    if (readyCount === totalCount && totalCount > 0) {
      this.lobbyElements.readyInfo.textContent = '¡Todos listos! El juego comenzará pronto...';
      this.lobbyElements.readyInfo.classList.add('all-ready');
    } else {
      this.lobbyElements.readyInfo.textContent = `${readyCount} de ${totalCount} jugadores listos`;
      this.lobbyElements.readyInfo.classList.remove('all-ready');
    }
  }

  // ==================== Renderizado de UI - Game ====================

  /**
   * Actualiza el display del nombre del jugador
   * @private
   */
  _updatePlayerNameDisplay() {
    const currentPlayer = this.state.getCurrentPlayer();
    if (currentPlayer && currentPlayer.name) {
      this.gameElements.playerNameDisplay.textContent = currentPlayer.name;
      this.gameElements.playerNameDisplay.style.display = 'block';
    } else {
      this.gameElements.playerNameDisplay.style.display = 'none';
    }
  }

  /**
   * Reinicia la UI del juego
   * @private
   */
  _resetGameUI() {
    this.previousScores.clear();
    this._clearWallVisualization();
    this.gameElements.selectionFeedback.textContent = '';
    this.gameElements.scoresTable.innerHTML = '';
  }

  /**
   * Actualiza el display de la ronda
   * @private
   */
  _updateRoundDisplay(roundNumber, maxRounds) {
    this.gameElements.roundDisplay.textContent = `${roundNumber}/${maxRounds}`;
  }

  /**
   * Actualiza el temporizador
   * @private
   */
  _updateTimer(seconds) {
    this.gameElements.timerDisplay.textContent = seconds;
    
    // Añadir clase de advertencia si quedan 5 segundos o menos
    if (seconds <= 5) {
      this.gameElements.timerDisplay.classList.add('warning');
    } else {
      this.gameElements.timerDisplay.classList.remove('warning');
    }
  }

  /**
   * Habilita la selección de altura
   * @private
   */
  _enableHeightSelection() {
    this.gameElements.heightButtons.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('selected');
    });
  }

  /**
   * Deshabilita la selección de altura
   * @private
   */
  _disableHeightSelection() {
    this.gameElements.heightButtons.forEach(btn => {
      btn.disabled = true;
    });
  }

  /**
   * Actualiza los botones de altura según la selección
   * @private
   */
  _updateHeightButtons(selectedHeight) {
    this.gameElements.heightButtons.forEach(btn => {
      const height = parseInt(btn.dataset.height);
      if (height === selectedHeight) {
        btn.classList.add('selected');
      } else {
        btn.classList.remove('selected');
      }
    });
  }

  /**
   * Limpia la visualización de la pared
   * @private
   */
  _clearWallVisualization() {
    const levels = this.gameElements.wallDisplay.querySelectorAll('.wall-level');
    levels.forEach(level => {
      level.classList.remove('has-hole');
    });
    this.gameElements.playersPositions.innerHTML = '';
  }

  /**
   * Muestra el hueco en la pared
   * @private
   */
  _showWallHole(holePosition) {
    const levels = this.gameElements.wallDisplay.querySelectorAll('.wall-level');
    levels.forEach(level => {
      const levelNum = parseInt(level.dataset.level);
      if (levelNum === holePosition) {
        level.classList.add('has-hole');
      }
    });
  }

  /**
   * Muestra las posiciones de los jugadores en la pared
   * @private
   */
  _showPlayerPositions(results) {
    this.gameElements.playersPositions.innerHTML = '';
    
    results.forEach((result, index) => {
      const marker = this._createPlayerMarker(result);
      
      // Calcular posición vertical basada en la altura seleccionada
      // Cada nivel tiene aproximadamente 35px de altura (30px + 5px gap)
      const levelHeight = 35;
      const topPosition = (10 - result.selectedHeight) * levelHeight + 15;
      
      marker.style.top = `${topPosition}px`;
      marker.style.animationDelay = `${index * 0.1}s`;
      
      this.gameElements.playersPositions.appendChild(marker);
    });
  }

  /**
   * Crea un marcador de jugador para la pared
   * @private
   */
  _createPlayerMarker(result) {
    const div = document.createElement('div');
    div.className = 'player-marker';
    
    // Añadir clase según el resultado
    if (result.result === 'perfect') {
      div.classList.add('perfect');
    } else if (result.result === 'too-low') {
      div.classList.add('too-low');
    } else if (result.result === 'too-high') {
      div.classList.add('too-high');
    }
    
    // Icono según resultado
    let icon = '👤';
    if (result.result === 'perfect') icon = '🎯';
    else if (result.result === 'too-low') icon = '⬇️';
    else if (result.result === 'too-high') icon = '⬆️';
    
    // Formatear puntos
    const pointsText = result.pointsEarned >= 0 ? `+${result.pointsEarned}` : result.pointsEarned;
    
    div.innerHTML = `
      <span class="player-marker-icon">${icon}</span>
      <span class="player-marker-name">${result.playerName}</span>
      <span class="player-marker-points">${pointsText}</span>
    `;
    
    return div;
  }

  /**
   * Actualiza la tabla de puntuaciones
   * @private
   */
  _updateScoresTable(scores) {
    const players = this.state.players;
    
    // Ordenar jugadores por puntuación
    const sortedPlayers = [...players].sort((a, b) => {
      const scoreA = scores.get(a.id) || 0;
      const scoreB = scores.get(b.id) || 0;
      return scoreB - scoreA;
    });
    
    this.gameElements.scoresTable.innerHTML = '';
    
    sortedPlayers.forEach(player => {
      const score = scores.get(player.id) || 0;
      const previousScore = this.previousScores.get(player.id) || 0;
      const scoreChange = score - previousScore;
      
      const scoreItem = this._createScoreItem(player, score, scoreChange);
      this.gameElements.scoresTable.appendChild(scoreItem);
    });
    
    // Actualizar puntuaciones anteriores
    scores.forEach((score, playerId) => {
      this.previousScores.set(playerId, score);
    });
  }

  /**
   * Crea un elemento de puntuación
   * @private
   */
  _createScoreItem(player, score, scoreChange) {
    const div = document.createElement('div');
    div.className = 'score-item';
    
    if (player.id === this.state.playerId) {
      div.classList.add('current-player');
    }
    
    if (scoreChange > 0) {
      div.classList.add('score-increased');
    } else if (scoreChange < 0) {
      div.classList.add('score-decreased');
    }
    
    const initial = player.name ? player.name.charAt(0).toUpperCase() : '?';
    
    let changeHTML = '';
    if (scoreChange !== 0) {
      const changeClass = scoreChange > 0 ? 'positive' : 'negative';
      const changeText = scoreChange > 0 ? `+${scoreChange}` : scoreChange;
      changeHTML = `<div class="score-change ${changeClass}">${changeText}</div>`;
    }
    
    div.innerHTML = `
      <div class="score-player-info">
        <div class="score-avatar">${initial}</div>
        <div class="score-name">${player.name || 'Sin nombre'}</div>
      </div>
      <div class="score-points">
        <div class="score-total">${score}</div>
        ${changeHTML}
      </div>
    `;
    
    return div;
  }

  // ==================== Renderizado de UI - Results ====================

  /**
   * Renderiza la tabla de clasificación final
   * @private
   */
  _renderLeaderboard(finalScores) {
    this.resultsElements.leaderboardList.innerHTML = '';
    
    finalScores.forEach((scoreData, index) => {
      const item = this._createLeaderboardItem(scoreData, index);
      this.resultsElements.leaderboardList.appendChild(item);
    });
    
    // Reiniciar botón de reinicio
    this.resultsElements.restartBtn.disabled = false;
    this.resultsElements.restartBtn.innerHTML = '<span class="btn-icon">🔄</span> Jugar de Nuevo';
  }

  /**
   * Crea un elemento de la tabla de clasificación
   * @private
   */
  _createLeaderboardItem(scoreData, index) {
    const div = document.createElement('div');
    div.className = 'leaderboard-item';
    
    if (scoreData.isWinner) {
      div.classList.add('winner');
    }
    
    if (scoreData.playerId === this.state.playerId) {
      div.classList.add('current-player');
    }
    
    const player = this.state.getPlayer(scoreData.playerId);
    const playerName = player ? player.name : scoreData.playerName;
    
    // Determinar clase de rango
    let rankClass = '';
    if (scoreData.rank === 1) rankClass = 'rank-1';
    else if (scoreData.rank === 2) rankClass = 'rank-2';
    else if (scoreData.rank === 3) rankClass = 'rank-3';
    
    // Icono de rango
    let rankIcon = scoreData.rank;
    if (scoreData.rank === 1) rankIcon = '🥇';
    else if (scoreData.rank === 2) rankIcon = '🥈';
    else if (scoreData.rank === 3) rankIcon = '🥉';
    
    // Badges
    let badgesHTML = '';
    if (scoreData.isWinner) {
      badgesHTML += '<span class="leaderboard-badge winner-badge">🏆 Ganador</span>';
    }
    if (scoreData.playerId === this.state.playerId) {
      badgesHTML += '<span class="leaderboard-badge you-badge">Tú</span>';
    }
    
    div.innerHTML = `
      <div class="leaderboard-left">
        <div class="rank-badge ${rankClass}">${rankIcon}</div>
        <div class="leaderboard-player-info">
          <div class="leaderboard-player-name">${playerName}</div>
          <div class="leaderboard-badges">${badgesHTML}</div>
        </div>
      </div>
      <div class="leaderboard-right">
        <div class="leaderboard-score">${scoreData.score}</div>
        <div class="leaderboard-score-label">puntos</div>
      </div>
    `;
    
    return div;
  }

  /**
   * Actualiza el estado de reinicio
   * @private
   */
  _updateRestartStatus(consents, total) {
    this.resultsElements.restartCount.textContent = consents;
    this.resultsElements.restartTotal.textContent = total;
    
    const percentage = total > 0 ? (consents / total) * 100 : 0;
    this.resultsElements.restartProgressBar.style.width = `${percentage}%`;
    
    if (percentage === 100) {
      this.resultsElements.restartProgressBar.classList.add('complete');
    }
  }

  // ==================== Manejo de Errores ====================

  /**
   * Muestra un mensaje de error en la pantalla de inicio
   * @private
   */
  _showError(message) {
    const errorElement = this.homeElements.errorMessage;
    errorElement.textContent = message;
    errorElement.classList.add('show');
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this._hideError();
    }, 5000);
  }

  /**
   * Oculta el mensaje de error de la pantalla de inicio
   * @private
   */
  _hideError() {
    this.homeElements.errorMessage.classList.remove('show');
  }

  /**
   * Maneja errores de sala
   * @private
   */
  _handleRoomError(message) {
    // Mostrar error según la pantalla actual
    if (this.currentScreen === 'home') {
      this._showError(message);
    } else {
      this._showNotification(message, 'error', 5000);
    }
    
    // Si el error es crítico, volver a la pantalla de inicio
    const criticalErrors = [
      'sala no existe',
      'sala no encontrada',
      'código inválido'
    ];
    
    const isCritical = criticalErrors.some(err => 
      message.toLowerCase().includes(err)
    );
    
    if (isCritical && this.currentScreen !== 'home') {
      setTimeout(() => {
        this._returnToHome();
      }, 3000);
    }
  }

  /**
   * Maneja la pérdida de conexión
   * @private
   */
  _handleConnectionLost(data) {
    this.isReconnecting = true;
    this.reconnectNotificationId = this._showNotification(
      'Conexión perdida. Intentando reconectar...',
      'warning',
      0 // No auto-ocultar
    );
  }

  /**
   * Maneja errores de conexión
   * @private
   */
  _handleConnectionError(data) {
    if (!this.isReconnecting) {
      this._showNotification(
        'Error de conexión: ' + data.error,
        'error',
        5000
      );
    }
  }

  /**
   * Maneja timeout de conexión
   * @private
   */
  _handleConnectionTimeout() {
    this._showNotification(
      'Tiempo de conexión agotado. Reintentando...',
      'warning',
      5000
    );
  }

  /**
   * Maneja el estado de reconexión
   * @private
   */
  _handleReconnecting(data) {
    this.isReconnecting = true;
    
    // Actualizar notificación existente o crear nueva
    if (this.reconnectNotificationId) {
      this._updateNotification(
        this.reconnectNotificationId,
        `Reconectando... (Intento ${data.attempt}/${data.maxAttempts})`,
        'warning'
      );
    } else {
      this.reconnectNotificationId = this._showNotification(
        `Reconectando... (Intento ${data.attempt}/${data.maxAttempts})`,
        'warning',
        0
      );
    }
  }

  /**
   * Maneja la reconexión exitosa
   * @private
   */
  _handleReconnected(data) {
    this.isReconnecting = false;
    
    // Ocultar notificación de reconexión
    if (this.reconnectNotificationId) {
      this._hideNotification(this.reconnectNotificationId);
      this.reconnectNotificationId = null;
    }
    
    // Mostrar mensaje de éxito
    this._showNotification(
      '¡Reconectado exitosamente!',
      'success',
      3000
    );
    
    this._hideError();
    
    // Si estábamos en una sala, intentar recuperar el estado
    if (this.state.roomCode && this.currentScreen === 'home') {
      this._showNotification(
        'Intenta volver a unirte a la sala: ' + this.state.roomCode,
        'info',
        8000
      );
    }
  }

  /**
   * Maneja el fallo de reconexión
   * @private
   */
  _handleReconnectFailed() {
    this.isReconnecting = false;
    
    // Ocultar notificación de reconexión
    if (this.reconnectNotificationId) {
      this._hideNotification(this.reconnectNotificationId);
      this.reconnectNotificationId = null;
    }
    
    // Mostrar mensaje de error crítico
    this._showNotification(
      'No se pudo reconectar al servidor. Por favor, recarga la página.',
      'error',
      0 // No auto-ocultar
    );
    
    // Volver a la pantalla de inicio
    setTimeout(() => {
      this._returnToHome();
    }, 2000);
  }

  /**
   * Vuelve a la pantalla de inicio y limpia el estado
   * @private
   */
  _returnToHome() {
    this.state.clearState();
    this._showScreen('home');
    this.homeElements.roomCodeInput.value = '';
    this.homeElements.joinRoomBtn.disabled = true;
  }

  // ==================== Sistema de Notificaciones ====================

  /**
   * Muestra una notificación global
   * @private
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación ('success', 'error', 'warning', 'info')
   * @param {number} duration - Duración en ms (0 = no auto-ocultar)
   * @returns {string} ID de la notificación
   */
  _showNotification(message, type = 'info', duration = 3000) {
    const id = 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification notification-${type}`;
    
    // Icono según el tipo
    let icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '✕';
    else if (type === 'warning') icon = '⚠';
    
    notification.innerHTML = `
      <span class="notification-icon">${icon}</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    this.notificationContainer.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Auto-ocultar si se especifica duración
    if (duration > 0) {
      setTimeout(() => {
        this._hideNotification(id);
      }, duration);
    }
    
    return id;
  }

  /**
   * Actualiza una notificación existente
   * @private
   */
  _updateNotification(id, message, type) {
    const notification = document.getElementById(id);
    if (notification) {
      notification.className = `notification notification-${type} show`;
      
      let icon = 'ℹ️';
      if (type === 'success') icon = '✓';
      else if (type === 'error') icon = '✕';
      else if (type === 'warning') icon = '⚠';
      
      const messageElement = notification.querySelector('.notification-message');
      const iconElement = notification.querySelector('.notification-icon');
      
      if (messageElement) messageElement.textContent = message;
      if (iconElement) iconElement.textContent = icon;
    }
  }

  /**
   * Oculta una notificación
   * @private
   */
  _hideNotification(id) {
    const notification = document.getElementById(id);
    if (notification) {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  }

  // ==================== Métodos Públicos ====================

  /**
   * Inicializa la aplicación
   */
  initialize() {
    console.log('UIController inicializado');
    this._showScreen('home');
  }

  /**
   * Obtiene la pantalla actual
   * @returns {string}
   */
  getCurrentScreen() {
    return this.currentScreen;
  }
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM cargado, inicializando aplicación...');
  
  // Crear instancias
  const gameClient = new GameClient();
  const stateManager = new StateManager();
  const uiController = new UIController(gameClient, stateManager);
  
  // Conectar eventos del cliente con el state manager
  gameClient.on('connected', (data) => stateManager.handleConnected(data.socketId));
  gameClient.on('room-created', (roomCode) => stateManager.handleRoomCreated(roomCode));
  gameClient.on('room-joined', (roomData) => stateManager.handleRoomJoined(roomData));
  gameClient.on('room-error', (message) => stateManager.handleRoomError(message));
  gameClient.on('player-list-updated', (players) => stateManager.handlePlayerListUpdated(players));
  gameClient.on('game-started', () => stateManager.handleGameStarted());
  gameClient.on('round-started', (data) => stateManager.handleRoundStarted(data));
  gameClient.on('selection-locked', () => stateManager.handleSelectionLocked());
  gameClient.on('wall-revealed', (data) => stateManager.handleWallRevealed(data));
  gameClient.on('round-ended', (scores) => stateManager.handleRoundEnded(scores));
  gameClient.on('game-ended', (finalScores) => stateManager.handleGameEnded(finalScores));
  gameClient.on('restart-status', (data) => stateManager.handleRestartStatus(data));
  gameClient.on('game-restarted', () => stateManager.handleGameRestarted());
  gameClient.on('player-left', (data) => stateManager.handlePlayerLeft(data));
  gameClient.on('player-disconnected', (playerId) => stateManager.handlePlayerDisconnected(playerId));
  gameClient.on('disconnected', (data) => stateManager.handleDisconnected(data));
  
  // Conectar eventos de conexión y errores
  gameClient.on('connection-lost', (data) => stateManager.handleConnectionLost(data));
  gameClient.on('connection-error', (data) => stateManager.handleConnectionError(data));
  gameClient.on('connection-timeout', () => stateManager.handleConnectionTimeout());
  gameClient.on('reconnecting', (data) => stateManager.handleReconnecting(data));
  gameClient.on('reconnected', (data) => stateManager.handleReconnected(data));
  gameClient.on('reconnect-failed', () => stateManager.handleReconnectFailed());
  
  // Inicializar UI
  uiController.initialize();
  
  // Conectar al servidor
  gameClient.connect();
  
  // Exponer globalmente para debugging (opcional)
  window.gameClient = gameClient;
  window.stateManager = stateManager;
  window.uiController = uiController;
  
  console.log('Aplicación inicializada correctamente');
});

console.log('UIController class loaded');
