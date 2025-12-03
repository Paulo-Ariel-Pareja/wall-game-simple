/**
 * Valida que un código de sala tenga el formato correcto
 * @param code - Código de sala a validar
 * @returns true si el código es válido (6 caracteres alfanuméricos)
 */
export function isValidRoomCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Debe tener exactamente 6 caracteres alfanuméricos
  const roomCodeRegex = /^[A-Z0-9]{6}$/;
  return roomCodeRegex.test(code.toUpperCase());
}

/**
 * Valida que un nombre de jugador tenga el formato correcto
 * @param name - Nombre del jugador a validar
 * @returns true si el nombre es válido (2-20 caracteres, sin caracteres especiales)
 */
export function isValidPlayerName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }

  const trimmedName = name.trim();

  // Debe tener entre 2 y 20 caracteres
  if (trimmedName.length < 2 || trimmedName.length > 20) {
    return false;
  }

  // Solo letras, números, espacios y guiones bajos
  const nameRegex = /^[a-zA-Z0-9\s_]+$/;
  return nameRegex.test(trimmedName);
}

/**
 * Valida que una altura de salto esté en el rango correcto
 * @param height - Altura a validar
 * @returns true si la altura está entre 1 y 10 (inclusive)
 */
export function isValidHeight(height: number): boolean {
  return Number.isInteger(height) && height >= 1 && height <= 10;
}
