import { Player } from './player.interface';
import { RoomState } from './room-state.interface';

/**
 * Representa una sala de juego
 */
export interface Room {
  /** Código único de 6 caracteres alfanuméricos */
  code: string;

  /** Mapa de jugadores en la sala (key: playerId, value: Player) */
  players: Map<string, Player>;

  /** Estado actual de la sala */
  state: RoomState;

  /** Número de ronda actual (1-10) */
  currentRound: number;

  /** Total de rondas en el juego (por defecto 10) */
  maxRounds: number;

  /** Timer del período de selección */
  selectionTimer: NodeJS.Timeout | null;

  /** Timer del período de revelación */
  revealTimer: NodeJS.Timeout | null;

  /** Duración del período de selección en segundos */
  selectionDuration: number;

  /** Duración del período de revelación en segundos */
  revealDuration: number;

  /** Posición del hueco en la pared actual (1-10 o null) */
  currentWallHole: number | null;

  /** Set de IDs de jugadores que consintieron reiniciar */
  restartConsents: Set<string>;

  /** Fecha de creación de la sala */
  createdAt: Date;
}
