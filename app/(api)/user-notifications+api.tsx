import { pool } from '@/configs/NilePostgresConfig'

// Известия: изчисляват се от съществуващите таблици, без отделна таблица.
//  comment   – някой коментира ваша публикация
//  reply     – някой отговори на ваш коментар
//  follow    – нов последовател
//  club_post – нова публикация в група, която следвате (последните 14 дни)
//  event_soon – събитие, за което сте записани, е до 2 дни
//
// "Непрочетено" се пази на клиента (lastSeen в AsyncStorage) — няма writes тук.
const EVENT_DAY = `to_date(substring(e.event_date::text from '[0-9]{4}-[0-9]{2}-[0-9]{2}'), 'YYYY-MM-DD')`
const TODAY = `(now() AT TIME ZONE 'Europe/Sofia')::date`

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 50)))

  if (!email) {
    return Response.json({ error: 'email е задължителен' }, { status: 400 })
  }

  try {
    const result = await pool.query(
      `SELECT * FROM (
         SELECT 'comment' AS type, 'c' || c.id AS key,
                u.name AS actor_name, u.image AS actor_image, u.email AS actor_email,
                LEFT(c.comment, 140) AS preview, NULL::text AS club_name,
                p.id AS post_id, NULL::int AS event_id, NULL::text AS event_date, NULL::text AS event_time,
                c.created_at::timestamptz AS created_at
         FROM comments c
         JOIN post p ON p.id = c.post_id
         JOIN users u ON u.email = c.user_email
         WHERE p.createdby = $1 AND c.user_email <> $1 AND c.parent_id IS NULL

         UNION ALL
         SELECT 'reply', 'r' || c.id,
                u.name, u.image, u.email,
                LEFT(c.comment, 140), NULL,
                c.post_id, NULL, NULL, NULL,
                c.created_at::timestamptz
         FROM comments c
         JOIN comments parent ON parent.id = c.parent_id
         JOIN users u ON u.email = c.user_email
         WHERE parent.user_email = $1 AND c.user_email <> $1

         UNION ALL
         SELECT 'follow', 'f' || uf.follower_email,
                u.name, u.image, u.email,
                NULL, NULL,
                NULL, NULL, NULL, NULL,
                uf.created_at::timestamptz
         FROM user_followers uf
         JOIN users u ON u.email = uf.follower_email
         WHERE uf.following_email = $1

         UNION ALL
         SELECT 'club_post', 'p' || p.id,
                u.name, u.image, u.email,
                LEFT(p.context, 140), clubs.name,
                p.id, NULL, NULL, NULL,
                p.createdon::timestamptz
         FROM post p
         JOIN clubfollowers cf ON cf.club_id = p.club AND cf.u_email = $1
         JOIN clubs ON clubs.id = p.club
         JOIN users u ON u.email = p.createdby
         WHERE p.createdby <> $1 AND p.createdon > now() - interval '14 days'

         UNION ALL
         -- actor_* = събитието (име, банер, организатор)
         SELECT 'event_soon', 'e' || e.id,
                e.name, e.bannerurl, e.createdby,
                e.location, NULL,
                NULL, e.id, e.event_date::text, e.event_time::text,
                -- "появява се" 2 дни преди събитието
                (${EVENT_DAY} - 2)::timestamptz
         FROM events e
         JOIN event_registration er ON er.event_id = e.id AND er.user_email = $1
         WHERE ${EVENT_DAY} BETWEEN ${TODAY} AND ${TODAY} + 2
       ) n
       ORDER BY created_at DESC NULLS LAST
       LIMIT $2`,
      [email, limit]
    )
    return Response.json(result.rows)
  } catch (error) {
    console.error('Грешка при извличане на известия:', error)
    return Response.json(
      { error: 'Грешка при извличане на известия' },
      { status: 500 }
    )
  }
}
