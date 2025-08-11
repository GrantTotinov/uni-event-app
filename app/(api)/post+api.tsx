import { client, pool } from "@/configs/NilePostgresConfig"
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

  const { content, imageUrl, visibleIn, email } = body

  const result = await pool.query(
    `INSERT INTO post (context, imageurl, createdby, club)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [content, imageUrl, email, visibleIn]
  )

  return Response.json({ newPostId: result.rows[0].id })
}

export async function GET(request: Request) {
  const url = new URL(request.url)

  if (url.searchParams.has("u_email")) {
    const u_email = url.searchParams.get("u_email")
    const result = await pool.query(
      `
      SELECT 
        post.id AS post_id,
        post.context,
        post.imageurl,
        post.createdby,
        post.createdon,
        post.createdon AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sofia' AS createdon_local,
        post.club,
        users.id AS user_id,
        users.email,
        users.name,
        users.image,
        users.role
      FROM post
      INNER JOIN clubfollowers ON post.club = clubfollowers.club_id
      INNER JOIN users ON post.createdby = users.email
      WHERE clubfollowers.u_email = $1
      ORDER BY post.createdon DESC;
      `,
      [u_email]
    )
    return Response.json(result.rows)
  } else {
    const club = url.searchParams.get("club")

    if (club) {
      const orderField = url.searchParams.get("orderField") || "post.createdon"

      if (url.searchParams.has("orderByLikes")) {
        const result = await pool.query(`
          SELECT 
            post.id AS post_id,
            post.context,
            post.imageurl,
            post.createdby,
            post.createdon,
            post.createdon AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sofia' AS createdon_local,
            post.club,
            users.id AS user_id,
            users.email,
            users.name,
            users.image,
            users.role,
            COALESCE(COUNT(likes.id), 0) AS likes_count
          FROM post
          INNER JOIN users ON post.createdby = users.email
          LEFT JOIN likes ON post.id = likes.post_id
          WHERE post.club IN (${club})
          GROUP BY post.id, users.id
          ORDER BY likes_count DESC;
        `)
        return Response.json(result.rows)
      } else {
        const result = await pool.query(`
          SELECT 
            post.id AS post_id,
            post.context,
            post.imageurl,
            post.createdby,
            post.createdon,
            post.createdon AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sofia' AS createdon_local,
            post.club,
            users.id AS user_id,
            users.email,
            users.name,
            users.image,
            users.role
          FROM post
          INNER JOIN users ON post.createdby = users.email
          WHERE post.club IN (${club})
          ORDER BY ${orderField} DESC;
        `)
        return Response.json(result.rows)
      }
    }
  }
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { postId, userEmail, content, imageUrl } = body

  if (!postId || !userEmail || (!content && !imageUrl)) {
    console.error("Липсват задължителни данни:", body)
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

    // Проверка дали публикацията съществува
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

    // Ако потребителят не е администратор и не е автор на публикацията
    if (!isAdmin(userRole) && postAuthor !== userEmail) {
      return Response.json(
        { error: "Нямате права да редактирате тази публикация" },
        { status: 403 }
      )
    }

    // Актуализиране на публикацията
    let updateFields: string[] = []
    let updateValues: any[] = []
    let parameterIdx = 1

    if (content) {
      updateFields.push(`context = $${parameterIdx++}`)
      updateValues.push(content)
    }
    if (imageUrl) {
      updateFields.push(`imageurl = $${parameterIdx++}`)
      updateValues.push(imageUrl)
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
      { error: "Грешка при обновяването на поста" },
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
