import { pool } from '@/configs/NilePostgresConfig'
import { isSystemAdmin } from '@/context/AuthContext'

// Създаване на публикация
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body || !body.content || !body.email) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
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
    console.error('Грешка при създаване на пост:', error)
    return Response.json(
      { error: 'Грешка при създаване на пост' },
      { status: 500 }
    )
  }
}

// Извличане на публикации с търсене, pagination и филтриране
export async function GET(request: Request) {
  const url = new URL(request.url)
  const club = url.searchParams.get('club')
  const uEmail = url.searchParams.get('u_email')
  const followedOnly = url.searchParams.get('followedOnly')
  const search = url.searchParams.get('search')
  const uhtOnly = url.searchParams.get('uhtOnly') // UHT filter parameter
  const orderField = sanitizeOrder(url.searchParams.get('orderField'))
  const orderDir = sanitizeDir(url.searchParams.get('orderDir'))
  const limit = Math.max(
    1,
    Math.min(100, Number(url.searchParams.get('limit') ?? 20))
  )
  const offset = Math.max(0, Number(url.searchParams.get('offset') ?? 0))

  try {
    let baseQuery = `
            SELECT
        post.id AS post_id,
        post.context,
        post.imageurl,
        post.createdby,
        post.club,
        clubs.createdby AS group_creator_email,
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
      LEFT JOIN clubs ON post.club = clubs.id
      LEFT JOIN (
        SELECT post_id, COUNT(*)::integer AS count 
        FROM likes 
        GROUP BY post_id
      ) lc ON post.id = lc.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*)::integer AS count 
        FROM comments
        GROUP BY post_id
      ) cc ON post.id = cc.post_id
      LEFT JOIN (
        SELECT post_id
        FROM likes
        WHERE user_email = $1
      ) ul ON post.id = ul.post_id
    `

    const params: any[] = [uEmail] // може да е null – OK за LEFT JOIN
    const conditions: string[] = []

    // Enhanced UHT filter - public UHT posts + UHT posts from user's clubs
    if (uhtOnly === 'true') {
      conditions.push('post.is_uht_related = true')

      if (uEmail) {
        // Include public UHT posts AND UHT posts from clubs where user is member/creator
        conditions.push(`(
          post.club IS NULL 
          OR post.club IN (
            SELECT club_id FROM clubfollowers WHERE u_email = $${
              params.length + 1
            }
            UNION
            SELECT id FROM clubs WHERE createdby = $${params.length + 1}
          )
        )`)
        params.push(uEmail)
      } else {
        // If no user email, only show public UHT posts
        conditions.push('post.club IS NULL')
      }
    }

    // Ако се търси конкретен клуб
    if (club) {
      params.push(club)
      conditions.push(`post.club = $${params.length}`)
    }

    // Ако се търсят само постове от последвани клубове
    if (followedOnly === 'true' && uEmail) {
      params.push(uEmail)
      conditions.push(
        `post.club IN (SELECT club_id FROM clubfollowers WHERE u_email = $${params.length})`
      )
    }

    // Ако има search параметър, добавяме търсене в съдържанието на поста И в коментарите
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`
      params.push(searchTerm, searchTerm)

      // Search in both post content AND comments
      conditions.push(`(
        post.context ILIKE $${params.length - 1} 
        OR EXISTS (
          SELECT 1 FROM comments 
          WHERE comments.post_id = post.id 
          AND comments.comment ILIKE $${params.length}
        )
      )`)
    }

    // Ако има WHERE условия, добави ги
    if (conditions.length > 0) {
      baseQuery += ` WHERE ${conditions.join(' AND ')}`
    }

    // Поръчка (само позволени полета)
    baseQuery += ` ORDER BY ${orderField} ${orderDir}`

    // Pagination
    baseQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
    params.push(limit, offset)

    const result = await pool.query(baseQuery, params)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Грешка при извличане на постове:', error)
    return Response.json(
      { error: 'Грешка при извличане на постове' },
      { status: 500 }
    )
  }
}

// Санитизиране на поредността за защита от SQL injection
function sanitizeOrder(field: string | null): string {
  const allowedFields = ['createdon', 'like_count']
  return allowedFields.includes(field || '') ? field! : 'createdon'
}

function sanitizeDir(dir: string | null): string {
  return dir === 'ASC' ? 'ASC' : 'DESC'
}

// Обновяване на публикация
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
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }

    const userQuery = await pool.query(
      'SELECT role FROM users WHERE email = $1',
      [userEmail]
    )
    if (userQuery.rows.length === 0) {
      return Response.json(
        { error: 'Потребителят не съществува' },
        { status: 404 }
      )
    }
    const userRole = userQuery.rows[0].role

    const postQuery = await pool.query(
      'SELECT createdby FROM post WHERE id = $1',
      [postId]
    )
    if (postQuery.rows.length === 0) {
      return Response.json(
        { error: 'Публикацията не съществува' },
        { status: 404 }
      )
    }
    const postAuthor = postQuery.rows[0].createdby

    if (!isSystemAdmin(userRole) && postAuthor !== userEmail) {
      return Response.json(
        { error: 'Нямате права да редактирате тази публикация' },
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
      ', '
    )} WHERE id = $${idx} RETURNING id`
    const updateRes = await pool.query(updateQuery, values)
    return Response.json({ updatedPostId: updateRes.rows[0].id })
  } catch (error) {
    console.error('Грешка при обновяване на поста:', error)
    return Response.json(
      { error: 'Грешка при обновяване на поста' },
      { status: 500 }
    )
  }
}

// Изтриване на публикация
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { postId, userEmail } = body

    if (!postId || !userEmail) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }

    // Get post info (including club)
    const postQuery = await pool.query(
      'SELECT createdby, club FROM post WHERE id = $1',
      [postId]
    )
    if (postQuery.rows.length === 0) {
      return Response.json(
        { error: 'Публикацията не съществува' },
        { status: 404 }
      )
    }
    const postAuthor = postQuery.rows[0].createdby
    const clubId = postQuery.rows[0].club

    // Check user role
    const userQuery = await pool.query(
      'SELECT role FROM users WHERE email = $1',
      [userEmail]
    )
    if (userQuery.rows.length === 0) {
      return Response.json(
        { error: 'Потребителят не съществува' },
        { status: 404 }
      )
    }
    const userRole = userQuery.rows[0].role

    // Check if user is group creator
    let isGroupCreator = false
    if (clubId) {
      const clubQuery = await pool.query(
        'SELECT createdby FROM clubs WHERE id = $1',
        [clubId]
      )
      if (
        clubQuery.rows.length > 0 &&
        clubQuery.rows[0].createdby === userEmail
      ) {
        isGroupCreator = true
      }
    }

    if (
      !isSystemAdmin(userRole) &&
      postAuthor !== userEmail &&
      !isGroupCreator
    ) {
      return Response.json(
        { error: 'Нямате права да изтриете тази публикация' },
        { status: 403 }
      )
    }

    const result = await pool.query(
      'DELETE FROM post WHERE id = $1 RETURNING id',
      [postId]
    )
    return Response.json({ deletedPostId: result.rows[0].id })
  } catch (error) {
    console.error('Грешка при изтриване на публикацията:', error)
    return Response.json(
      { error: 'Грешка при изтриване на публикацията' },
      { status: 500 }
    )
  }
}
