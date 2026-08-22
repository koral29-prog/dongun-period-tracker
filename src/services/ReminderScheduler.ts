import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { parseLocalDate } from '@/domain/localDate';
import type { CycleEstimate, Locale, UserSettings } from '@/domain/types';

const CHANNEL_ID = 'private-cycle-reminders';

export class ReminderScheduler {
  async cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async reschedule(settings: UserSettings, estimate: CycleEstimate | null) {
    await this.cancelAll();
    if (!settings.reminders.enabled) return false;
    const permission = await Notifications.getPermissionsAsync();
    const finalPermission = permission.granted ? permission : await Notifications.requestPermissionsAsync();
    if (!finalPermission.granted) return false;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, { name: 'Cycle reminders', importance: Notifications.AndroidImportance.DEFAULT, sound: null, vibrationPattern: null, lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE });
    }
    if (estimate) {
      const target = parseLocalDate(estimate.estimatedStartMin);
      const date = new Date(target.year, target.month - 1, target.day - settings.reminders.periodEstimateDaysBefore, settings.reminders.hour, settings.reminders.minute);
      if (date.getTime() > Date.now()) {
        await Notifications.scheduleNotificationAsync({
          content: this.content(settings.locale, settings.notificationPrivacy),
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined },
        });
      }
    }
    return true;
  }

  private content(locale: Locale, privacy: UserSettings['notificationPrivacy']) {
    if (privacy === 'discreet') return { title: locale === 'tr' ? 'Döngün' : 'Your Cycle', body: locale === 'tr' ? 'Uygulamayı kontrol etmek isteyebilirsin.' : 'You may want to check the app.', sound: false };
    return { title: locale === 'tr' ? 'Döngü hatırlatması' : 'Cycle reminder', body: locale === 'tr' ? 'Tahmini tarihlerinde bir güncelleme var.' : 'There is an update to your estimated dates.', sound: false };
  }
}

export const reminderScheduler = new ReminderScheduler();
