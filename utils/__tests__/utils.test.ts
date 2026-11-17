import { buildIcs, countdown, daysUntil, eventStart, formatEventDate } from '../eventDate'
import { BADGES, levelFor, pointsFor } from '../pulse'
import { roleColor, roleLabel } from '../roles'

describe('eventDate', () => {
  const now = new Date(2025, 10, 18, 10, 0) // вт, 18 ноември 2025, 10:00

  it('parses the "<weekday>,YYYY-MM-DD" format add-event stores', () => {
    expect(eventStart('вторник,2025-11-18', '14:30')).toEqual(new Date(2025, 10, 18, 14, 30))
    expect(eventStart('2025-11-18', null)).toEqual(new Date(2025, 10, 18))
    expect(eventStart('скоро', '10:00')).toBeNull()
  })

  it('counts calendar days, not 24h blocks', () => {
    expect(daysUntil(new Date(2025, 10, 19, 0, 5), new Date(2025, 10, 18, 23, 55))).toBe(1)
    expect(daysUntil(new Date(2025, 10, 17, 23, 0), now)).toBe(-1)
  })

  it('labels the countdown', () => {
    expect(countdown(new Date(2025, 10, 18, 10, 30), now)).toEqual({ label: 'След 30 мин', tone: 'live' })
    expect(countdown(new Date(2025, 10, 18, 14, 0), now)).toEqual({ label: 'Днес · 14:00', tone: 'live' })
    expect(countdown(new Date(2025, 10, 19, 9, 0), now)?.label).toBe('Утре')
    expect(countdown(new Date(2025, 10, 21), now)).toEqual({ label: 'След 3 дни', tone: 'soon' })
    expect(countdown(new Date(2025, 11, 1), now)?.tone).toBe('later')
    expect(countdown(new Date(2025, 10, 10), now)?.tone).toBe('past')
    expect(countdown(null, now)).toBeNull()
  })

  it('formats dates in Bulgarian and falls back to raw text', () => {
    expect(formatEventDate('вторник,2025-11-18', '9:05')).toBe('вт, 18 ноември · 09:05')
    expect(formatEventDate('2025-01-04', '')).toBe('сб, 4 януари')
    expect(formatEventDate('неясно', '10:00')).toBe('неясно · 10:00')
  })

  it('builds a valid, escaped ICS entry', () => {
    const ics = buildIcs({
      id: 7,
      name: 'Хакатон; ден 1, финал',
      location: 'Зала 2',
      details: 'ред 1\nред 2',
      start: new Date(Date.UTC(2025, 10, 18, 12, 0)),
    })
    expect(ics).toContain('DTSTART:20251118T120000Z')
    expect(ics).toContain('DTEND:20251118T140000Z')
    expect(ics).toContain('SUMMARY:Хакатон\\; ден 1\\, финал')
    expect(ics).toContain('DESCRIPTION:ред 1\\nред 2')
    expect(ics.split('\r\n')[0]).toBe('BEGIN:VCALENDAR')
    expect(ics.endsWith('END:VCALENDAR')).toBe(true)
  })
})

describe('pulse', () => {
  const zero = { posts: 0, comments: 0, likes: 0, events: 0, followers: 0 }

  it('weights activity', () => {
    expect(pointsFor(zero)).toBe(0)
    expect(pointsFor({ posts: 2, comments: 3, likes: 4, events: 1, followers: 5 })).toBe(20 + 9 + 8 + 5 + 10)
  })

  it('maps points to academic levels with progress', () => {
    expect(levelFor(0)).toMatchObject({ title: 'Първокурсник', toNext: 30, progress: 0 })
    expect(levelFor(30).title).toBe('Второкурсник')
    expect(levelFor(120)).toMatchObject({ title: 'Бакалавър', toNext: 40, progress: 0.5 })
    expect(levelFor(9999)).toMatchObject({ title: 'Професор', toNext: 0, progress: 1, next: undefined })
  })

  it('awards badges by thresholds', () => {
    const earned = (s: typeof zero) => BADGES.filter((b) => b.earned(s)).map((b) => b.id)
    expect(earned(zero)).toEqual([])
    expect(earned({ ...zero, posts: 1, events: 5 })).toEqual(['first-post', 'regular'])
  })
})

describe('roles', () => {
  it('defaults unknown roles to student', () => {
    expect(roleLabel('teacher')).toBe('Преподавател')
    expect(roleLabel('user')).toBe('Студент')
    expect(roleLabel(undefined)).toBe('Студент')
    expect(roleColor('student', '#123')).toBe('#123')
    expect(roleColor('systemadmin', '#123')).toBe('#dc3545')
  })
})
