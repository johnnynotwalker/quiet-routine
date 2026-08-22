export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function formatMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function formatDurationBetween(startTime: string, endTime: string): string {
  let start = parseTimeToMinutes(startTime);
  let end = parseTimeToMinutes(endTime);
  if (end <= start) end += 24 * 60;
  return formatMinutes(end - start);
}

export function isTimeWithinRange(now: Date, startTime: string, endTime: string): boolean {
  const current = now.getHours() * 60 + now.getMinutes();
  const start = parseTimeToMinutes(startTime);
  let end = parseTimeToMinutes(endTime);

  if (end <= start) {
    return current >= start || current < end;
  }

  return current >= start && current < end;
}

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
