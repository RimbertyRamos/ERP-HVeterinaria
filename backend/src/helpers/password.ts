/** Longitud mínima de contraseña exigida por el backend (no confiar solo en el frontend). */
export const MIN_PASSWORD_LENGTH = 6;

/**
 * Valida una contraseña explícita provista por el cliente.
 * Lanza un error claro si no cumple el mínimo. No aplica a los defaults
 * temporales generados por el sistema (esos se marcan con debe_cambiar_password).
 */
export const validatePassword = (password: string): void => {
    if (typeof password !== 'string' || password.trim().length < MIN_PASSWORD_LENGTH) {
        throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }
};
