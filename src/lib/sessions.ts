// Session date utilities
// First session: January 28, 2026 (Session 1)
// Sessions happen every Wednesday, incrementing weekly

const FIRST_SESSION_DATE = new Date(2026, 0, 28); // Jan 28, 2026

export function getSessionNumber(date: Date): number {
  const diffMs = date.getTime() - FIRST_SESSION_DATE.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  return diffWeeks + 1;
}

export function getSessionDate(sessionNumber: number): Date {
  const date = new Date(FIRST_SESSION_DATE);
  date.setDate(date.getDate() + (sessionNumber - 1) * 7);
  return date;
}

export function getNextWednesday(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const daysUntilWed = dayOfWeek <= 3 ? 3 - dayOfWeek : 10 - dayOfWeek;

  if (dayOfWeek === 3) {
    // It's Wednesday - return today if before end of day
    return d;
  }

  d.setDate(d.getDate() + daysUntilWed);
  return d;
}

export function getCurrentOrNextSession(from: Date = new Date()): { date: Date; sessionNumber: number } {
  const nextWed = getNextWednesday(from);
  const sessionNumber = getSessionNumber(nextWed);
  return { date: nextWed, sessionNumber };
}

export function formatSessionDate(date: Date): string {
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getSessionId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSessionInPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionDate = new Date(date);
  sessionDate.setHours(0, 0, 0, 0);
  return sessionDate < today;
}

export function isSessionToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sessionDate = new Date(date);
  sessionDate.setHours(0, 0, 0, 0);
  return sessionDate.getTime() === today.getTime();
}
