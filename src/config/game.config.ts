import { registerAs } from '@nestjs/config';

export default registerAs('game', () => ({
  selectionDuration: parseInt(process.env.SELECTION_DURATION || '15', 10),
  revealDuration: parseInt(process.env.REVEAL_DURATION || '5', 10),
  maxRounds: 10,
  maxRooms: parseInt(process.env.MAX_ROOMS || '100', 10),
  maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM || '10', 10),
  roomTimeout: parseInt(process.env.ROOM_TIMEOUT || '1800000', 10),
  scoring: {
    perfect: parseInt(process.env.SCORE_PERFECT || '20', 10),
    tooLow: parseInt(process.env.SCORE_TOO_LOW || '-5', 10),
    tooHigh: parseInt(process.env.SCORE_TOO_HIGH || '-10', 10),
  },
  defaultHeight: 5,
}));
