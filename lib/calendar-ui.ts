export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day };
}

export function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
}

export function todayParts(): { year: number; month: number; day: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export type WeekDay = {
  iso: string;
  weekday: string;
  day: number;
  isToday: boolean;
  /** True when the day is before today — schedule adds are not allowed. */
  isPast: boolean;
};

export function buildWeekStrip(centerIso: string, span = 14): WeekDay[] {
  const center = parseIsoDate(centerIso);
  const centerDate = new Date(center.year, center.month - 1, center.day);
  const today = todayParts();
  const todayIso = toIsoDate(today.year, today.month, today.day);
  const days: WeekDay[] = [];

  for (let offset = -Math.floor(span / 2); offset <= Math.floor(span / 2); offset++) {
    const date = new Date(centerDate);
    date.setDate(centerDate.getDate() + offset);
    const iso = toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    days.push({
      iso,
      weekday: date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3),
      day: date.getDate(),
      isToday: iso === todayIso,
      isPast: iso < todayIso,
    });
  }

  return days;
}

export type CalendarCell = {
  iso: string;
  day: number;
  inMonth: boolean;
};

export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < firstWeekday; i++) {
    cells.push({ iso: '', day: 0, inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ iso: toIsoDate(year, month, day), day, inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ iso: '', day: 0, inMonth: false });
  }

  return cells;
}
