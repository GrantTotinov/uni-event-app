import { pool } from "@/configs/NilePostgresConfig"
import { isAdmin } from "@/context/AuthContext"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("postId")
  const parentId = searchParams.get("parentId") // Нов параметър за replies

  if (!postId) {
    return Response.json({ error: "Липсва параметър postId" }, { status: 400 })
  }

  try {
    const query = parentId
      ? `SELECT comments.id, comments.comment, comments.created_at, 
                comments.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sofia' AS created_at_local, 
                users.name, users.image, users.email AS user_email
         FROM comments
         INNER JOIN users ON comments.user_email = users.email
         WHERE comments.post_id = $1 AND comments.parent_id = $2
         ORDER BY comments.created_at ASC`
      : `SELECT comments.id, comments.comment, comments.created_at, 
                comments.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sofia' AS created_at_local, 
                users.name, users.image, users.email AS user_email
         FROM comments
         INNER JOIN users ON comments.user_email = users.email
         WHERE comments.post_id = $1 AND comments.parent_id IS NULL
         ORDER BY comments.created_at DESC`

    const params = parentId ? [postId, parentId] : [postId]

    const result = await pool.query(query, params)

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
  const { postId, userEmail, comment, parentId } = await request.json()
  console.log("Received data:", { postId, userEmail, comment, parentId })

  if (!postId || !userEmail || !comment) {
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  try {
    const result = await pool.query(
      `INSERT INTO comments (post_id, user_email, comment, parent_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, created_at`,
      [postId, userEmail, comment, parentId || null]
    )
    console.log("Comment added successfully:", result.rows[0])
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

export async function PUT(request: Request) {
  const { commentId, userEmail, newComment } = await request.json()

  if (!commentId || !userEmail || !newComment) {
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  try {
    // Проверка дали коментарът съществува и кой го е създал
    const commentQuery = await pool.query(
      "SELECT user_email FROM comments WHERE id = $1",
      [commentId]
    )

    if (commentQuery.rows.length === 0) {
      return Response.json(
        { error: "Коментарът не съществува" },
        { status: 404 }
      )
    }

    const commentAuthor = commentQuery.rows[0].user_email

    // Проверка дали потребителят е автор на коментара
    if (userEmail !== commentAuthor) {
      return Response.json(
        { error: "Нямате права да редактирате този коментар" },
        { status: 403 }
      )
    }

    // Актуализиране на коментара
    const updateRes = await pool.query(
      "UPDATE comments SET comment = $1 WHERE id = $2 RETURNING id, comment",
      [newComment, commentId]
    )

    return Response.json({
      updatedCommentId: updateRes.rows[0].id,
      updatedComment: updateRes.rows[0].comment,
    })
  } catch (error) {
    console.error("Грешка при редактиране на коментара:", error)
    return Response.json(
      { error: "Грешка при редактиране на коментара" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const { commentId, userEmail, postAuthorEmail } = await request.json()

  if (!commentId || !userEmail) {
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  try {
    // Проверка за ролята на потребителя
    const userQuery = await pool.query(
      "SELECT role FROM users WHERE email = $1",
      [userEmail]
    )

    if (userQuery.rows.length === 0) {
      return Response.json(
        { error: "Потребителят не съществува" },
        { status: 404 }
      )
    }

    const userRole = userQuery.rows[0].role

    // Проверка дали коментарът съществува и кой го е създал
    const commentQuery = await pool.query(
      "SELECT user_email FROM comments WHERE id = $1",
      [commentId]
    )

    if (commentQuery.rows.length === 0) {
      return Response.json(
        { error: "Коментарът не съществува" },
        { status: 404 }
      )
    }

    const commentAuthor = commentQuery.rows[0].user_email

    // Проверка за права: администратор, автор на коментара или автор на поста
    if (
      !isAdmin(userRole) &&
      userEmail !== commentAuthor &&
      userEmail !== postAuthorEmail
    ) {
      return Response.json(
        { error: "Нямате права да изтриете този коментар" },
        { status: 403 }
      )
    }

    // Изтриване на коментара
    const deleteRes = await pool.query(
      "DELETE FROM comments WHERE id = $1 RETURNING id",
      [commentId]
    )

    return Response.json({ deletedCommentId: deleteRes.rows[0].id })
  } catch (error) {
    console.error("Грешка при изтриване на коментара:", error)
    return Response.json(
      { error: "Грешка при изтриване на коментара" },
      { status: 500 }
    )
  }
}
