import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { GameService } from './game.service';
import { RoomService } from './room.service';
import { JoinRoomDto } from './dto/join-room.dto';
import { SetPlayerNameDto } from './dto/set-player-name.dto';
import { SelectHeightDto } from './dto/select-height.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Gateway WebSocket para gestionar la comunicación en tiempo real del juego
 * Maneja conexiones, desconexiones y eventos de juego
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/game',
})
@UsePipes(new ValidationPipe({ transform: true }))
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  /** Mapa de socketId a playerId */
  private socketPlayerMap: Map<string, string> = new Map();

  constructor(
    private readonly gameService: GameService,
    private readonly roomService: RoomService,
  ) {
    // Establecer referencia del gateway en el servicio de juego
    this.gameService.setGateway(this);
  }

  /**
   * Maneja nuevas conexiones de clientes
   * @param client Socket del cliente conectado
   */
  handleConnection(client: Socket): void {
    console.log(`Cliente conectado: ${client.id}`);
  }

  /**
   * Maneja desconexiones de clientes
   * Marca al jugador como desconectado y notifica a otros jugadores
   * @param client Socket del cliente desconectado
   */
  handleDisconnect(client: Socket): void {
    console.log(`Cliente desconectado: ${client.id}`);

    const playerId = this.socketPlayerMap.get(client.id);

    if (!playerId) {
      return;
    }

    const room = this.roomService.getRoomByPlayerId(playerId);

    if (!room) {
      this.socketPlayerMap.delete(client.id);
      return;
    }

    const player = room.players.get(playerId);

    if (!player) {
      this.socketPlayerMap.delete(client.id);
      return;
    }

    // Si el juego no ha comenzado (lobby o waiting-ready), eliminar al jugador
    if (room.state === 'lobby' || room.state === 'waiting-ready') {
      // Eliminar jugador de la sala
      room.players.delete(playerId);

      // Si era el anfitrión, asignar nuevo anfitrión
      if (player.isHost && room.players.size > 0) {
        const newHost = Array.from(room.players.values())[0];
        newHost.isHost = true;
      }

      // Notificar a otros jugadores
      this.emitToRoom(room.code, 'player-left', {
        playerId: player.id,
        playerName: player.name,
      });

      // Actualizar lista de jugadores
      this.emitPlayerListUpdate(room.code);

      // Si no quedan jugadores, eliminar la sala
      if (room.players.size === 0) {
        this.roomService.deleteRoom(room.code);
      }
    } else {
      // Durante el juego, solo marcar como desconectado
      player.isConnected = false;

      // Notificar a otros jugadores de la sala
      this.emitToRoom(room.code, 'player-disconnected', {
        playerId: player.id,
        playerName: player.name,
      });

      // Actualizar lista de jugadores
      this.emitPlayerListUpdate(room.code);

      // Verificar si todos los jugadores se desconectaron
      const allDisconnected = Array.from(room.players.values()).every(
        (p) => !p.isConnected,
      );

      if (allDisconnected) {
        // Eliminar sala si todos se desconectaron
        this.roomService.deleteRoom(room.code);
      }
    }

    this.socketPlayerMap.delete(client.id);
  }

  /**
   * Crea una nueva sala de juego
   * @param client Socket del cliente que crea la sala
   */
  @SubscribeMessage('create-room')
  handleCreateRoom(@ConnectedSocket() client: Socket): void {
    try {
      // Generar ID único para el jugador
      const playerId = uuidv4();

      // Crear sala
      const roomCode = this.roomService.createRoom();

      // Unir jugador a la sala
      const joined = this.roomService.joinRoom(roomCode, playerId, client.id);

      if (!joined) {
        client.emit('room-error', {
          message: 'Error al crear la sala',
        });
        return;
      }

      // Registrar mapeo de socket a jugador
      this.socketPlayerMap.set(client.id, playerId);

      // Unir socket a la sala de Socket.IO
      void client.join(roomCode);

      // Emitir código de sala al cliente
      client.emit('room-created', {
        roomCode,
        playerId,
      });

      // Emitir estado de la sala
      this.emitRoomState(client, roomCode);
    } catch (error) {
      console.error('Error al crear sala:', error);
      client.emit('room-error', {
        message: 'Error al crear la sala',
      });
    }
  }

  /**
   * Une un jugador a una sala existente
   * @param data Datos con el código de sala
   * @param client Socket del cliente que se une
   */
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ): void {
    try {
      const { roomCode } = data;

      // Verificar que la sala existe
      const room = this.roomService.getRoom(roomCode);

      if (!room) {
        client.emit('room-error', {
          message: 'La sala no existe',
        });
        return;
      }

      // Generar ID único para el jugador
      const playerId = uuidv4();

      // Unir jugador a la sala
      const joined = this.roomService.joinRoom(roomCode, playerId, client.id);

      if (!joined) {
        client.emit('room-error', {
          message: 'No se pudo unir a la sala',
        });
        return;
      }

      // Registrar mapeo de socket a jugador
      this.socketPlayerMap.set(client.id, playerId);

      // Unir socket a la sala de Socket.IO
      void client.join(roomCode);

      // Emitir confirmación al cliente
      client.emit('room-joined', {
        roomCode,
        playerId,
      });

      // Emitir estado de la sala al nuevo jugador
      this.emitRoomState(client, roomCode);

      // Notificar a todos los jugadores de la sala sobre la actualización
      this.emitPlayerListUpdate(roomCode);
    } catch (error) {
      console.error('Error al unirse a sala:', error);
      client.emit('room-error', {
        message: 'Error al unirse a la sala',
      });
    }
  }

  /**
   * Asigna un nombre a un jugador
   * @param data Datos con el nombre del jugador
   * @param client Socket del cliente
   */
  @SubscribeMessage('set-player-name')
  handleSetPlayerName(
    @MessageBody() data: SetPlayerNameDto,
    @ConnectedSocket() client: Socket,
  ): void {
    try {
      const { name } = data;
      const playerId = this.socketPlayerMap.get(client.id);

      if (!playerId) {
        client.emit('room-error', {
          message: 'Jugador no encontrado',
        });
        return;
      }

      const room = this.roomService.getRoomByPlayerId(playerId);

      if (!room) {
        client.emit('room-error', {
          message: 'Sala no encontrada',
        });
        return;
      }

      const player = room.players.get(playerId);

      if (!player) {
        client.emit('room-error', {
          message: 'Jugador no encontrado en la sala',
        });
        return;
      }

      // Verificar que el nombre no esté en uso por otro jugador
      const nameInUse = Array.from(room.players.values()).some(
        (p) => p.name === name && p.id !== playerId,
      );

      if (nameInUse) {
        client.emit('room-error', {
          message: 'Este nombre ya está en uso',
        });
        return;
      }

      // Asignar nombre al jugador
      player.name = name;

      // Notificar a todos los jugadores de la actualización
      this.emitPlayerListUpdate(room.code);

      // Confirmar al cliente
      client.emit('name-set', {
        playerId,
        name,
      });
    } catch (error) {
      console.error('Error al establecer nombre:', error);
      client.emit('room-error', {
        message: 'Error al establecer nombre',
      });
    }
  }

  /**
   * Marca un jugador como listo e inicia el juego si todos están listos
   * @param client Socket del cliente
   */
  @SubscribeMessage('player-ready')
  handlePlayerReady(@ConnectedSocket() client: Socket): void {
    try {
      const playerId = this.socketPlayerMap.get(client.id);

      if (!playerId) {
        client.emit('room-error', {
          message: 'Jugador no encontrado',
        });
        return;
      }

      const room = this.roomService.getRoomByPlayerId(playerId);

      if (!room) {
        client.emit('room-error', {
          message: 'Sala no encontrada',
        });
        return;
      }

      const player = room.players.get(playerId);

      if (!player) {
        client.emit('room-error', {
          message: 'Jugador no encontrado en la sala',
        });
        return;
      }

      // Verificar que el jugador tenga nombre
      if (!player.name || player.name.trim() === '') {
        client.emit('room-error', {
          message: 'Debes establecer un nombre antes de estar listo',
        });
        return;
      }

      // Marcar jugador como listo
      player.isReady = true;

      // Cambiar estado de la sala si es necesario
      if (room.state === 'lobby') {
        room.state = 'waiting-ready';
      }

      // Notificar a todos los jugadores
      this.emitPlayerListUpdate(room.code);

      // Verificar si todos los jugadores están listos
      if (this.gameService.checkAllPlayersReady(room.code)) {
        // Iniciar el juego
        this.gameService.startGame(room.code);

        // Notificar a todos los jugadores que el juego ha comenzado
        this.emitToRoom(room.code, 'game-started', {
          maxRounds: room.maxRounds,
        });

        // Emitir evento de inicio de ronda
        this.emitRoundStarted(room.code);
      }
    } catch (error) {
      console.error('Error al marcar jugador listo:', error);
      client.emit('room-error', {
        message: 'Error al marcar como listo',
      });
    }
  }

  /**
   * Registra la selección de altura de un jugador
   * @param data Datos con la altura seleccionada
   * @param client Socket del cliente
   */
  @SubscribeMessage('select-height')
  handleSelectHeight(
    @MessageBody() data: SelectHeightDto,
    @ConnectedSocket() client: Socket,
  ): void {
    try {
      const { height } = data;
      const playerId = this.socketPlayerMap.get(client.id);

      if (!playerId) {
        client.emit('room-error', {
          message: 'Jugador no encontrado',
        });
        return;
      }

      const room = this.roomService.getRoomByPlayerId(playerId);

      if (!room) {
        client.emit('room-error', {
          message: 'Sala no encontrada',
        });
        return;
      }

      // Verificar que la sala esté en estado de selección
      if (room.state !== 'selection') {
        client.emit('room-error', {
          message: 'No es momento de seleccionar altura',
        });
        return;
      }

      // Registrar selección
      this.gameService.submitHeight(room.code, playerId, height);

      // Confirmar al cliente
      client.emit('height-selected', {
        height,
      });
    } catch (error) {
      console.error('Error al seleccionar altura:', error);
      client.emit('room-error', {
        message: 'Error al seleccionar altura',
      });
    }
  }

  /**
   * Registra el consentimiento de un jugador para reiniciar el juego
   * @param client Socket del cliente
   */
  @SubscribeMessage('restart-consent')
  handleRestartConsent(@ConnectedSocket() client: Socket): void {
    try {
      const playerId = this.socketPlayerMap.get(client.id);

      if (!playerId) {
        client.emit('room-error', {
          message: 'Jugador no encontrado',
        });
        return;
      }

      const room = this.roomService.getRoomByPlayerId(playerId);

      if (!room) {
        client.emit('room-error', {
          message: 'Sala no encontrada',
        });
        return;
      }

      // Verificar que la sala esté en estado game-over
      if (room.state !== 'game-over') {
        client.emit('room-error', {
          message: 'El juego no ha terminado',
        });
        return;
      }

      // Registrar consentimiento
      this.gameService.handleRestartConsent(room.code, playerId);

      // Obtener referencia actualizada de la sala
      const updatedRoom = this.roomService.getRoomByPlayerId(playerId);

      if (!updatedRoom) {
        return;
      }

      // Emitir estado de consentimientos
      const consentsCount = updatedRoom.restartConsents.size;
      const totalPlayers = Array.from(updatedRoom.players.values()).filter(
        (p) => p.isConnected,
      ).length;

      this.emitToRoom(updatedRoom.code, 'restart-status', {
        consents: consentsCount,
        total: totalPlayers,
      });

      // Si todos consintieron, el GameService ya reinició el juego
      // Verificar si el estado cambió a waiting-ready
      if (updatedRoom.state === 'waiting-ready') {
        this.emitToRoom(updatedRoom.code, 'game-restarted', {});
        this.emitPlayerListUpdate(updatedRoom.code);
      }
    } catch (error) {
      console.error('Error al registrar consentimiento de reinicio:', error);
      client.emit('room-error', {
        message: 'Error al registrar consentimiento',
      });
    }
  }

  /**
   * Emite el estado completo de la sala a un cliente específico
   * @param client Socket del cliente
   * @param roomCode Código de la sala
   */
  private emitRoomState(client: Socket, roomCode: string): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    const players = Array.from(room.players.values()).map((player) => ({
      id: player.id,
      name: player.name,
      isReady: player.isReady,
      isHost: player.isHost,
      score: player.score,
      isConnected: player.isConnected,
    }));

    client.emit('room-state', {
      roomCode: room.code,
      state: room.state,
      currentRound: room.currentRound,
      maxRounds: room.maxRounds,
      players,
    });
  }

  /**
   * Emite actualización de lista de jugadores a todos en la sala
   * @param roomCode Código de la sala
   */
  private emitPlayerListUpdate(roomCode: string): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    const players = Array.from(room.players.values()).map((player) => ({
      id: player.id,
      name: player.name,
      isReady: player.isReady,
      isHost: player.isHost,
      score: player.score,
      isConnected: player.isConnected,
    }));

    this.emitToRoom(roomCode, 'player-list-updated', { players });
  }

  /**
   * Emite evento de inicio de ronda a todos los jugadores de la sala
   * @param roomCode Código de la sala
   */
  emitRoundStarted(roomCode: string): void {
    const room = this.roomService.getRoom(roomCode);

    if (!room) {
      return;
    }

    this.emitToRoom(roomCode, 'round-started', {
      roundNumber: room.currentRound,
      duration: room.selectionDuration,
    });
  }

  /**
   * Emite evento de bloqueo de selección cuando termina el período de selección
   * @param roomCode Código de la sala
   */
  emitSelectionLocked(roomCode: string): void {
    this.emitToRoom(roomCode, 'selection-locked', {});
  }

  /**
   * Emite evento de pared revelada con resultados de la ronda
   * @param roomCode Código de la sala
   * @param holePosition Posición del hueco en la pared
   * @param results Resultados de la ronda
   */
  emitWallRevealed(
    roomCode: string,
    holePosition: number,
    results: any[],
  ): void {
    this.emitToRoom(roomCode, 'wall-revealed', {
      holePosition,
      results,
    });
  }

  /**
   * Emite evento de fin de ronda con puntuaciones actualizadas
   * @param roomCode Código de la sala
   * @param scores Puntuaciones actuales
   */
  emitRoundEnded(roomCode: string, scores: any[]): void {
    this.emitToRoom(roomCode, 'round-ended', {
      scores,
    });
  }

  /**
   * Emite evento de fin de juego con clasificación final
   * @param roomCode Código de la sala
   * @param finalScores Puntuaciones finales ordenadas
   */
  emitGameEnded(roomCode: string, finalScores: any[]): void {
    this.emitToRoom(roomCode, 'game-ended', {
      finalScores,
    });
  }

  /**
   * Emite un evento a todos los jugadores de una sala específica
   * @param roomCode Código de la sala
   * @param event Nombre del evento
   * @param data Datos del evento
   */
  private emitToRoom(roomCode: string, event: string, data: any): void {
    this.server.to(roomCode).emit(event, data);
  }
}
