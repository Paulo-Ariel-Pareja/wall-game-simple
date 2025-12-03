/**
 * Genera una posición aleatoria para el hueco en la pared
 * @returns Número entre 1 y 10 (inclusive)
 */
export function generateWallHole(): number {
  return Math.floor(Math.random() * 10) + 1;
}
