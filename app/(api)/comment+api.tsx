import { pool } from "@/configs/NilePostgresConfig"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("postId")
  if (!postId) {
    return Response.json({ error: "Липсва параметър postId" }, { status: 400 })
  }

  try {
    const result = await pool.query(
      `SELECT comments.id, comments.comment, comments.created_at, users.name, users.image
         FROM comments
         INNER JOIN users ON comments.user_email = users.email
         WHERE comments.post_id = $1
         ORDER BY comments.created_at DESC`,
      [postId]
    )
    return Response.json(result.rows)
  } catch (error) {
    console.error("Error fetching comments", error)
    return Response.json(
      { error: "Възникна грешка при извличането на коментари" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const { postId, userEmail, comment } = await request.json()
  if (!postId || !userEmail || !comment) {
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  try {
    const result = await pool.query(
      `INSERT INTO comments (post_id, user_email, comment) 
       VALUES ($1, $2, $3) 
       RETURNING id, created_at`,
      [postId, userEmail, comment]
    )
    return Response.json({
      message: "Коментарът е добавен успешно",
      commentId: result.rows[0].id,
    })
  } catch (error) {
    console.error("Error adding comment", error)
    return Response.json(
      { error: "Възникна грешка при добавяне на коментара" },
      { status: 500 }
    )
  }
}
