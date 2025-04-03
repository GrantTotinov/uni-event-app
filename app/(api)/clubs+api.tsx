import { pool } from "@/configs/NilePostgresConfig"

// GET - за извличане на всички клубове
export async function GET(request: Request) {
  const result = await pool.query(`SELECT * FROM clubs ORDER BY name ASC;`)
  return Response.json(result.rows)
}

// POST - за добавяне на нов клуб
export async function POST(request: Request) {
  const { imageUrl, clubName, about } = await request.json()
  const result = await pool.query(
    `INSERT INTO clubs (name, club_logo, about) VALUES ($1, $2, $3) RETURNING *;`,
    [clubName, imageUrl, about]
  )
  return Response.json(result.rows[0])
}
