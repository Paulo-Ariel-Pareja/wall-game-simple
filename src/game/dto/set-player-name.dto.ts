import { IsString, Length, Matches } from 'class-validator';

export class SetPlayerNameDto {
  @IsString()
  @Length(2, 20, { message: 'El nombre debe tener entre 2 y 20 caracteres' })
  @Matches(/^[A-Za-z0-9\s]+$/, {
    message: 'El nombre no debe contener caracteres especiales',
  })
  name: string;
}
