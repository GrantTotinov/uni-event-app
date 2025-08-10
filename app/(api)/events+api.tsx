import { pool } from "@/configs/NilePostgresConfig"
import { isAdmin } from "@/context/AuthContext"

export async function POST(request: Request) {
  const body = await request.json()
  console.log("Получени данни:", body)

  if (!body || !body.eventName || !body.email) {
    console.error("Липсват задължителни данни:", body)
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  const { eventName, bannerUrl, location, link, eventDate, eventTime, email } =
    body

  const result = await pool.query(
    `INSERT INTO events (name, bannerurl, location, link, event_date, event_time, createdby) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) 
     RETURNING id`,
    [eventName, bannerUrl, location, link, eventDate, eventTime, email]
  )

  return Response.json({ newEventId: result.rows[0].id })
}

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")

  if (email) {
    const result = await pool.query(
      `SELECT events.*, users.name as username,
              CASE WHEN event_registration.id IS NOT NULL THEN true ELSE false END as isRegistered
       FROM events
       INNER JOIN users ON events.createdby = users.email
       LEFT JOIN event_registration ON events.id = event_registration.event_id AND event_registration.user_email = $1
       ORDER BY events.id DESC;`,
      [email]
    )
    return Response.json(result.rows)
  } else {
    const result = await pool.query(
      `SELECT events.*, users.name as username
       FROM events
       INNER JOIN users ON events.createdby = users.email
       ORDER BY events.id DESC;`
    )
    return Response.json(result.rows)
  }
}

export async function PUT(request: Request) {
  const body = await request.json()
  const {
    eventId,
    userEmail,
    eventName,
    bannerUrl,
    location,
    link,
    eventDate,
    eventTime,
  } = body

  if (!eventId || !userEmail) {
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  try {
    // Проверка за събитието
    const eventQuery = await pool.query(
      "SELECT createdby FROM events WHERE id = $1",
      [eventId]
    )
    if (eventQuery.rows.length === 0) {
      return Response.json(
        { error: "Събитието не съществува" },
        { status: 404 }
      )
    }

    // Проверка за потребителя
    const userQuery = await pool.query(
      "SELECT role FROM users WHERE email = $1",
      [userEmail]
    )
    if (userQuery.rows.length === 0) {
      return Response.json(
        { error: "Потребителят не съществува" },
        { status: 404 }
      )
    }

    const userRole = userQuery.rows[0].role
    const creator = eventQuery.rows[0].createdby

    if (!isAdmin(userRole) && creator !== userEmail) {
      return Response.json(
        { error: "Нямате права да редактирате това събитие" },
        { status: 403 }
      )
    }

    // Изграждане на динамичната заявка за обновяване
    const fields: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (eventName) {
      fields.push(`name = $${paramIndex++}`)
      values.push(eventName)
    }
    if (bannerUrl) {
      fields.push(`bannerurl = $${paramIndex++}`)
      values.push(bannerUrl)
    }
    if (location) {
      fields.push(`location = $${paramIndex++}`)
      values.push(location)
    }
    if (link !== undefined) {
      fields.push(`link = $${paramIndex++}`)
      values.push(link)
    }
    if (eventDate) {
      fields.push(`event_date = $${paramIndex++}`)
      values.push(eventDate)
    }
    if (eventTime) {
      fields.push(`event_time = $${paramIndex++}`)
      values.push(eventTime)
    }

    if (fields.length === 0) {
      return Response.json(
        { error: "Няма полета за обновяване" },
        { status: 400 }
      )
    }

    values.push(eventId)
    const updateQuery = `UPDATE events SET ${fields.join(
      ", "
    )} WHERE id = $${paramIndex} RETURNING id`

    const updateRes = await pool.query(updateQuery, values)
    return Response.json({ updatedEventId: updateRes.rows[0].id })
  } catch (error) {
    console.error("Грешка при обновяване на събитието:", error)
    return Response.json(
      { error: "Грешка при обновяване на събитието" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  const body = await request.json()
  const { eventId, userEmail } = body

  if (!eventId || !userEmail) {
    return Response.json(
      { error: "Липсват задължителни данни" },
      { status: 400 }
    )
  }

  try {
    // Проверка дали събитието съществува
    const eventQuery = await pool.query(
      "SELECT createdby FROM events WHERE id = $1",
      [eventId]
    )
    if (eventQuery.rows.length === 0) {
      return Response.json(
        { error: "Събитието не съществува" },
        { status: 404 }
      )
    }

    // Проверка за ролята на потребителя
    const userQuery = await pool.query(
      "SELECT role FROM users WHERE email = $1",
      [userEmail]
    )
    if (userQuery.rows.length === 0) {
      return Response.json(
        { error: "Потребителят не съществува" },
        { status: 404 }
      )
    }

    const userRole = userQuery.rows[0]?.role
    const eventCreator = eventQuery.rows[0]?.createdby

    // Проверка за права: администратор или автор на събитието
    if (!isAdmin(userRole) && eventCreator !== userEmail) {
      return Response.json(
        { error: "Нямате права да изтриете това събитие" },
        { status: 403 }
      )
    }

    // Изтриване на събитието
    const deleteRes = await pool.query(
      "DELETE FROM events WHERE id = $1 RETURNING id",
      [eventId]
    )
    return Response.json({ deletedEventId: deleteRes.rows[0].id })
  } catch (error) {
    console.error("Грешка при изтриване на събитието:", error)
    return Response.json(
      { error: "Грешка при изтриване на събитието" },
      { status: 500 }
    )
  }
}
