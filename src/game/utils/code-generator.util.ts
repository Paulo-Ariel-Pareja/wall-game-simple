/**
 * Genera un código único de sala de 6 caracteres alfanuméricos
 * @returns Código de sala en mayúsculas (ej: "A3B7K9")
 */
export function generateRoomCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }

  return code;
}
