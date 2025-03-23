import { client } from "@/configs/NilePostgresConfig"

export async function POST(request: Request) {
  const { content, imageUrl, visibleIn, email } = await request.json()

  await client.connect()
  const result = await client.query(
    `insert into post values(DEFAULT,'${content}','${imageUrl}',DEFAULT,'${email}',${visibleIn})
    RETURNING id`
  )
  await client.end()

  return Response.json({ newPostId: result.rows[0].id })
}

export async function GET(request: Request) {
  const club = new URL(request.url).searchParams.get("club")
  const orderField = new URL(request.url).searchParams.get("orderField")

  await client.connect()

  const result = await client.query(`
    SELECT * FROM post
    INNER JOIN users
    on post.createdby=users.email
    WHERE club in (${club}) ORDER BY ${orderField} DESC ;
    `)
  await client.end()
  return Response.json(result.rows)
}
