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

export async function PUT(request: Request) {
  const { email, name } = await request.json()

  if (!email || !name) {
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  try {
    const result = await pool.query(
      `UPDATE users SET name = $1 WHERE email = $2 RETURNING *`,
      [name, email]
    )
    if (result.rows.length === 0) {
      return Response.json(
        { error: "Потребителят не съществува" },
        { status: 404 }
      )
    }
    return Response.json(result.rows[0])
  } catch (error) {
    console.error("Грешка при промяна на името:", error)
    return Response.json(
      { error: "Грешка при промяна на името" },
      { status: 500 }
    )
  }
}
