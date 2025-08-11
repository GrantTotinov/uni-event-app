import { pool } from "@/configs/NilePostgresConfig"

export async function POST(request: Request) {
  try {
    const { eventId, userEmail } = await request.json()

    if (!eventId || !userEmail) {
      return Response.json(
        { error: "Липсват задължителни данни" },
        { status: 400 }
      )
    }

    const isRegistered = await pool.query(
      `SELECT 1 FROM event_registration WHERE event_id = $1 AND user_email = $2`,
      [eventId, userEmail]
    )

    if (isRegistered.rows.length === 0) {
      const result = await pool.query(
        `INSERT INTO event_registration VALUES (DEFAULT, $1, $2, DEFAULT) RETURNING *`,
        [eventId, userEmail]
      )
      return Response.json(result.rows[0])
    }

    return Response.json(isRegistered.rows[0])
  } catch (error) {
    console.error("Грешка при регистрация за събитие:", error)
    return Response.json({ error: "Грешка при регистрация" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const email = new URL(request.url).searchParams.get("email")
    if (!email) {
      return Response.json({ error: "Липсва email параметър" }, { status: 400 })
    }

    const result = await pool.query(
      `SELECT events.*, 
              users.name as username,
              COALESCE(registration_count.count, 0)::integer as "registeredCount"
       FROM events
       INNER JOIN users ON events.createdby = users.email
       INNER JOIN event_registration ON events.id = event_registration.event_id
       LEFT JOIN (
         SELECT event_id, COUNT(*)::integer as count 
         FROM event_registration 
         GROUP BY event_id
       ) registration_count ON events.id = registration_count.event_id
       WHERE event_registration.user_email = $1
       ORDER BY event_registration.id DESC`,
      [email]
    )

    return Response.json(result.rows)
  } catch (error) {
    console.error("Грешка при извличане на записвания:", error)
    return Response.json(
      { error: "Грешка при извличане на записвания" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { eventId, userEmail } = await request.json()

    if (!eventId || !userEmail) {
      return Response.json(
        { error: "Липсват задължителни данни" },
        { status: 400 }
      )
    }

    await pool.query(
      `DELETE FROM event_registration WHERE event_id = $1 AND user_email = $2`,
      [eventId, userEmail]
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error("Грешка при отписване от събитие:", error)
    return Response.json({ error: "Грешка при отписване" }, { status: 500 })
  }
}
