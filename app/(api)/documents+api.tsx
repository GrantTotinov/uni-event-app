import { pool } from '@/configs/NilePostgresConfig'

export async function POST(request: Request) {
  const { postId, fileName, fileType, fileUrl, createdBy } =
    await request.json()
  if (!postId || !fileName || !fileUrl) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  try {
    const result = await pool.query(
      `INSERT INTO documents (post_id, file_name, file_type, file_url, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [postId, fileName, fileType, fileUrl, createdBy]
    )
    return Response.json(result.rows[0])
  } catch (error) {
    return Response.json({ error: 'Error saving document' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const postId = new URL(request.url).searchParams.get('postId')
  if (!postId) {
    return Response.json({ error: 'Missing postId' }, { status: 400 })
  }
  try {
    const result = await pool.query(
      `SELECT id, file_name, file_type, file_url, created_by, created_on
       FROM documents WHERE post_id = $1 ORDER BY created_on DESC`,
      [postId]
    )
    return Response.json(result.rows)
  } catch (error) {
    return Response.json({ error: 'Error fetching documents' }, { status: 500 })
  }
}
