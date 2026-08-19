import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { AppPalette } from '@/constants/palette';
import { useApp } from '@/state/AppContext';
import { useTheme } from '@/state/ThemeContext';

export default function PrivacyScreen() {
  const { settings } = useApp(); const tr = settings.locale === 'tr';
  const { colors } = useTheme(); const styles = useMemo(() => createStyles(colors), [colors]);
  return <ScrollView style={styles.root} contentContainerStyle={styles.content}><Text style={styles.title}>{tr ? 'Gizlilik politikası' : 'Privacy policy'}</Text><Text style={styles.updated}>{tr ? 'Son güncelleme: 19 Ağustos 2026' : 'Last updated: August 19, 2026'}</Text>
    <Text style={styles.heading}>{tr ? 'Kısa cevap' : 'The short answer'}</Text><Text style={styles.body}>{tr ? 'Döngün, sağlık verilerini yalnızca cihazında tutar. Hesap, sunucu, reklam, analiz veya uzaktan veri aktarımı yoktur.' : 'Your Cycle keeps health data only on your device. There are no accounts, servers, ads, analytics, or remote data transfers.'}</Text>
    <Text style={styles.heading}>{tr ? 'Cihazındaki veriler' : 'Data on your device'}</Text><Text style={styles.body}>{tr ? 'Adet kayıtları, günlük takipler, notlar ve tercihler SQLCipher ile şifrelenmiş yerel veritabanında saklanır. Anahtar yalnızca cihazdaki güvenli anahtar zincirinde tutulur.' : 'Period records, daily logs, notes, and preferences are stored in a SQLCipher-encrypted local database. Its key is kept only in the device secure keychain.'}</Text>
    <Text style={styles.heading}>{tr ? 'Bildirimler ve dışa aktarma' : 'Notifications and exports'}</Text><Text style={styles.body}>{tr ? 'Hatırlatmalar yerel olarak planlanır. PDF ve CSV dışa aktarımları şifresizdir; paylaşım tamamlandıktan sonra geçici kopya silinir.' : 'Reminders are scheduled locally. PDF and CSV exports are plaintext; the temporary copy is deleted after the share flow ends.'}</Text>
    <Text style={styles.heading}>{tr ? 'Seçimlerin' : 'Your choices'}</Text><Text style={styles.body}>{tr ? 'Ayarlar’dan verilerini dışa aktarabilir veya tamamen silebilirsin. Veriler silindiğinde kayıtlar, ayarlar, bildirimler ve geçici dosyalar kaldırılır.' : 'You can export or delete everything from Settings. Deletion removes records, settings, scheduled notifications, and temporary files.'}</Text>
    <Text style={styles.heading}>{tr ? 'Tıbbi değildir' : 'Not medical care'}</Text><Text style={styles.body}>{tr ? 'Uygulama tıbbi cihaz değildir ve tanı, tedavi veya gebelikten korunma önerisi sunmaz.' : 'The app is not a medical device and does not provide diagnosis, treatment, or contraception guidance.'}</Text>
  </ScrollView>;
}

const createStyles = (colors: AppPalette) => StyleSheet.create({ root: { flex: 1, backgroundColor: colors.cream }, content: { padding: 22, paddingBottom: 50 }, title: { color: colors.forestDark, fontFamily: 'serif', fontSize: 32, fontWeight: '700' }, updated: { marginTop: 7, color: colors.muted, fontSize: 11 }, heading: { marginTop: 27, color: colors.forest, fontSize: 17, fontWeight: '700' }, body: { marginTop: 7, color: colors.ink, fontSize: 14, lineHeight: 22 } });
