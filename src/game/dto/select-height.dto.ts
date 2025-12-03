import { IsInt, Min, Max } from 'class-validator';

export class SelectHeightDto {
  @IsInt({ message: 'La altura debe ser un número entero' })
  @Min(1, { message: 'La altura mínima es 1' })
  @Max(10, { message: 'La altura máxima es 10' })
  height: number;
}
