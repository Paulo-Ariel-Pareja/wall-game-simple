import { Module } from '@nestjs/common';
import { RoomService } from './room.service';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { ScoreCalculatorService } from './utils/score-calculator.service';

@Module({
  providers: [RoomService, GameService, GameGateway, ScoreCalculatorService],
  exports: [RoomService, GameService, ScoreCalculatorService],
})
export class GameModule {}
