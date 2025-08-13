import { pool } from "@/configs/NilePostgresConfig"
import { isAdmin } from "@/context/AuthContext"

type OrderField = "post.createdon" | "like_count" | "comment_count"

function sanitizeOrder(field: string | null): OrderField {
  switch (field) {
    case "like_count":
      return "like_count"
    case "comment_count":
      return "comment_count"
    default:
      return "post.createdon"
  }
}

function sanitizeDir(dir: string | null): "ASC" | "DESC" {
  return dir?.toUpperCase() === "ASC" ? "ASC" : "DESC"
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body || !body.content || !body.email) {
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
  } catch (error) {
    console.error("Грешка при създаване на пост:", error)
    return Response.json(
      { error: "Грешка при създаване на пост" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const club = url.searchParams.get("club")
  const uEmail = url.searchParams.get("u_email")
  const followedOnly = url.searchParams.get("followedOnly") // Нов параметър
  const orderField = sanitizeOrder(url.searchParams.get("orderField"))
  const orderDir = sanitizeDir(url.searchParams.get("orderDir"))
  const limit = Math.max(
    1,
    Math.min(100, Number(url.searchParams.get("limit") ?? 20))
  )
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0))

  try {
    let baseQuery = `
      SELECT 
        post.id AS post_id,
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
        COALESCE(lc.count, 0)::integer AS like_count,
        COALESCE(cc.count, 0)::integer AS comment_count,
        CASE WHEN ul.post_id IS NULL THEN false ELSE true END AS is_liked
      FROM post
      INNER JOIN users ON post.createdby = users.email
      LEFT JOIN (
        SELECT post_id, COUNT(*)::integer AS count 
        FROM likes 
        GROUP BY post_id
      ) lc ON post.id = lc.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*)::integer AS count 
        FROM comments
        WHERE parent_id IS NULL
        GROUP BY post_id
      ) cc ON post.id = cc.post_id
      LEFT JOIN likes ul 
        ON post.id = ul.post_id AND ul.user_email = $1
    `

    const params: any[] = [uEmail] // може да е null – OK за LEFT JOIN
    const conditions: string[] = []

    // Ако се търси конкретен клуб
    if (club) {
      params.push(club)
      conditions.push(`post.club = $${params.length}`)
    }

    // Ако се търсят само постове от последвани клубове
    if (followedOnly === "true" && uEmail) {
      params.push(uEmail)
      conditions.push(
        `post.club IN (SELECT club_id FROM clubfollowers WHERE u_email = $${params.length})`
      )
    }

    // Ако има WHERE условия, добави ги
    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(" AND ")}`
    }

    // Поръчка (само позволени полета)
    baseQuery += ` ORDER BY ${orderField} ${orderDir}`
    baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(baseQuery, params)
    return Response.json(result.rows)
  } catch (error) {
    console.error("Грешка при извличане на постове:", error)
    return Response.json(
      { error: "Грешка при извличане на постове" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
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

    const fields: string[] = []
    const values: any[] = []
    let idx = 1

    if (content !== undefined) {
      fields.push(`context = $${idx++}`)
      values.push(content)
    }
    if (imageUrl !== undefined) {
      fields.push(`imageurl = $${idx++}`)
      values.push(imageUrl)
    }
    if (isUhtRelated !== undefined) {
      fields.push(`is_uht_related = $${idx++}`)
      values.push(isUhtRelated)
    }
    values.push(postId)

    const updateQuery = `UPDATE post SET ${fields.join(
      ", "
    )} WHERE id = $${idx} RETURNING id`
    const updateRes = await pool.query(updateQuery, values)
    return Response.json({ updatedPostId: updateRes.rows[0].id })
  } catch (error) {
    console.error("Грешка при обновяване на поста:", error)
    return Response.json(
      { error: "Грешка при обновяване на поста" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { postId, userEmail } = body

    if (!postId || !userEmail) {
      return Response.json(
        { error: "Липсват задължителни данни" },
        { status: 400 }
      )
    }

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
