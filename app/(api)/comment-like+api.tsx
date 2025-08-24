import { pool } from '@/configs/NilePostgresConfig'

// Създаване на харесване на коментар
export async function POST(request: Request) {
  try {
    const { commentId, userEmail } = await request.json()
    if (!commentId || !userEmail) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }

    // Проверяваме дали вече съществува харесване
    const existingLike = await pool.query(
      'SELECT id FROM comment_likes WHERE comment_id = $1 AND user_email = $2',
      [commentId, userEmail]
    )

    if (existingLike.rows.length > 0) {
      return Response.json(
        { error: 'Коментарът вече е харесан' },
        { status: 409 }
      )
    }

    const result = await pool.query(
      `INSERT INTO comment_likes (comment_id, user_email) VALUES ($1, $2) RETURNING id`,
      [commentId, userEmail]
    )

    // Връщаме новия брой лайкове за кеша
    const countResult = await pool.query(
      `SELECT COUNT(*) as like_count FROM comment_likes WHERE comment_id = $1`,
      [commentId]
    )

    return Response.json({
      newLikeId: result.rows[0].id,
      newLikeCount: parseInt(countResult.rows[0].like_count),
    })
  } catch (error) {
    console.error('POST /comment-like error:', error)
    return Response.json(
      { error: 'Грешка при лайк на коментар' },
      { status: 500 }
    )
  }
}

// Извличане на лайкове за коментари с оптимизация за кеширане
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const commentId = url.searchParams.get('commentId')
    const userEmail = url.searchParams.get('userEmail')
    const commentIdsParam = url.searchParams.get('commentIds')
    const counts = url.searchParams.get('counts')

    // Bulk like counts for multiple comments
    if (commentIdsParam && counts === 'true') {
      const ids = commentIdsParam
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((x) => Number.isFinite(x))

      if (ids.length === 0) return Response.json({ likeCounts: {} })

      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',')
      const result = await pool.query(
        `SELECT comment_id, COUNT(*)::integer as count FROM comment_likes WHERE comment_id IN (${placeholders}) GROUP BY comment_id`,
        ids
      )

      const likeCounts: { [key: number]: number } = {}
      result.rows.forEach((row) => {
        likeCounts[row.comment_id] = row.count
      })

      return Response.json({ likeCounts })
    }

    // Bulk liked comment IDs for a user
    if (userEmail && commentIdsParam) {
      const ids = commentIdsParam
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((x) => Number.isFinite(x))
      if (ids.length === 0) return Response.json({ likedCommentIds: [] })

      const placeholders = ids.map((_, i) => `$${i + 2}`).join(',')
      const result = await pool.query(
        `SELECT comment_id FROM comment_likes WHERE user_email = $1 AND comment_id IN (${placeholders})`,
        [userEmail, ...ids]
      )
      const likedCommentIds = result.rows.map((r) => r.comment_id)
      return Response.json({ likedCommentIds })
    }

    // All liked comments for a user
    if (userEmail && !commentId) {
      const result = await pool.query(
        `SELECT comment_id FROM comment_likes WHERE user_email = $1`,
        [userEmail]
      )
      const likedCommentIds = result.rows.map((r) => r.comment_id)
      return Response.json({ likedCommentIds })
    }

    // Check if specific comment is liked by user
    if (commentId && userEmail) {
      const result = await pool.query(
        `SELECT EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_email = $2) as is_liked`,
        [commentId, userEmail]
      )
      return Response.json({ isLiked: result.rows[0].is_liked })
    }

    // Get like count for specific comment
    if (commentId && !userEmail) {
      const result = await pool.query(
        `SELECT COUNT(*) as like_count FROM comment_likes WHERE comment_id = $1`,
        [commentId]
      )
      return Response.json({ likeCount: parseInt(result.rows[0].like_count) })
    }

    return Response.json({ error: 'Missing parameters' }, { status: 400 })
  } catch (error) {
    console.error('GET /comment-like error:', error)
    return Response.json(
      { error: 'Грешка при извличане на лайкове за коментари' },
      { status: 500 }
    )
  }
}

export async function PUT(_request: Request) {
  return Response.json({ message: 'PUT not implemented' })
}

export async function DELETE(request: Request) {
  try {
    const { commentId, userEmail } = await request.json()
    if (!commentId || !userEmail) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }
    const result = await pool.query(
      `DELETE FROM comment_likes WHERE comment_id = $1 AND user_email = $2 RETURNING id`,
      [commentId, userEmail]
    )

    // Връщаме новия брой лайкове за кеша
    const countResult = await pool.query(
      `SELECT COUNT(*) as like_count FROM comment_likes WHERE comment_id = $1`,
      [commentId]
    )

    return Response.json({
      deletedLikeId: result.rows[0]?.id,
      newLikeCount: parseInt(countResult.rows[0].like_count),
    })
  } catch (error) {
    console.error('DELETE /comment-like error:', error)
    return Response.json(
      { error: 'Грешка при изтриване на лайк от коментар' },
      { status: 500 }
    )
  }
}
