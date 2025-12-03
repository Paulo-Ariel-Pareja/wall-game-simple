/**
 * Tipo de resultado de una ronda
 */
export type RoundResultType = 'perfect' | 'too-low' | 'too-high';

/**
 * Resultado de un jugador en una ronda específica
 */
export interface RoundResult {
  /** ID del jugador */
  playerId: string;

  /** Nombre del jugador */
  playerName: string;

  /** Altura seleccionada por el jugador (1-10) */
  selectedHeight: number;

  /** Posición del hueco en la pared (1-10) */
  wallHole: number;

  /** Puntos ganados o perdidos en esta ronda (20, -5, o -10) */
  pointsEarned: number;

  /** Puntuación total acumulada después de esta ronda */
  totalScore: number;

  /** Tipo de resultado */
  result: RoundResultType;
}
