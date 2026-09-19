export function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(isoString?: string | null): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch (err) {
    return isoString;
  }
}

export function getHealthBadgeColor(rating?: string): { bg: string; text: string; border: string } {
  switch (rating) {
    case 'EXCELLENT':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'GOOD':
      return { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' };
    case 'MODERATE':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
    case 'POOR':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' };
    case 'CRITICAL':
      return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' };
  }
}

export function getSeverityBadgeColor(severity?: string): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'CRITICAL':
      return { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/40' };
    case 'HIGH':
      return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/40' };
    case 'MEDIUM':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/40' };
    case 'LOW':
      return { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/40' };
    default:
      return { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/40' };
  }
}
