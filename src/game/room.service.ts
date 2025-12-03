import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Room } from './interfaces/room.interface';
import { Player } from './interfaces/player.interface';
import { generateRoomCode } from './utils/code-generator.util';

/**
 * Servicio para gestionar salas de juego
 * Responsable de crear, eliminar y mantener el registro de todas las salas activas
 */
@Injectable()
export class RoomService {
  constructor(private readonly configService: ConfigService) {}

  /** Mapa de salas activas (key: código de sala, value: Room) */
  private rooms: Map<string, Room> = new Map();

  /** Mapa para buscar sala por ID de jugador (key: playerId, value: roomCode) */
  private playerRoomMap: Map<string, string> = new Map();

  /**
   * Crea una nueva sala con un código único
   * @returns Código de la sala creada
   */
  createRoom(): string {
    let roomCode: string;

    // Generar código único que no exista
    do {
      roomCode = generateRoomCode();
    } while (this.rooms.has(roomCode));

    // Crear nueva sala con valores por defecto
    const maxRounds = this.configService.get<number>('game.maxRounds', 10);
    const selectionDuration = this.configService.get<number>(
      'game.selectionDuration',
      15,
    );
    const revealDuration = this.configService.get<number>(
      'game.revealDuration',
      5,
    );
    const newRoom: Room = {
      code: roomCode,
      players: new Map<string, Player>(),
      state: 'lobby',
      currentRound: 0,
      maxRounds,
      selectionTimer: null,
      revealTimer: null,
      selectionDuration,
      revealDuration,
      currentWallHole: null,
      restartConsents: new Set<string>(),
      createdAt: new Date(),
    };

    this.rooms.set(roomCode, newRoom);
    return roomCode;
  }

  /**
   * Obtiene una sala por su código
   * @param roomCode Código de la sala
   * @returns La sala si existe, null en caso contrario
   */
  getRoom(roomCode: string): Room | null {
    return this.rooms.get(roomCode) || null;
  }

  /**
   * Agrega un jugador a una sala existente
   * @param roomCode Código de la sala
   * @param playerId ID único del jugador
   * @param socketId ID del socket del jugador
   * @returns true si se unió exitosamente, false si la sala no existe
   */
  joinRoom(roomCode: string, playerId: string, socketId: string): boolean {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return false;
    }

    // Determinar si es el primer jugador (anfitrión)
    const isHost = room.players.size === 0;

    // Crear objeto de jugador
    const player: Player = {
      id: playerId,
      socketId: socketId,
      name: '',
      isReady: false,
      isHost: isHost,
      score: 0,
      currentHeight: null,
      isConnected: true,
    };

    // Agregar jugador a la sala
    room.players.set(playerId, player);

    // Registrar en el mapa de jugador a sala
    this.playerRoomMap.set(playerId, roomCode);

    return true;
  }

  /**
   * Elimina un jugador de su sala
   * @param playerId ID del jugador a eliminar
   */
  removePlayer(playerId: string): void {
    const roomCode = this.playerRoomMap.get(playerId);

    if (!roomCode) {
      return;
    }

    const room = this.rooms.get(roomCode);

    if (!room) {
      this.playerRoomMap.delete(playerId);
      return;
    }

    // Eliminar jugador de la sala
    room.players.delete(playerId);

    // Eliminar del mapa de jugador a sala
    this.playerRoomMap.delete(playerId);

    // Si la sala quedó vacía, eliminarla
    if (room.players.size === 0) {
      this.deleteRoom(roomCode);
    }
  }

  /**
   * Elimina una sala y limpia sus recursos
   * Limpia todos los temporizadores para evitar memory leaks
   * @param roomCode Código de la sala a eliminar
   */
  deleteRoom(roomCode: string): void {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return;
    }

    // Limpiar temporizadores si existen para evitar memory leaks
    if (room.selectionTimer) {
      clearTimeout(room.selectionTimer);
      room.selectionTimer = null;
    }

    if (room.revealTimer) {
      clearTimeout(room.revealTimer);
      room.revealTimer = null;
    }

    // Eliminar todos los jugadores del mapa de jugador a sala
    room.players.forEach((player) => {
      this.playerRoomMap.delete(player.id);
    });

    // Eliminar la sala
    this.rooms.delete(roomCode);
  }

  /**
   * Busca la sala a la que pertenece un jugador
   * @param playerId ID del jugador
   * @returns La sala si el jugador está en una, null en caso contrario
   */
  getRoomByPlayerId(playerId: string): Room | null {
    const roomCode = this.playerRoomMap.get(playerId);

    if (!roomCode) {
      return null;
    }

    return this.rooms.get(roomCode) || null;
  }

  /**
   * Obtiene todas las salas activas (útil para debugging y administración)
   * @returns Array de todas las salas
   */
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}
