import { pool } from '@/configs/NilePostgresConfig'

export async function POST(request: Request) {
  const { name, email, image, contact_email, contact_phone } =
    await request.json()
  const result = await pool.query(
    `INSERT INTO users (name, email, image, contact_email, contact_phone) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, email, image, contact_email ?? null, contact_phone ?? null]
  )
  return Response.json(result.rows[0])
}

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get('email')
  try {
    const result = await pool.query(
      `SELECT id, name, email, image, role, contact_email, contact_phone FROM users WHERE email=$1`,
      [email]
    )
    return Response.json(result.rows[0])
  } catch (e) {
    return Response.json({ error: e })
  }
}

export async function PUT(request: Request) {
  const {
    email,
    name,
    contact_email,
    contact_phone,
    currentPassword,
    newPassword,
  } = await request.json()

  if (
    !email ||
    (!name &&
      !contact_email &&
      !contact_phone &&
      (!currentPassword || !newPassword))
  ) {
    return Response.json(
      { error: 'Липсват задължителни данни' },
      { status: 400 }
    )
  }

  try {
    // Update name, contact_email, contact_phone if provided
    if (name || contact_email || contact_phone) {
      const fields = []
      const values = []
      let idx = 1

      if (name) {
        fields.push(`name = $${idx++}`)
        values.push(name)
      }
      if (contact_email !== undefined) {
        fields.push(`contact_email = $${idx++}`)
        values.push(contact_email)
      }
      if (contact_phone !== undefined) {
        fields.push(`contact_phone = $${idx++}`)
        values.push(contact_phone)
      }

      if (fields.length > 0) {
        values.push(email)
        const updateQuery = `UPDATE users SET ${fields.join(
          ', '
        )} WHERE email = $${idx} RETURNING *`
        const updateResult = await pool.query(updateQuery, values)
        if (updateResult.rows.length === 0) {
          return Response.json(
            { error: 'Потребителят не съществува' },
            { status: 404 }
          )
        }
      }
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const passwordQuery = await pool.query(
        `SELECT password FROM users WHERE email = $1`,
        [email]
      )

      if (passwordQuery.rows.length === 0) {
        return Response.json(
          { error: 'Потребителят не съществува' },
          { status: 404 }
        )
      }

      const storedPassword = passwordQuery.rows[0].password

      if (storedPassword !== currentPassword) {
        return Response.json(
          { error: 'Текущата парола е грешна' },
          { status: 403 }
        )
      }

      await pool.query(`UPDATE users SET password = $1 WHERE email = $2`, [
        newPassword,
        email,
      ])
    }

    return Response.json({ message: 'Успешно актуализиране на данните' })
  } catch (error) {
    return Response.json(
      { error: 'Грешка при актуализиране на данните' },
      { status: 500 }
    )
  }
}
