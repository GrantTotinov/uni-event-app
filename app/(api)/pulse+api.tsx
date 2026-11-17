import { pool } from '@/configs/NilePostgresConfig'
import { POINTS } from '@/utils/pulse'

// "Пулс на кампуса"
//  GET ?email=...  → статистика, точки и място в класацията за един потребител
//  GET ?top=10     → класация (само потребители с точки)
// Тежестите идват от utils/pulse.ts ($1..$5), за да съвпадат с UI.
const RANKED = `
  WITH p AS (SELECT createdby AS email, COUNT(*)::int AS c FROM post GROUP BY createdby),
  cm AS (SELECT user_email AS email, COUNT(*)::int AS c FROM comments GROUP BY user_email),
  lk AS (
    SELECT post.createdby AS email, COUNT(*)::int AS c
    FROM likes JOIN post ON post.id = likes.post_id
    WHERE likes.user_email <> post.createdby
    GROUP BY post.createdby
  ),
  ev AS (SELECT user_email AS email, COUNT(*)::int AS c FROM event_registration GROUP BY user_email),
  fl AS (SELECT following_email AS email, COUNT(*)::int AS c FROM user_followers GROUP BY following_email),
  scored AS (
    SELECT u.email, u.name, u.image, u.role,
      COALESCE(p.c, 0) AS posts,
      COALESCE(cm.c, 0) AS comments,
      COALESCE(lk.c, 0) AS likes,
      COALESCE(ev.c, 0) AS events,
      COALESCE(fl.c, 0) AS followers
    FROM users u
    LEFT JOIN p ON p.email = u.email
    LEFT JOIN cm ON cm.email = u.email
    LEFT JOIN lk ON lk.email = u.email
    LEFT JOIN ev ON ev.email = u.email
    LEFT JOIN fl ON fl.email = u.email
  ),
  pointed AS (
    SELECT *, (posts * $1 + comments * $2 + likes * $3 + events * $4 + followers * $5)::int AS points
    FROM scored
  )
  SELECT *,
    RANK() OVER (ORDER BY points DESC)::int AS rank,
    COUNT(*) OVER ()::int AS total
  FROM pointed`

const WEIGHTS = [POINTS.posts, POINTS.comments, POINTS.likes, POINTS.events, POINTS.followers]

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  const top = url.searchParams.get('top')

  try {
    if (email) {
      const result = await pool.query(
        `SELECT * FROM (${RANKED}) r WHERE r.email = $6`,
        [...WEIGHTS, email]
      )
      return Response.json(result.rows[0] ?? null)
    }

    const limit = Math.max(1, Math.min(50, Number(top) || 10))
    const result = await pool.query(
      `SELECT email, name, image, role, points, rank
       FROM (${RANKED}) r
       WHERE r.points > 0
       ORDER BY r.points DESC, r.name ASC
       LIMIT $6`,
      [...WEIGHTS, limit]
    )
    return Response.json(result.rows)
  } catch (error) {
    console.error('Грешка при изчисляване на пулса:', error)
    return Response.json(
      { error: 'Грешка при изчисляване на активността' },
      { status: 500 }
    )
  }
}
