import * as LocalAuthentication from 'expo-local-authentication';

export const authenticateWithBiometrics = async () => {
  try {
    // Verificar si el dispositivo tiene hardware de biometría
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    // Verificar si el usuario tiene huellas/PIN registrados
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      // Si no hay biometría, permitimos el acceso directamente
      return { success: true, message: 'Sin biometría, acceso directo' };
    }

    // Solicitar autenticación
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Desbloquea Konekta Premium',
      fallbackLabel: 'Usar PIN/Patrón',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });

    return result;
  } catch (error) {
    console.error('Error en biometría:', error);
    return { success: true, message: 'Error, permitiendo acceso' };
  }
};
