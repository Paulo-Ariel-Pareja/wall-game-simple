/**
 * Puntuación final de un jugador al terminar el juego
 */
export interface PlayerScore {
  /** ID del jugador */
  playerId: string;

  /** Nombre del jugador */
  playerName: string;

  /** Puntuación total acumulada */
  score: number;

  /** Posición en la clasificación (1 = primero) */
  rank: number;

  /** Indica si el jugador es ganador (puede haber empates) */
  isWinner: boolean;
}
