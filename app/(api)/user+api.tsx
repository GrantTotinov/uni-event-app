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
  const { email, name, currentPassword, newPassword } = await request.json()

  if (!email || (!name && (!currentPassword || !newPassword))) {
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  try {
    // Актуализиране на името, ако е предоставено
    if (name) {
      const nameResult = await pool.query(
        `UPDATE users SET name = $1 WHERE email = $2 RETURNING *`,
        [name, email]
      )
      if (nameResult.rows.length === 0) {
        return Response.json(
          { error: "Потребителят не съществува" },
          { status: 404 }
        )
      }
    }

    // Актуализиране на паролата, ако са предоставени текуща и нова парола
    if (currentPassword && newPassword) {
      const passwordQuery = await pool.query(
        `SELECT password FROM users WHERE email = $1`,
        [email]
      )

      if (passwordQuery.rows.length === 0) {
        return Response.json(
          { error: "Потребителят не съществува" },
          { status: 404 }
        )
      }

      const storedPassword = passwordQuery.rows[0].password

      if (storedPassword !== currentPassword) {
        return Response.json(
          { error: "Текущата парола е грешна" },
          { status: 403 }
        )
      }

      const passwordResult = await pool.query(
        `UPDATE users SET password = $1 WHERE email = $2 RETURNING email`,
        [newPassword, email]
      )
    }

    return Response.json({ message: "Успешно актуализиране на данните" })
  } catch (error) {
    console.error("Грешка при актуализиране на данните:", error)
    return Response.json(
      { error: "Грешка при актуализиране на данните" },
      { status: 500 }
    )
  }
}
