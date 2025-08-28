import { pool } from '@/configs/NilePostgresConfig'
import { isSystemAdmin } from '@/context/AuthContext'

/**
 * GET all comments for a post, including all levels of nesting.
 * Returns a flat array with parent_id for each comment.
 * The frontend should build the nested tree.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')
  const search = searchParams.get('search')

  if (!postId) {
    return Response.json({ error: 'Липсва параметър postId' }, { status: 400 })
  }

  try {
    let query = `
      SELECT 
        comments.id, 
        comments.comment, 
        comments.created_at, 
        comments.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Sofia' AS created_at_local, 
        users.name, 
        users.image, 
        users.email AS user_email, 
        users.role AS user_role,
        comments.parent_id
      FROM comments
      INNER JOIN users ON comments.user_email = users.email
      WHERE comments.post_id = $1
    `
    const params: any[] = [postId]

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`
      query += ` AND comments.comment ILIKE $2`
      params.push(searchTerm)
    }

    query += ` ORDER BY comments.created_at ASC`

    const result = await pool.query(query, params)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching comments', error)
    return Response.json(
      { error: 'Възникна грешка при извличането на коментари' },
      { status: 500 }
    )
  }
}

/**
 * POST a new comment or reply (to any comment, parent or child)
 */
export async function POST(request: Request) {
  const { postId, userEmail, comment, parentId } = await request.json()
  if (!postId || !userEmail || !comment) {
    return Response.json(
      { error: 'Липсват задължителни данни' },
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
    return Response.json({
      message: 'Коментарът е добавен успешно',
      commentId: result.rows[0].id,
    })
  } catch (error) {
    console.error('Error adding comment', error)
    return Response.json(
      { error: 'Възникна грешка при добавяне на коментара' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const { commentId, userEmail, newComment } = await request.json()

  if (!commentId || !userEmail || !newComment) {
    return Response.json(
      { error: 'Липсват задължителни данни' },
      { status: 400 }
    )
  }

  try {
    const commentQuery = await pool.query(
      'SELECT user_email FROM comments WHERE id = $1',
      [commentId]
    )

    if (commentQuery.rows.length === 0) {
      return Response.json(
        { error: 'Коментарът не съществува' },
        { status: 404 }
      )
    }

    const commentAuthor = commentQuery.rows[0].user_email

    if (userEmail !== commentAuthor) {
      return Response.json(
        { error: 'Нямате права да редактирате този коментар' },
        { status: 403 }
      )
    }

    const updateRes = await pool.query(
      'UPDATE comments SET comment = $1 WHERE id = $2 RETURNING id, comment',
      [newComment, commentId]
    )

    return Response.json({
      updatedCommentId: updateRes.rows[0].id,
      updatedComment: updateRes.rows[0].comment,
    })
  } catch (error) {
    console.error('Грешка при редактиране на коментара:', error)
    return Response.json(
      { error: 'Грешка при редактиране на коментара' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const { commentId, userEmail, postAuthorEmail } = await request.json()

  if (!commentId || !userEmail) {
    return Response.json(
      { error: 'Липсват задължителни данни' },
      { status: 400 }
    )
  }

  try {
    // Get user role
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

    // Get comment info (including post_id)
    const commentQuery = await pool.query(
      'SELECT user_email, post_id FROM comments WHERE id = $1',
      [commentId]
    )
    if (commentQuery.rows.length === 0) {
      return Response.json(
        { error: 'Коментарът не съществува' },
        { status: 404 }
      )
    }
    const commentAuthor = commentQuery.rows[0].user_email
    const postId = commentQuery.rows[0].post_id

    // Get post info (including club)
    const postQuery = await pool.query(
      'SELECT createdby, club FROM post WHERE id = $1',
      [postId]
    )
    if (postQuery.rows.length === 0) {
      return Response.json({ error: 'Постът не съществува' }, { status: 404 })
    }
    const postAuthor = postQuery.rows[0].createdby
    const clubId = postQuery.rows[0].club

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
      userEmail !== commentAuthor &&
      userEmail !== postAuthor &&
      !isGroupCreator
    ) {
      return Response.json(
        { error: 'Нямате права да изтриете този коментар' },
        { status: 403 }
      )
    }

    const deleteRes = await pool.query(
      'DELETE FROM comments WHERE id = $1 RETURNING id',
      [commentId]
    )

    return Response.json({ deletedCommentId: deleteRes.rows[0].id })
  } catch (error) {
    console.error('Грешка при изтриване на коментара:', error)
    return Response.json(
      { error: 'Грешка при изтриване на коментара' },
      { status: 500 }
    )
  }
}
