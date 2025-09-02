import { pool } from '@/configs/NilePostgresConfig'

export async function POST(request: Request) {
  try {
    const {
      name,
      email,
      image,
      contact_email,
      contact_phone,
      uid,
      role = 'user',
    } = await request.json()

    if (!email || !name) {
      return Response.json(
        { error: 'Email и име са задължителни' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `INSERT INTO users (name, email, image, contact_email, contact_phone, uid, role) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (email) 
       DO UPDATE SET 
         name = EXCLUDED.name,
         image = EXCLUDED.image,
         contact_email = EXCLUDED.contact_email, 
         contact_phone = EXCLUDED.contact_phone,
         uid = EXCLUDED.uid,
         role = EXCLUDED.role
       RETURNING id, name, email, image, role, contact_email, contact_phone, uid`,
      [
        name,
        email,
        image || null,
        contact_email || email,
        contact_phone || null,
        uid || null,
        role,
      ]
    )

    return Response.json(result.rows[0])
  } catch (error) {
    console.error('Error creating/updating user:', error)
    return Response.json(
      { error: 'Грешка при създаване на потребител' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  const uid = url.searchParams.get('uid')

  if (!email && !uid) {
    return Response.json(
      { error: 'Email или uid са задължителни' },
      { status: 400 }
    )
  }

  try {
    let query = ''
    let params = []

    if (email) {
      query = `SELECT id, name, email, image, role, contact_email, contact_phone, uid 
               FROM users WHERE email = $1`
      params = [email]
    } else {
      query = `SELECT id, name, email, image, role, contact_email, contact_phone, uid 
               FROM users WHERE uid = $1`
      params = [uid]
    }

    const result = await pool.query(query, params)

    if (result.rows.length === 0) {
      return Response.json(
        { error: 'Потребителят не е намерен' },
        { status: 404 }
      )
    }

    return Response.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching user:', error)
    return Response.json(
      { error: 'Грешка при извличане на данните' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const {
      email,
      name,
      contact_email,
      contact_phone,
      currentPassword,
      newPassword,
      uid,
    } = await request.json()

    if (!email && !uid) {
      return Response.json(
        { error: 'Email или uid са задължителни' },
        { status: 400 }
      )
    }

    // Update profile fields if provided
    if (name || contact_email || contact_phone || uid) {
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

      // Only allow updating uid if it wasn't set before
      if (uid) {
        fields.push(`uid = COALESCE(uid, $${idx++})`)
        values.push(uid)
      }

      if (fields.length > 0) {
        // Add WHERE clause parameter
        if (email) {
          values.push(email)
          const updateQuery = `
            UPDATE users 
            SET ${fields.join(', ')} 
            WHERE email = $${idx} 
            RETURNING id, name, email, image, role, contact_email, contact_phone, uid
          `
          const updateResult = await pool.query(updateQuery, values)

          if (updateResult.rows.length === 0) {
            return Response.json(
              { error: 'Потребителят не съществува' },
              { status: 404 }
            )
          }

          return Response.json(updateResult.rows[0])
        } else if (uid) {
          const existingUid = uid
          values.push(existingUid)
          const updateQuery = `
            UPDATE users 
            SET ${fields.join(', ')} 
            WHERE uid = $${idx} 
            RETURNING id, name, email, image, role, contact_email, contact_phone, uid
          `
          const updateResult = await pool.query(updateQuery, values)

          if (updateResult.rows.length === 0) {
            return Response.json(
              { error: 'Потребителят не съществува' },
              { status: 404 }
            )
          }

          return Response.json(updateResult.rows[0])
        }
      }
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      let passwordQuery

      if (email) {
        passwordQuery = await pool.query(
          `SELECT password FROM users WHERE email = $1`,
          [email]
        )
      } else if (uid) {
        passwordQuery = await pool.query(
          `SELECT password FROM users WHERE uid = $1`,
          [uid]
        )
      } else {
        return Response.json(
          { error: 'Липсват данни за идентификация' },
          { status: 400 }
        )
      }

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

      if (email) {
        await pool.query(`UPDATE users SET password = $1 WHERE email = $2`, [
          newPassword,
          email,
        ])
      } else {
        await pool.query(`UPDATE users SET password = $1 WHERE uid = $2`, [
          newPassword,
          uid,
        ])
      }

      return Response.json({ message: 'Паролата е променена успешно' })
    }

    return Response.json({ message: 'Няма промени' })
  } catch (error) {
    console.error('Error updating user:', error)
    return Response.json(
      { error: 'Грешка при актуализиране на данните' },
      { status: 500 }
    )
  }
}
