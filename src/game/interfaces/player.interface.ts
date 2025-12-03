/**
 * Representa un jugador en el sistema de juego
 */
export interface Player {
  /** UUID único del jugador */
  id: string;

  /** ID de socket para comunicación en tiempo real */
  socketId: string;

  /** Nombre del jugador (2-20 caracteres) */
  name: string;

  /** Estado de preparación del jugador */
  isReady: boolean;

  /** Indica si el jugador es el anfitrión (creador de la sala) */
  isHost: boolean;

  /** Puntuación acumulada del jugador */
  score: number;

  /** Altura seleccionada en la ronda actual (1-10 o null si no ha seleccionado) */
  currentHeight: number | null;

  /** Estado de conexión del jugador */
  isConnected: boolean;
}
