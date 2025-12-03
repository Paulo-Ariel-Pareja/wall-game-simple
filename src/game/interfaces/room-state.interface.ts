/**
 * Estados posibles de una sala de juego
 */
export type RoomState =
  | 'lobby' // Esperando jugadores
  | 'waiting-ready' // Esperando que todos estén listos
  | 'selection' // Período de selección de altura
  | 'revealing' // Mostrando pared y resultados
  | 'game-over' // Juego terminado
  | 'waiting-restart'; // Esperando consentimiento para reiniciar
