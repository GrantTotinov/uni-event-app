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

    const isInterested = await pool.query(
      "SELECT * FROM event_interest WHERE event_id = $1 AND user_email = $2",
      [eventId, userEmail]
    )

    if (isInterested.rows.length === 0) {
      const result = await pool.query(
        "INSERT INTO event_interest VALUES (DEFAULT, $1, $2, DEFAULT) RETURNING *",
        [eventId, userEmail]
      )
      return Response.json(result.rows[0])
    }

    return Response.json(isInterested.rows[0])
  } catch (error) {
    console.error("Грешка при добавяне на интерес:", error)
    return Response.json(
      { error: "Грешка при добавяне на интерес" },
      { status: 500 }
    )
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
              COALESCE(registration_count.count, 0)::integer as "registeredCount",
              COALESCE(interest_count.count, 0)::integer as "interestedCount"
       FROM events
       INNER JOIN users ON events.createdby = users.email
       INNER JOIN event_interest ON events.id = event_interest.event_id
       LEFT JOIN (
         SELECT event_id, COUNT(*)::integer as count 
         FROM event_registration 
         GROUP BY event_id
       ) registration_count ON events.id = registration_count.event_id
       LEFT JOIN (
         SELECT event_id, COUNT(*)::integer as count 
         FROM event_interest 
         GROUP BY event_id
       ) interest_count ON events.id = interest_count.event_id
       WHERE event_interest.user_email = $1
       ORDER BY event_interest.id DESC`,
      [email]
    )

    return Response.json(result.rows)
  } catch (error) {
    console.error("Грешка при извличане на интереси:", error)
    return Response.json(
      { error: "Грешка при извличане на интереси" },
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
      "DELETE FROM event_interest WHERE event_id = $1 AND user_email = $2",
      [eventId, userEmail]
    )

    return Response.json({ success: true })
  } catch (error) {
    console.error("Грешка при премахване на интерес:", error)
    return Response.json(
      { error: "Грешка при премахване на интерес" },
      { status: 500 }
    )
  }
}
