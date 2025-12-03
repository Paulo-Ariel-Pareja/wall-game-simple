import { Injectable } from '@nestjs/common';
import { RoomService } from './room.service';
import { RoundResult } from './interfaces/round-result.interface';
import { PlayerScore } from './interfaces/player-score.interface';
import { ScoreCalculatorService } from './utils/score-calculator.service';

/**
 * Servicio para gestionar la lógica del juego
 * Responsable de controlar el flujo de cada sala, gestionar rondas y calcular puntuaciones
 */
@Injectable()
export class GameService {
  private gateway: any;

  constructor(
    private readonly roomService: RoomService,
    private readonly scoreCalculator: ScoreCalculatorService,
  ) {}

  /**
   * Establece la referencia al gateway para emitir eventos
   * @param gateway Instancia del GameGateway
   */
  setGateway(gateway: any): void {
    this.gateway = gateway;
  }

  /**
   * Inicia el juego en una sala
   * Cambia el estado a 'selection' e inicia la primera ronda
   * @param roomCode Código de la sala
   */
  startGame(roomCode: string): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    // Cambiar estado y comenzar primera ronda
    room.state = 'selection';
    room.currentRound = 1;

    // Iniciar la primera ronda
    this.startRound(roomCode);
  }

  /**
   * Inicia una nueva ronda en la sala
   * Configura el temporizador de selección y resetea las alturas de los jugadores
   * @param roomCode Código de la sala
   */
  startRound(roomCode: string): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    // Limpiar cualquier temporizador previo
    if (room.selectionTimer) {
      clearTimeout(room.selectionTimer);
      room.selectionTimer = null;
    }

    if (room.revealTimer) {
      clearTimeout(room.revealTimer);
      room.revealTimer = null;
    }

    // Resetear selecciones de altura de todos los jugadores
    room.players.forEach((player) => {
      player.currentHeight = null;
    });

    // Resetear hueco de pared
    room.currentWallHole = null;

    // Cambiar estado a selección
    room.state = 'selection';

    // Emitir evento de inicio de ronda con duración del temporizador
    if (this.gateway) {
      this.gateway.emitRoundStarted(roomCode);
    }

    // Configurar temporizador para finalizar período de selección automáticamente
    room.selectionTimer = setTimeout(() => {
      this.endSelectionPeriod(roomCode);
    }, room.selectionDuration * 1000);
  }

  /**
   * Registra la selección de altura de un jugador
   * @param roomCode Código de la sala
   * @param playerId ID del jugador
   * @param height Altura seleccionada (1-10)
   */
  submitHeight(roomCode: string, playerId: string, height: number): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    // Verificar que la sala esté en estado de selección
    if (room.state !== 'selection') {
      return;
    }

    const player = room.players.get(playerId);

    if (!player) {
      return;
    }

    // Registrar la altura seleccionada
    player.currentHeight = height;
  }

  /**
   * Finaliza el período de selección
   * Asigna altura predeterminada a jugadores que no seleccionaron,
   * genera el hueco de la pared y calcula resultados
   * @param roomCode Código de la sala
   */
  endSelectionPeriod(roomCode: string): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    // Verificar que la sala esté en estado de selección
    if (room.state !== 'selection') {
      return;
    }

    // Limpiar temporizador de selección
    if (room.selectionTimer) {
      clearTimeout(room.selectionTimer);
      room.selectionTimer = null;
    }
    const defaultHeight = 5; // Altura predeterminada si el jugador no selecciona

    // Asignar altura predeterminada a jugadores conectados que no seleccionaron
    room.players.forEach((player) => {
      if (player.isConnected && player.currentHeight === null) {
        player.currentHeight = defaultHeight;
      }
    });

    // Generar posición aleatoria del hueco (1-10)
    room.currentWallHole = Math.floor(Math.random() * 10) + 1;

    // Emitir evento de bloqueo de selección
    if (this.gateway) {
      this.gateway.emitSelectionLocked(roomCode);
    }

    // Cambiar estado a revelación
    room.state = 'revealing';

    // Calcular resultados de la ronda
    const results = this.calculateResults(roomCode);

    // Emitir evento de pared revelada con resultados a todos los clientes simultáneamente
    if (this.gateway) {
      this.gateway.emitWallRevealed(roomCode, room.currentWallHole, results);
    }

    // Configurar temporizador para finalizar período de revelación automáticamente
    room.revealTimer = setTimeout(() => {
      this.endRound(roomCode);
    }, room.revealDuration * 1000);
  }

  /**
   * Calcula los resultados de la ronda actual
   * Aplica la lógica de puntuación y actualiza las puntuaciones de los jugadores
   * @param roomCode Código de la sala
   * @returns Array de resultados de la ronda
   */
  calculateResults(roomCode: string): RoundResult[] {
    const room = this.roomService.getRoom(roomCode);

    if (!room || room.currentWallHole === null) {
      return [];
    }

    const results: RoundResult[] = [];
    const defaultHeight = 5; // Valor por defecto si el jugador no selecciona

    room.players.forEach((player) => {
      const selectedHeight = player.currentHeight ?? defaultHeight;
      const pointsEarned = this.scoreCalculator.calculatePoints(
        selectedHeight,
        room.currentWallHole!,
      );

      // Actualizar puntuación del jugador
      player.score += pointsEarned;

      // Crear resultado de la ronda
      const result: RoundResult = {
        playerId: player.id,
        playerName: player.name,
        selectedHeight: selectedHeight,
        wallHole: room.currentWallHole!,
        pointsEarned: pointsEarned,
        totalScore: player.score,
        result: this.scoreCalculator.getResultType(
          selectedHeight,
          room.currentWallHole!,
        ),
      };

      results.push(result);
    });

    return results;
  }

  /**
   * Finaliza la ronda actual
   * Avanza a la siguiente ronda o finaliza el juego si se completaron todas las rondas
   * @param roomCode Código de la sala
   */
  endRound(roomCode: string): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    // Verificar que la sala esté en estado de revelación
    if (room.state !== 'revealing') {
      return;
    }

    // Limpiar temporizador de revelación
    if (room.revealTimer) {
      clearTimeout(room.revealTimer);
      room.revealTimer = null;
    }

    // Obtener puntuaciones actuales
    const scores = Array.from(room.players.values()).map((player) => ({
      playerId: player.id,
      playerName: player.name,
      score: player.score,
    }));

    // Emitir evento de fin de ronda a todos los clientes simultáneamente
    if (this.gateway) {
      this.gateway.emitRoundEnded(roomCode, scores);
    }

    // Verificar si se completaron todas las rondas
    if (room.currentRound >= room.maxRounds) {
      // Finalizar el juego
      this.endGame(roomCode);
    } else {
      // Avanzar a la siguiente ronda con transición automática
      room.currentRound++;
      this.startRound(roomCode);
    }
  }

  /**
   * Finaliza el juego y genera la clasificación final
   * @param roomCode Código de la sala
   * @returns Array de puntuaciones finales ordenadas por ranking
   */
  endGame(roomCode: string): PlayerScore[] {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return [];
    }

    // Cambiar estado a game-over
    room.state = 'game-over';

    // Limpiar temporizadores si existen
    if (room.selectionTimer) {
      clearTimeout(room.selectionTimer);
      room.selectionTimer = null;
    }

    if (room.revealTimer) {
      clearTimeout(room.revealTimer);
      room.revealTimer = null;
    }

    // Crear array de puntuaciones
    const scores: PlayerScore[] = [];

    room.players.forEach((player) => {
      scores.push({
        playerId: player.id,
        playerName: player.name,
        score: player.score,
        rank: 0, // Se asignará después de ordenar
        isWinner: false, // Se asignará después de ordenar
      });
    });

    // Ordenar por puntuación de mayor a menor
    scores.sort((a, b) => b.score - a.score);

    // Asignar rankings y determinar ganadores
    const highestScore = scores.length > 0 ? scores[0].score : 0;

    scores.forEach((score, index) => {
      score.rank = index + 1;
      score.isWinner = score.score === highestScore;
    });

    // Emitir evento de fin de juego
    if (this.gateway) {
      this.gateway.emitGameEnded(roomCode, scores);
    }

    return scores;
  }

  /**
   * Gestiona el consentimiento de un jugador para reiniciar el juego
   * Si todos los jugadores consienten, reinicia el juego
   * @param roomCode Código de la sala
   * @param playerId ID del jugador que da su consentimiento
   */
  handleRestartConsent(roomCode: string, playerId: string): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    // Verificar que la sala esté en estado game-over
    if (room.state !== 'game-over') {
      return;
    }

    // Agregar consentimiento del jugador
    room.restartConsents.add(playerId);

    // Verificar si todos los jugadores han dado su consentimiento
    if (this.checkAllRestartConsents(roomCode)) {
      // Reiniciar el juego
      this.restartGame(roomCode);
    }
  }

  /**
   * Reinicia el juego en una sala
   * Resetea puntuaciones, rondas y consentimientos
   * @param roomCode Código de la sala
   */
  private restartGame(roomCode: string): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    // Resetear puntuaciones y estado de jugadores
    room.players.forEach((player) => {
      player.score = 0;
      player.currentHeight = null;
      player.isReady = false;
    });

    // Resetear estado de la sala
    room.currentRound = 0;
    room.currentWallHole = null;
    room.restartConsents.clear();
    room.state = 'waiting-ready';
  }

  /**
   * Verifica si todos los jugadores conectados están listos
   * @param roomCode Código de la sala
   * @returns true si todos los jugadores están listos, false en caso contrario
   */
  checkAllPlayersReady(roomCode: string): boolean {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return false;
    }

    // Verificar que haya al menos un jugador
    if (room.players.size === 0) {
      return false;
    }

    // Verificar que todos los jugadores conectados estén listos
    for (const player of room.players.values()) {
      if (player.isConnected && !player.isReady) {
        return false;
      }
    }

    return true;
  }

  /**
   * Verifica si todos los jugadores conectados han dado su consentimiento para reiniciar
   * @param roomCode Código de la sala
   * @returns true si todos han consentido, false en caso contrario
   */
  checkAllRestartConsents(roomCode: string): boolean {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return false;
    }

    // Verificar que haya al menos un jugador
    if (room.players.size === 0) {
      return false;
    }

    // Verificar que todos los jugadores conectados hayan dado su consentimiento
    for (const player of room.players.values()) {
      if (player.isConnected && !room.restartConsents.has(player.id)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Limpia todos los temporizadores de una sala
   * Debe ser llamado antes de eliminar una sala para evitar memory leaks
   * @param roomCode Código de la sala
   */
  cleanupRoomTimers(roomCode: string): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    // Limpiar temporizador de selección
    if (room.selectionTimer) {
      clearTimeout(room.selectionTimer);
      room.selectionTimer = null;
    }

    // Limpiar temporizador de revelación
    if (room.revealTimer) {
      clearTimeout(room.revealTimer);
      room.revealTimer = null;
    }
  }
}
