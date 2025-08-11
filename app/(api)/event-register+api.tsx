import { pool } from "@/configs/NilePostgresConfig"

export async function POST(request: Request) {
  const { eventId, userEmail } = await request.json()

  const isRegistered = await pool.query(
    `SELECT * FROM event_registration WHERE event_id = $1 AND user_email = $2`,
    [eventId, userEmail]
  )

  if (isRegistered.rows?.length == 0) {
    const result = await pool.query(
      `INSERT INTO event_registration VALUES (DEFAULT, $1, $2, DEFAULT) RETURNING *;`,
      [eventId, userEmail]
    )
    return Response.json(result.rows[0])
  }

  return Response.json(isRegistered.rows)
}

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")

  const result = await pool.query(
    `SELECT events.*, 
            users.name as username,
            COALESCE(registration_count.count, 0) as registeredCount
     FROM events
     INNER JOIN users ON events.createdby = users.email
     INNER JOIN event_registration ON events.id = event_registration.event_id
     LEFT JOIN (
       SELECT event_id, COUNT(*) as count 
       FROM event_registration 
       GROUP BY event_id
     ) registration_count ON events.id = registration_count.event_id
     WHERE event_registration.user_email = $1
     ORDER BY event_registration.id DESC;`,
    [email]
  )

  return Response.json(result.rows)
}

export async function DELETE(request: Request) {
  const { eventId, userEmail } = await request.json()

  await pool.query(
    `DELETE FROM event_registration WHERE event_id = $1 AND user_email = $2`,
    [eventId, userEmail]
  )

  return Response.json({ success: true })
}
