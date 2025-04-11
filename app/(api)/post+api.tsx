import { client, pool } from "@/configs/NilePostgresConfig"

export async function POST(request: Request) {
  const body = await request.json()
  console.log("Получени данни:", body)

  // Проверка дали има нужните данни в body
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

  // Ако е подаден u_email, извличаме постове от клубовете, в които потребителя е член
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
        post.club,
        users.id AS user_id,
        users.email,
        users.name,
        users.image
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
    // В противен случай използваме club и orderField
    const club = url.searchParams.get("club")
    let orderField = url.searchParams.get("orderField")

    // Валидация на orderField: списък с позволени стойности
    const allowedFields = ["post.createdon", "post.id", "users.name"]
    if (!orderField || !allowedFields.includes(orderField)) {
      orderField = "post.createdon"
    }

    // Проверка дали club параметърът е зададен
    if (!club) {
      return Response.json({ error: "Missing club parameter" }, { status: 400 })
    }

    const result = await pool.query(`
      SELECT 
        post.id AS post_id,
        post.context,
        post.imageurl,
        post.createdby,
        post.createdon,
        post.club,
        users.id AS user_id,
        users.email,
        users.name,
        users.image
      FROM post
      INNER JOIN users ON post.createdby = users.email
      WHERE post.club IN (${club})
      ORDER BY ${orderField} DESC;
    `)
    return Response.json(result.rows)
  }
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { postId, userEmail, content, imageUrl } = body

  // Проверка за задължителните данни
  if (!postId || !userEmail || (!content && !imageUrl)) {
    console.error("Липсват задължителни данни:", body)
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  // Проверка за съществуването на поста и дали потребителя е автор
  const postQuery = await pool.query(
    "SELECT createdby FROM post WHERE id = $1",
    [postId]
  )

  if (postQuery.rows.length === 0) {
    return Response.json({ error: "Постът не съществува" }, { status: 404 })
  }

  const postAuthor = postQuery.rows[0].createdby
  if (postAuthor !== userEmail) {
    return Response.json(
      { error: "Нямате права да редактирате този пост" },
      { status: 403 }
    )
  }

  // Изграждане на динамична UPDATE заявка
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
  updateValues.push(postId) // последният параметър за WHERE условията

  const updateQuery = `
    UPDATE post
    SET ${updateFields.join(", ")}
    WHERE id = $${parameterIdx}
    RETURNING id
  `

  try {
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

  // Проверяваме дали са подадени необходимите данни
  if (!postId || !userEmail) {
    console.error("Липсват задължителни данни за изтриване:", body)
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  // Проверяваме дали постът съществува и дали потребителят е автор
  const postQuery = await pool.query(
    "SELECT createdby FROM post WHERE id = $1",
    [postId]
  )
  if (postQuery.rows.length === 0) {
    return Response.json({ error: "Постът не съществува" }, { status: 404 })
  }

  const postAuthor = postQuery.rows[0].createdby
  if (postAuthor !== userEmail) {
    return Response.json(
      { error: "Нямате права да изтриете този пост" },
      { status: 403 }
    )
  }

  // Изтриваме поста
  const result = await pool.query(
    "DELETE FROM post WHERE id = $1 RETURNING id",
    [postId]
  )
  return Response.json({ deletedPostId: result.rows[0].id })
}
