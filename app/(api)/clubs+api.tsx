// File: app/(api)/clubs+api.tsx
import { pool } from '@/configs/NilePostgresConfig'

// GET - за извличане на всички клубове
export async function GET(request: Request) {
  try {
    const result = await pool.query(`SELECT * FROM clubs ORDER BY name ASC;`)
    return Response.json(result.rows)
  } catch (error) {
    console.error('Error fetching clubs:', error)
    return Response.json(
      { error: 'Грешка при зареждане на групите' },
      { status: 500 }
    )
  }
}

// POST - за добавяне на нов клуб
export async function POST(request: Request) {
  try {
    const { imageUrl, clubName, about, createdBy } = await request.json()

    if (!clubName || !about || !createdBy) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `INSERT INTO clubs (name, club_logo, about, createdby) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *;`,
      [clubName.trim(), imageUrl || '', about.trim(), createdBy]
    )

    return Response.json(result.rows[0])
  } catch (error) {
    console.error('Error creating club:', error)
    return Response.json(
      { error: 'Грешка при създаване на групата' },
      { status: 500 }
    )
  }
}
