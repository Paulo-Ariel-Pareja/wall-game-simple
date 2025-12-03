import { IsString, Length, Matches } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @Length(6, 6, {
    message: 'El código de sala debe tener exactamente 6 caracteres',
  })
  @Matches(/^[A-Za-z0-9]{6}$/, {
    message: 'El código de sala debe contener solo caracteres alfanuméricos',
  })
  roomCode: string;
}
