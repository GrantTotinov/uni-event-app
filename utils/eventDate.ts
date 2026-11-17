// Pure helpers for event dates. No React / Expo imports so they stay unit-testable.
//
// add-event stores event_date as "<weekday>,YYYY-MM-DD" (e.g. "вторник,2025-11-18")
// and event_time as "HH:mm". Older rows may hold a bare "YYYY-MM-DD".

const DAY_MS = 86_400_000

export function eventStart(
  date?: string | null,
  time?: string | null
): Date | null {
  const d = date?.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!d) return null
  const t = time?.match(/(\d{1,2}):(\d{2})/)
  return new Date(+d[1], +d[2] - 1, +d[3], t ? +t[1] : 0, t ? +t[2] : 0)
}

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

/** Whole calendar days from `now` to `start` (negative = past). */
export function daysUntil(start: Date, now = new Date()): number {
  // Math.round absorbs the ±1h DST shift between the two midnights
  return Math.round((startOfDay(start) - startOfDay(now)) / DAY_MS)
}

export type Countdown = {
  label: string
  tone: 'live' | 'soon' | 'later' | 'past'
}

export function countdown(start: Date | null, now = new Date()): Countdown | null {
  if (!start) return null
  const days = daysUntil(start, now)
  if (days < 0) return { label: 'Приключило', tone: 'past' }
  if (days === 0) {
    const mins = Math.round((start.getTime() - now.getTime()) / 60_000)
    if (mins <= 0) return { label: 'Днес', tone: 'live' }
    if (mins < 60) return { label: `След ${mins} мин`, tone: 'live' }
    return { label: `Днес · ${pad(start.getHours())}:${pad(start.getMinutes())}`, tone: 'live' }
  }
  if (days === 1) return { label: 'Утре', tone: 'soon' }
  if (days < 7) return { label: `След ${days} дни`, tone: 'soon' }
  return { label: `След ${days} дни`, tone: 'later' }
}

const pad = (n: number) => String(n).padStart(2, '0')

const BG_MONTHS = [
  'януари', 'февруари', 'март', 'април', 'май', 'юни',
  'юли', 'август', 'септември', 'октомври', 'ноември', 'декември',
]
const BG_DAYS = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

/** "вт, 18 ноември · 14:30" — falls back to the raw strings if unparsable. */
export function formatEventDate(
  date?: string | null,
  time?: string | null
): string {
  const start = eventStart(date, time)
  if (!start) return [date, time].filter(Boolean).join(' · ')
  const day = `${BG_DAYS[start.getDay()]}, ${start.getDate()} ${BG_MONTHS[start.getMonth()]}`
  return time ? `${day} · ${pad(start.getHours())}:${pad(start.getMinutes())}` : day
}

const icsStamp = (d: Date) =>
  d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const icsEscape = (s?: string | null) =>
  (s ?? '').replace(/[\\;,]/g, (m) => '\\' + m).replace(/\r?\n/g, '\\n')

/** RFC 5545 calendar entry with a 1h reminder. */
export function buildIcs(e: {
  id: number | string
  name: string
  location?: string | null
  details?: string | null
  start: Date
}): string {
  // ponytail: events have no end time in the DB, assume 2h; add an end column if organisers need it
  const end = new Date(e.start.getTime() + 2 * 3_600_000)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AcademiX//Events//BG',
    'BEGIN:VEVENT',
    `UID:academix-event-${e.id}@academix`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(e.start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${icsEscape(e.name)}`,
    `LOCATION:${icsEscape(e.location)}`,
    `DESCRIPTION:${icsEscape(e.details)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsEscape(e.name)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
