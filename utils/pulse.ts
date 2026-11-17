// "Пулс на кампуса" — activity points, academic levels and badges.
// Pure module: the API imports POINTS so SQL ranking and UI never drift.

export type PulseStats = {
  posts: number
  comments: number
  likes: number // likes received on own posts
  events: number // event registrations
  followers: number
}

export const POINTS: Readonly<PulseStats> = {
  posts: 10,
  comments: 3,
  likes: 2,
  events: 5,
  followers: 2,
}

export const LEVELS = [
  { min: 0, title: 'Първокурсник', icon: 'school-outline' },
  { min: 30, title: 'Второкурсник', icon: 'book-open-variant' },
  { min: 80, title: 'Бакалавър', icon: 'certificate' },
  { min: 160, title: 'Магистър', icon: 'medal' },
  { min: 300, title: 'Докторант', icon: 'flask' },
  { min: 500, title: 'Професор', icon: 'crown' },
] as const

export type Level = (typeof LEVELS)[number]

export function pointsFor(s: PulseStats): number {
  return (Object.keys(POINTS) as (keyof PulseStats)[]).reduce(
    (sum, k) => sum + (s[k] || 0) * POINTS[k],
    0
  )
}

export function levelFor(points: number) {
  let i = 0
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].min) i++
  const level = LEVELS[i]
  const next: Level | undefined = LEVELS[i + 1]
  return {
    ...level,
    index: i,
    next,
    toNext: next ? next.min - points : 0,
    progress: next ? (points - level.min) / (next.min - level.min) : 1,
  }
}

export const BADGES: {
  id: string
  title: string
  hint: string
  icon: string
  earned: (s: PulseStats) => boolean
}[] = [
  { id: 'first-post', title: 'Първа дума', hint: 'Първа публикация', icon: 'feather', earned: (s) => s.posts >= 1 },
  { id: 'voice', title: 'Гласът на кампуса', hint: '10 публикации', icon: 'bullhorn', earned: (s) => s.posts >= 10 },
  { id: 'debater', title: 'Дискутант', hint: '25 коментара', icon: 'forum', earned: (s) => s.comments >= 25 },
  { id: 'regular', title: 'Редовен посетител', hint: '5 събития', icon: 'ticket-confirmation', earned: (s) => s.events >= 5 },
  { id: 'magnet', title: 'Магнит', hint: '10 последователи', icon: 'magnet', earned: (s) => s.followers >= 10 },
  { id: 'loved', title: 'Любимец', hint: '50 харесвания', icon: 'heart-multiple', earned: (s) => s.likes >= 50 },
]
