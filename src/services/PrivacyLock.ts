import * as LocalAuthentication from 'expo-local-authentication';
import type { Locale } from '@/domain/types';

export class PrivacyLock {
  private lastUnlockedAt = 0;

  shouldLockOnMount(graceSeconds: number) {
    return !this.lastUnlockedAt || Date.now() - this.lastUnlockedAt >= graceSeconds * 1000;
  }

  async canEnable(): Promise<boolean> {
    try {
      return await LocalAuthentication.getEnrolledLevelAsync() !== LocalAuthentication.SecurityLevel.NONE;
    } catch {
      return false;
    }
  }

  async unlock(locale: Locale): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: locale === 'tr' ? 'Döngün’ü aç' : 'Unlock Your Cycle',
        promptSubtitle: locale === 'tr' ? 'Kayıtların bu cihazda gizli kalır.' : 'Your entries stay private on this device.',
        fallbackLabel: locale === 'tr' ? 'Cihaz şifresini kullan' : 'Use device passcode',
        cancelLabel: locale === 'tr' ? 'Vazgeç' : 'Cancel',
        disableDeviceFallback: false,
        biometricsSecurityLevel: 'strong',
      });
      if (result.success) this.lastUnlockedAt = Date.now();
      return result.success;
    } catch {
      return false;
    }
  }
}

export const privacyLock = new PrivacyLock();
