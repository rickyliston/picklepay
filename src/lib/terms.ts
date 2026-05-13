export interface Term {
  year: number;
  term: number;
  label: string;
  startDate: Date;
  endDate: Date;
}

const TERMS: Term[] = [
  // 2026
  { year: 2026, term: 1, label: 'Term 1, 2026', startDate: new Date(2026, 0, 27), endDate: new Date(2026, 3, 2) },
  { year: 2026, term: 2, label: 'Term 2, 2026', startDate: new Date(2026, 3, 20), endDate: new Date(2026, 5, 26) },
  { year: 2026, term: 3, label: 'Term 3, 2026', startDate: new Date(2026, 6, 13), endDate: new Date(2026, 8, 18) },
  { year: 2026, term: 4, label: 'Term 4, 2026', startDate: new Date(2026, 9, 5), endDate: new Date(2026, 11, 18) },
];

export function getTermForDate(date: Date): Term | null {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  for (const term of TERMS) {
    const start = new Date(term.startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(term.endDate);
    end.setHours(23, 59, 59, 999);
    if (d >= start && d <= end) return term;
  }
  return null;
}

export function getTermKey(term: Term): string {
  return `${term.year}-T${term.term}`;
}

export function getWednesdaysInTerm(term: Term): Date[] {
  const wednesdays: Date[] = [];
  const d = new Date(term.startDate);
  d.setHours(0, 0, 0, 0);

  // Advance to first Wednesday
  while (d.getDay() !== 3) {
    d.setDate(d.getDate() + 1);
  }

  const end = new Date(term.endDate);
  end.setHours(23, 59, 59, 999);

  while (d <= end) {
    wednesdays.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }

  return wednesdays;
}

export function getAllTerms(): Term[] {
  return [...TERMS];
}

export function getCurrentTerm(): Term | null {
  return getTermForDate(new Date());
}

export function isDateInAnyTerm(date: Date): boolean {
  return getTermForDate(date) !== null;
}
