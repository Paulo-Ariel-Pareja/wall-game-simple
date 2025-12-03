import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Servicio para calcular puntuaciones del juego
 * Utiliza ConfigService para obtener los valores de puntuación desde .env
 */
@Injectable()
export class ScoreCalculatorService {
  constructor(private configService: ConfigService) {}

  /**
   * Calcula los puntos ganados o perdidos según la altura seleccionada vs el hueco de la pared
   * Los valores de puntuación se obtienen desde ConfigService que lee del archivo .env
   * @param selectedHeight - Altura seleccionada por el jugador (1-10)
   * @param wallHole - Posición del hueco en la pared (1-10)
   * @returns Puntos: positivos si coincide, negativos si falla
   */
  calculatePoints(selectedHeight: number, wallHole: number): number {
    if (selectedHeight === wallHole) {
      return this.configService.get<number>('game.scoring.perfect', 20);
    } else if (selectedHeight < wallHole) {
      return this.configService.get<number>('game.scoring.tooLow', -5);
    } else {
      return this.configService.get<number>('game.scoring.tooHigh', -10);
    }
  }

  /**
   * Determina el resultado de la selección del jugador
   * @param selectedHeight - Altura seleccionada por el jugador (1-10)
   * @param wallHole - Posición del hueco en la pared (1-10)
   * @returns Tipo de resultado: 'perfect', 'too-low', o 'too-high'
   */
  getResultType(
    selectedHeight: number,
    wallHole: number,
  ): 'perfect' | 'too-low' | 'too-high' {
    if (selectedHeight === wallHole) {
      return 'perfect';
    } else if (selectedHeight < wallHole) {
      return 'too-low';
    } else {
      return 'too-high';
    }
  }
}
