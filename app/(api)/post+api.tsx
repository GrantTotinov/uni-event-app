import { pool } from "@/configs/NilePostgresConfig"
import { isAdmin } from "@/context/AuthContext"

// Създаване на нов пост
export async function POST(request: Request) {
  const body = await request.json()
  console.log("Получени данни:", body)

  if (!body || !body.content || !body.email) {
    console.error("Липсват задължителни данни:", body)
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  const { content, imageUrl, visibleIn, email, isUhtRelated } = body

  const result = await pool.query(
    `INSERT INTO post (context, imageurl, createdby, club, is_uht_related)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [content, imageUrl, email, visibleIn, isUhtRelated || false]
  )

  return Response.json({ newPostId: result.rows[0].id })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const club = url.searchParams.get("club")
  const u_email = url.searchParams.get("u_email")
  const orderField = url.searchParams.get("orderField") || "post.createdon"

  let query = `
    SELECT 
      post.id as post_id, 
      post.context, 
      post.imageurl, 
      post.createdby,
      post.club,
      post.is_uht_related,
      post.createdon,
      post.createdon AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sofia' AS createdon_local,
      users.name,
      users.image,
      users.role,
      COALESCE(like_count.count, 0)::integer as like_count,
      COALESCE(comment_count.count, 0)::integer as comment_count
    FROM post
    INNER JOIN users ON post.createdby = users.email
    LEFT JOIN (
      SELECT post_id, COUNT(*)::integer as count 
      FROM likes 
      GROUP BY post_id
    ) like_count ON post.id = like_count.post_id
    LEFT JOIN (
      SELECT post_id, COUNT(*)::integer as count 
      FROM comments 
      WHERE parent_id IS NULL
      GROUP BY post_id
    ) comment_count ON post.id = comment_count.post_id
  `

  const params: any[] = []
  const conditions: string[] = []

  if (club) {
    conditions.push(`post.club = $${params.length + 1}`)
    params.push(club)
  }

  if (u_email) {
    conditions.push(`post.club IN (
      SELECT club_id FROM clubfollowers WHERE u_email = $${params.length + 1}
    )`)
    params.push(u_email)
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(" AND ")}`
  }

  // Промяна тук: използваме 'like_count' вместо 'like_count.count'
  const finalOrderField =
    orderField === "like_count.count" ? "like_count" : orderField
  query += ` ORDER BY ${finalOrderField} DESC`

  const result = await pool.query(query, params)
  return Response.json(result.rows)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { postId, userEmail, content, imageUrl, isUhtRelated } = body

  if (
    !postId ||
    !userEmail ||
    (!content && !imageUrl && isUhtRelated === undefined)
  ) {
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  try {
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

    const postQuery = await pool.query(
      "SELECT createdby FROM post WHERE id = $1",
      [postId]
    )
    if (postQuery.rows.length === 0) {
      return Response.json(
        { error: "Публикацията не съществува" },
        { status: 404 }
      )
    }
    const postAuthor = postQuery.rows[0].createdby

    if (!isAdmin(userRole) && postAuthor !== userEmail) {
      return Response.json(
        { error: "Нямате права да редактирате тази публикация" },
        { status: 403 }
      )
    }

    const updateFields = []
    const updateValues = []
    let parameterIdx = 1

    if (content) {
      updateFields.push(`context = $${parameterIdx++}`)
      updateValues.push(content)
    }
    if (imageUrl) {
      updateFields.push(`imageurl = $${parameterIdx++}`)
      updateValues.push(imageUrl)
    }
    if (isUhtRelated !== undefined) {
      updateFields.push(`is_uht_related = $${parameterIdx++}`)
      updateValues.push(isUhtRelated)
    }
    updateValues.push(postId)

    const updateQuery = `
      UPDATE post
      SET ${updateFields.join(", ")}
      WHERE id = $${parameterIdx}
      RETURNING id
    `

    const updateRes = await pool.query(updateQuery, updateValues)
    return Response.json({ updatedPostId: updateRes.rows[0].id })
  } catch (error) {
    console.error("Грешка при обновяване на поста", error)
    return Response.json(
      { error: "Грешка при обновяване на поста" },
      { status: 500 }
    )
  }
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

  try {
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

    const postQuery = await pool.query(
      "SELECT createdby FROM post WHERE id = $1",
      [postId]
    )

    if (postQuery.rows.length === 0) {
      return Response.json(
        { error: "Публикацията не съществува" },
        { status: 404 }
      )
    }

    const postAuthor = postQuery.rows[0].createdby

    if (!isAdmin(userRole) && postAuthor !== userEmail) {
      return Response.json(
        { error: "Нямате права да изтриете тази публикация" },
        { status: 403 }
      )
    }

    const result = await pool.query(
      "DELETE FROM post WHERE id = $1 RETURNING id",
      [postId]
    )

    return Response.json({ deletedPostId: result.rows[0].id })
  } catch (error) {
    console.error("Грешка при изтриване на публикацията:", error)
    return Response.json(
      { error: "Грешка при изтриване на публикацията" },
      { status: 500 }
    )
  }
}
