import { client } from "@/configs/NilePostgresConfig"

export async function POST(request: Request) {
  const { post_id, user_id } = await request.json()
  await client.connect()

  //check if user already liked
  const existingLike = await client.query(`
        select * from post_likes where post_id = ${post_id} and user_id=${user_id}
        `)

  let result
  if (existingLike.rowCount > 0) {
    // if liked, unlike
    result = await client.query(`
            delete from post_likes where post_id = ${post_id} and user_id = ${user_id}
            `)
  } else {
    // if no like, like it
    result = await client.query(`
            insert into post_likes values(DEFAULT,'${post_id}','${user_id}', NOW)
            `)
  }
  await client.end()
  return Response.json(result)
}

export async function GET(request: Request) {
  const post_id = new URL(request.url).searchParams.get("post_id")

  await client.connect()

  //return likes count and who liked it
  const result = await client.query(`
        select user.id,user.name, user.image
        from post_likes
        inner join users 
        on post_likes.user_id = users.id
        where post_likes.post_id = ${post_id}
        `)
  await client.end()
  return Response.json({
    like_count: result.rowCount,
    liked_by: result.rows,
  })
}
