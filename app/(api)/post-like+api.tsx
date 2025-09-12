import { pool } from '@/configs/NilePostgresConfig'

const userLikeAttempts = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 минута
const MAX_LIKES_PER_MINUTE = 10

function checkRateLimit(userEmail: string): boolean {
  const now = Date.now()
  const userAttempts = userLikeAttempts.get(userEmail) || []

  // Премахни стари опити
  const recentAttempts = userAttempts.filter(
    (time) => now - time < RATE_LIMIT_WINDOW
  )

  if (recentAttempts.length >= MAX_LIKES_PER_MINUTE) {
    return false
  }

  // Добави текущия опит
  recentAttempts.push(now)
  userLikeAttempts.set(userEmail, recentAttempts)

  return true
}

// Създаване на харесване
export async function POST(request: Request) {
  try {
    const { postId, userEmail } = await request.json()
    if (!postId || !userEmail) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }

    // ДОБАВЕНО: Rate limiting проверка
    if (!checkRateLimit(userEmail)) {
      return Response.json(
        { error: 'Твърде много опити. Опитайте отново по-късно.' },
        { status: 429 }
      )
    }

    // Проверка дали вече съществува лайк
    const existingLike = await pool.query(
      `SELECT id FROM likes WHERE post_id = $1 AND user_email = $2`,
      [postId, userEmail]
    )

    if (existingLike.rows.length > 0) {
      return Response.json(
        { error: 'Вече сте харесали тази публикация' },
        { status: 409 }
      )
    }

    const result = await pool.query(
      `INSERT INTO likes (post_id, user_email) VALUES ($1, $2) RETURNING id`,
      [postId, userEmail]
    )
    return Response.json({ newLikeId: result.rows[0].id })
  } catch (error) {
    console.error('POST /post-like error:', error)
    return Response.json({ error: 'Грешка при лайк' }, { status: 500 })
  }
}

// Извличане:
// - ?postId=ID                -> { likeCount } или { isLiked }
// - ?userEmail=...&postIds=1,2 -> { likedPostIds: number[] }
// - ?userEmail=...             -> { likedPostIds: number[] }
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const postId = url.searchParams.get('postId')
    const userEmail = url.searchParams.get('userEmail')
    const postIdsParam = url.searchParams.get('postIds')

    if (userEmail && postIdsParam) {
      const ids = postIdsParam
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((x) => Number.isFinite(x))
      if (ids.length === 0) return Response.json({ likedPostIds: [] })

      // Плейсхолдъри $1..$N
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(',')
      const result = await pool.query(
        `SELECT post_id FROM likes WHERE user_email = $1 AND post_id IN (${placeholders})`,
        [userEmail, ...ids]
      )
      const likedPostIds = result.rows.map((r) => r.post_id)
      return Response.json({ likedPostIds })
    }

    if (userEmail && !postId) {
      const result = await pool.query(
        `SELECT post_id FROM likes WHERE user_email = $1`,
        [userEmail]
      )
      const likedPostIds = result.rows.map((r) => r.post_id)
      return Response.json({ likedPostIds })
    }

    if (postId) {
      if (userEmail) {
        const result = await pool.query(
          `SELECT COUNT(*)::int AS count FROM likes WHERE post_id = $1 AND user_email = $2`,
          [postId, userEmail]
        )
        return Response.json({ isLiked: result.rows[0].count > 0 })
      } else {
        const result = await pool.query(
          `SELECT COUNT(*)::int AS likecount FROM likes WHERE post_id = $1`,
          [postId]
        )
        const likeCount = result.rows[0]?.likecount ?? 0
        return Response.json({ likeCount })
      }
    }

    return Response.json({ error: 'Missing parameters' }, { status: 400 })
  } catch (error) {
    console.error('GET /post-like error:', error)
    return Response.json(
      { error: 'Грешка при извличане на лайкове' },
      { status: 500 }
    )
  }
}

export async function PUT(_request: Request) {
  return Response.json({ message: 'PUT not implemented' })
}

export async function DELETE(request: Request) {
  try {
    const { postId, userEmail } = await request.json()
    if (!postId || !userEmail) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }

    // ДОБАВЕНО: Rate limiting проверка
    if (!checkRateLimit(userEmail)) {
      return Response.json(
        { error: 'Твърде много опити. Опитайте отново по-късно.' },
        { status: 429 }
      )
    }

    const result = await pool.query(
      `DELETE FROM likes WHERE post_id = $1 AND user_email = $2 RETURNING id`,
      [postId, userEmail]
    )
    return Response.json({ deletedLikeId: result.rows[0]?.id })
  } catch (error) {
    console.error('DELETE /post-like error:', error)
    return Response.json(
      { error: 'Грешка при изтриване на лайк' },
      { status: 500 }
    )
  }
}
