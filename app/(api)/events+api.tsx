import { pool } from "@/configs/NilePostgresConfig"
import { isAdmin } from "@/context/AuthContext"

export async function POST(request: Request) {
  const { eventName, bannerUrl, location, link, eventDate, eventTime, email } =
    await request.json()
  const result = await pool.query(
    `
        
        INSERT INTO events (name, location, link, bannerurl, event_date, event_time, createdby) 
        VALUES($1, $2, $3, $4, $5, $6, $7)`,
    [eventName, location, link, bannerUrl, eventDate, eventTime, email]
  )
  return Response.json(result)
}

export async function GET(request: Request) {
  const result = await pool.query(`
    select events.*, users.name as username from events
    inner join users
    on events.createdby=users.email
    order by id desc;
    `)

  return Response.json(result.rows)
}

export async function DELETE(request: Request) {
  const body = await request.json()
  const { eventId, userEmail } = body

  // Проверка дали събитието съществува
  const eventQuery = await pool.query(
    "SELECT createdby FROM events WHERE id = $1",
    [eventId]
  )
  if (eventQuery.rows.length === 0) {
    return Response.json({ error: "Събитието не съществува" }, { status: 404 })
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
}
