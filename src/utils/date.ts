export function safeFormatDate(dateVal: any, locale: string = 'pt-BR'): string {
  if (!dateVal) return 'N/A';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString(locale);
  } catch {
    return 'N/A';
  }
}
