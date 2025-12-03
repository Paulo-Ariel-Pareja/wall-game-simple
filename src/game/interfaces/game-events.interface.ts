import { Player } from './player.interface';
import { Room } from './room.interface';
import { RoundResult } from './round-result.interface';
import { PlayerScore } from './player-score.interface';

/**
 * Eventos que el servidor emite a los clientes
 */
export interface ServerToClientEvents {
  /** Sala creada exitosamente */
  'room-created': (roomCode: string) => void;

  /** Jugador unido a sala exitosamente */
  'room-joined': (roomData: RoomData) => void;

  /** Error relacionado con la sala */
  'room-error': (message: string) => void;

  /** Lista de jugadores actualizada */
  'player-list-updated': (players: Player[]) => void;

  /** Juego iniciado */
  'game-started': (maxRounds: number) => void;

  /** Nueva ronda iniciada */
  'round-started': (roundNumber: number, duration: number) => void;

  /** Período de selección bloqueado */
  'selection-locked': () => void;

  /** Pared revelada con resultados */
  'wall-revealed': (holePosition: number, results: RoundResult[]) => void;

  /** Ronda finalizada con puntuaciones actualizadas */
  'round-ended': (scores: PlayerScore[]) => void;

  /** Juego finalizado con puntuaciones finales */
  'game-ended': (finalScores: PlayerScore[]) => void;

  /** Estado de consentimientos para reinicio */
  'restart-status': (consents: number, total: number) => void;

  /** Jugador desconectado */
  'player-disconnected': (playerId: string) => void;
}

/**
 * Eventos que los clientes emiten al servidor
 */
export interface ClientToServerEvents {
  /** Crear nueva sala */
  'create-room': () => void;

  /** Unirse a sala existente */
  'join-room': (data: JoinRoomData) => void;

  /** Establecer nombre de jugador */
  'set-player-name': (data: SetPlayerNameData) => void;

  /** Marcar jugador como listo */
  'player-ready': () => void;

  /** Seleccionar altura de salto */
  'select-height': (data: SelectHeightData) => void;

  /** Dar consentimiento para reiniciar */
  'restart-consent': () => void;
}

/**
 * Datos para unirse a una sala
 */
export interface JoinRoomData {
  /** Código de sala de 6 caracteres */
  roomCode: string;
}

/**
 * Datos para establecer nombre de jugador
 */
export interface SetPlayerNameData {
  /** Nombre del jugador (2-20 caracteres) */
  name: string;
}

/**
 * Datos para seleccionar altura
 */
export interface SelectHeightData {
  /** Altura seleccionada (1-10) */
  height: number;
}

/**
 * Datos de sala enviados al cliente
 */
export interface RoomData {
  /** Código de la sala */
  roomCode: string;

  /** Lista de jugadores en la sala */
  players: Player[];

  /** Estado actual de la sala */
  state: string;

  /** Ronda actual */
  currentRound: number;

  /** Total de rondas */
  maxRounds: number;
}
