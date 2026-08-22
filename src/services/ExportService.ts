import { Directory, File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { displayLocalDate } from '@/domain/localDate';
import type { DailyLog, Locale, PeriodEvent } from '@/domain/types';
import { serializeCsv } from '@/services/exportFormat';

const PREFIX = 'your-cycle-export-';

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!);
}

export class ExportService {
  async shareCsv(logs: DailyLog[]) {
    const file = new File(Paths.cache, `${PREFIX}${Date.now()}.csv`);
    try {
      file.write(serializeCsv(logs));
      await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Your Cycle export' });
    }
    finally { if (file.exists) file.delete(); }
  }

  async sharePdf(events: PeriodEvent[], logs: DailyLog[], locale: Locale) {
    const title = locale === 'tr' ? 'Döngü geçmişim' : 'My cycle history';
    const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><style>@page{margin:36px}body{font-family:-apple-system,Arial;color:#173f2b}h1{font-size:28px}h2{margin-top:28px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{padding:7px;border-bottom:1px solid #ddd;text-align:left}.note{padding:12px;background:#f4eee4;border-radius:8px;color:#6b574f}</style></head><body><h1>${title}</h1><p class="note">${locale === 'tr' ? 'Bu dosya şifrelenmemiştir. Yalnızca güvendiğin kişilerle paylaş.' : 'This file is not encrypted. Share it only with someone you trust.'}</p><h2>${locale === 'tr' ? 'Adet kayıtları' : 'Period records'}</h2><table><tr><th>${locale === 'tr' ? 'Başlangıç' : 'Start'}</th><th>${locale === 'tr' ? 'Bitiş' : 'End'}</th></tr>${events.map((event) => `<tr><td>${escapeHtml(displayLocalDate(event.startDate, locale, { dateStyle: 'medium' }))}</td><td>${escapeHtml(displayLocalDate(event.endDate, locale, { dateStyle: 'medium' }))}</td></tr>`).join('')}</table><h2>${locale === 'tr' ? 'Günlük kayıtlar' : 'Daily logs'}</h2><table><tr><th>${locale === 'tr' ? 'Tarih' : 'Date'}</th><th>${locale === 'tr' ? 'Akış' : 'Flow'}</th><th>${locale === 'tr' ? 'Ağrı' : 'Pain'}</th><th>${locale === 'tr' ? 'Belirtiler' : 'Symptoms'}</th></tr>${logs.map((log) => `<tr><td>${escapeHtml(log.date)}</td><td>${log.flow}</td><td>${log.pain}</td><td>${escapeHtml(log.symptoms.join(', '))}</td></tr>`).join('')}</table></body></html>`;
    const result = await Print.printToFileAsync({ html });
    const printFile = new File(result.uri);
    const exportFile = new File(Paths.cache, `${PREFIX}${Date.now()}.pdf`);
    try {
      await printFile.move(exportFile);
      await Sharing.shareAsync(exportFile.uri, { mimeType: 'application/pdf', UTI: '.pdf', dialogTitle: title });
    } finally {
      if (exportFile.exists) exportFile.delete();
      if (printFile.exists) printFile.delete();
    }
  }

  cleanupTemporaryExports() {
    let entries: (File | Directory)[] = [];
    try { entries = new Directory(Paths.cache).list(); } catch { return; }
    for (const entry of entries) {
      if (!(entry instanceof File) || !entry.name.startsWith(PREFIX)) continue;
      try { entry.delete(); } catch { /* The OS may already have removed a cache file. */ }
    }
  }
}

export const exportService = new ExportService();
