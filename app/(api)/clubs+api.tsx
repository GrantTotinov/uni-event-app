import { client } from "@/configs/NilePostgresConfig"

export async function GET(request: Response) {
  await client.connect()
  const result = await client.query(`
        select * from clubs order by name asc
        `)
  await client.end()
  return Response.json(result.rows)
}

export async function POST(request: Response) {
  const { imageUrl, clubName, about } = await request.json()
  await client.connect()
  const result = await client.query(`
    insert into clubs values
    (DEFAULT,'${clubName}','${imageUrl}','${about}',DEFAULT)
    `)
  await client.end()

  return Response.json(result.rows)
}
