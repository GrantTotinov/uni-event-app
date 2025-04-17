import { client, pool } from "@/configs/NilePostgresConfig"

// Създаване на харесване (при лайк)
export async function POST(request: Request) {
  const body = await request.json()
  console.log("Получени данни:", body)

  if (!body || !body.postId || !body.userEmail) {
    console.error("Липсват задължителни данни:", body)
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  const { postId, userEmail } = body

  const result = await pool.query(
    `INSERT INTO likes (post_id, user_email)
     VALUES ($1, $2)
     RETURNING id`,
    [postId, userEmail]
  )

  return Response.json({ newLikeId: result.rows[0].id })
}

// Извличане на харесвания/статус по postId (и/или userEmail)
export async function GET(request: Request) {
  const url = new URL(request.url)

  if (url.searchParams.has("postId")) {
    const postId = url.searchParams.get("postId")

    // Ако се подаде и userEmail – проверка дали потребителят е харесал поста
    if (url.searchParams.has("userEmail")) {
      const userEmail = url.searchParams.get("userEmail")
      const result = await pool.query(
        `SELECT COUNT(*)::int as count 
         FROM likes 
         WHERE post_id = $1 AND user_email = $2`,
        [postId, userEmail]
      )
      const isLiked = result.rows[0].count > 0
      return Response.json({ isLiked })
    } else {
      // Прочитаме общия брой лайкове и гарантираме, че ако няма данни връщаме 0
      const result = await pool.query(
        `SELECT COUNT(*)::int as likecount 
         FROM likes 
         WHERE post_id = $1`,
        [postId]
      )
      // Използваме "likecount" защото PostgreSQL го връща с малки букви
      const likeCount =
        result.rows[0] && result.rows[0].likecount !== null
          ? parseInt(result.rows[0].likecount, 10)
          : 0
      return Response.json({ likeCount })
    }
  } else {
    return Response.json({ error: "Missing postId parameter" }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  const body = await request.json()
  return Response.json({ message: "PUT not implemented" })
}

export async function DELETE(request: Request) {
  const body = await request.json()
  const { postId, userEmail } = body

  if (!postId || !userEmail) {
    console.error("Липсват задължителни данни за изтриване:", body)
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  const result = await pool.query(
    "DELETE FROM likes WHERE post_id = $1 AND user_email = $2 RETURNING id",
    [postId, userEmail]
  )
  return Response.json({ deletedLikeId: result.rows[0].id })
}
