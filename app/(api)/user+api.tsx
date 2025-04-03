import { pool } from "@/configs/NilePostgresConfig"

export async function POST(request: Request) {
  const { name, email, image } = await request.json()
  const result = await pool.query(
    `INSERT INTO USERS (name, email, image ) VALUES ($1, $2, $3)`,
    [name, email, image]
  )
  return Response.json(result)
}

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")
  try {
    const result = await pool.query(`select * from users where email=$1`, [
      email,
    ])
    return Response.json(result.rows[0])
  } catch (e) {
    return Response.json({ error: e })
  }
}
