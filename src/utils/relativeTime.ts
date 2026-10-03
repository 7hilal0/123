export type RelativeTimeLanguage = 'ar' | 'en' | 'fr';

export function formatRelativeTime(timestamp: number | undefined, language: RelativeTimeLanguage, fallback: string): string {
  if (!timestamp || !Number.isFinite(timestamp)) return fallback;

  const diffMs = Math.max(0, Date.now() - timestamp);
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (language === 'ar') {
    if (seconds < 60) return 'منذ لحظات';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    if (weeks < 5) return `منذ ${weeks} أسبوع`;
    if (months < 12) return `منذ ${months} شهر`;
    return `منذ ${years} سنة`;
  }

  if (language === 'fr') {
    if (seconds < 60) return "À l’instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours} h`;
    if (days < 7) return `Il y a ${days} j`;
    if (weeks < 5) return `Il y a ${weeks} sem.`;
    if (months < 12) return `Il y a ${months} mois`;
    return `Il y a ${years} an`;
  }

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}
