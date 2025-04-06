import { pool } from "@/configs/NilePostgresConfig"

// Добавяне на лайк
export async function POST(request: Request) {
  const { postId, userEmail } = await request.json()

  try {
    // Добавяме лайк, ако не е вече съществуващ (може да добавите и проверка)
    const result = await pool.query(
      `INSERT INTO likes (post_id, user_email)
       VALUES ($1, $2)
       RETURNING id`,
      [postId, userEmail]
    )
    return Response.json({ message: "Liked", likeId: result.rows[0].id })
  } catch (error) {
    console.error("Error adding like", error)
    return Response.json({ error }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("postId")
  const userEmail = searchParams.get("userEmail") // ако идва - проверяваме isLiked

  if (!postId) {
    return Response.json({ error: "Missing postId" }, { status: 400 })
  }

  try {
    // Ако има userEmail => връщаме дали е лайкнат от потребителя
    if (userEmail) {
      const result = await pool.query(
        `SELECT COUNT(*) AS count FROM likes WHERE post_id = $1 AND user_email = $2`,
        [postId, userEmail]
      )

      const isLiked = parseInt(result.rows[0].count, 10) > 0
      return Response.json({ isLiked })
    }

    // Ако няма userEmail => връщаме броя лайкове
    const result = await pool.query(
      `SELECT COUNT(*) AS likeCount FROM likes WHERE post_id = $1`,
      [postId]
    )

    return Response.json({
      likeCount: parseInt(result.rows[0].likecount, 10),
    })
  } catch (error) {
    console.error("Error fetching like info", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Премахване на лайк
export async function DELETE(request: Request) {
  const { postId, userEmail } = await request.json()

  try {
    const result = await pool.query(
      `DELETE FROM likes
       WHERE post_id = $1 AND user_email = $2
       RETURNING id`,
      [postId, userEmail]
    )
    return Response.json({
      message: "Unliked",
      removedLikeId: result.rows[0]?.id,
    })
  } catch (error) {
    console.error("Error removing like", error)
    return Response.json({ error }, { status: 500 })
  }
}
