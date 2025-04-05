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
