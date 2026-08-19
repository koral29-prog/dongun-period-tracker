import * as LocalAuthentication from 'expo-local-authentication';
import type { Locale } from '@/domain/types';

export class PrivacyLock {
  async unlock(locale: Locale): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: locale === 'tr' ? 'Döngün’ü aç' : 'Unlock Your Cycle',
      promptSubtitle: locale === 'tr' ? 'Kayıtların bu cihazda gizli kalır.' : 'Your entries stay private on this device.',
      fallbackLabel: locale === 'tr' ? 'Cihaz şifresini kullan' : 'Use device passcode',
      cancelLabel: locale === 'tr' ? 'Vazgeç' : 'Cancel',
      disableDeviceFallback: false,
      biometricsSecurityLevel: 'strong',
    });
    return result.success;
  }
}

export const privacyLock = new PrivacyLock();
