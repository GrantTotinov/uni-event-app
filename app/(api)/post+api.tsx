import { client } from "@/configs/NilePostgresConfig"

export async function POST(request: Request) {
  const { content, imageUrl, visibleIn, email } = await request.json()

  await client.connect()
  const result = await client.query(
    `insert into post values(DEFAULT,'${content}','${imageUrl}','${visibleIn}',DEFAULT,'${email}')
    `
  )
  await client.end()

  return Response.json(result)
}

export async function GET(request: Request) {
  const visibleIn = new URL(request.url).searchParams.get("visibleIn")
  const orderField = new URL(request.url).searchParams.get("orderField")

  await client.connect()

  const result = await client.query(`
    SELECT * FROM post
    INNER JOIN users
    on post.createdby=users.email
    WHERE visablein='${visibleIn}' ORDER BY ${orderField} DESC ;
    `)
  await client.end()
  return Response.json(result.rows)
}
