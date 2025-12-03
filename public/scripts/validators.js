/**
 * Validators - Utilidades de validación para el cliente
 * Valida entradas del usuario antes de enviarlas al servidor
 */

class Validators {
  /**
   * Valida el formato de un código de sala
   * @param {string} roomCode - Código de sala a validar
   * @returns {{isValid: boolean, error: string|null}}
   */
  static validateRoomCode(roomCode) {
    if (!roomCode || typeof roomCode !== 'string') {
      return {
        isValid: false,
        error: 'El código de sala es requerido'
      };
    }

    const trimmedCode = roomCode.trim();

    if (trimmedCode.length === 0) {
      return {
        isValid: false,
        error: 'El código de sala no puede estar vacío'
      };
    }

    if (trimmedCode.length !== 6) {
      return {
        isValid: false,
        error: 'El código de sala debe tener exactamente 6 caracteres'
      };
    }

    // Validar que solo contenga caracteres alfanuméricos
    const alphanumericRegex = /^[A-Z0-9]{6}$/i;
    if (!alphanumericRegex.test(trimmedCode)) {
      return {
        isValid: false,
        error: 'El código de sala solo puede contener letras y números'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }

  /**
   * Valida el nombre de un jugador
   * @param {string} playerName - Nombre del jugador a validar
   * @returns {{isValid: boolean, error: string|null}}
   */
  static validatePlayerName(playerName) {
    if (!playerName || typeof playerName !== 'string') {
      return {
        isValid: false,
        error: 'El nombre es requerido'
      };
    }

    const trimmedName = playerName.trim();

    if (trimmedName.length === 0) {
      return {
        isValid: false,
        error: 'El nombre no puede estar vacío'
      };
    }

    if (trimmedName.length < 2) {
      return {
        isValid: false,
        error: 'El nombre debe tener al menos 2 caracteres'
      };
    }

    if (trimmedName.length > 20) {
      return {
        isValid: false,
        error: 'El nombre no puede tener más de 20 caracteres'
      };
    }

    // Validar que no contenga solo espacios
    if (trimmedName.replace(/\s/g, '').length === 0) {
      return {
        isValid: false,
        error: 'El nombre no puede contener solo espacios'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }

  /**
   * Valida una selección de altura
   * @param {number} height - Altura seleccionada a validar
   * @returns {{isValid: boolean, error: string|null}}
   */
  static validateHeight(height) {
    if (height === null || height === undefined) {
      return {
        isValid: false,
        error: 'Debes seleccionar una altura'
      };
    }

    if (typeof height !== 'number') {
      return {
        isValid: false,
        error: 'La altura debe ser un número'
      };
    }

    if (!Number.isInteger(height)) {
      return {
        isValid: false,
        error: 'La altura debe ser un número entero'
      };
    }

    if (height < 1) {
      return {
        isValid: false,
        error: 'La altura mínima es 1'
      };
    }

    if (height > 10) {
      return {
        isValid: false,
        error: 'La altura máxima es 10'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }

  /**
   * Sanitiza un código de sala (convierte a mayúsculas y elimina espacios)
   * @param {string} roomCode - Código de sala a sanitizar
   * @returns {string}
   */
  static sanitizeRoomCode(roomCode) {
    if (!roomCode || typeof roomCode !== 'string') {
      return '';
    }
    return roomCode.trim().toUpperCase();
  }

  /**
   * Sanitiza un nombre de jugador (elimina espacios extra)
   * @param {string} playerName - Nombre del jugador a sanitizar
   * @returns {string}
   */
  static sanitizePlayerName(playerName) {
    if (!playerName || typeof playerName !== 'string') {
      return '';
    }
    // Eliminar espacios al inicio y final, y reducir múltiples espacios a uno solo
    return playerName.trim().replace(/\s+/g, ' ');
  }
}

console.log('Validators class loaded');
