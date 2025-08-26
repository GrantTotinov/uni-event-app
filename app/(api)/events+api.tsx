import { pool } from '@/configs/NilePostgresConfig'
import { isSystemAdmin } from '@/context/AuthContext'

// Създаване на събитие (вкл. details)
export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body || !body.eventName || !body.email) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }

    const {
      eventName,
      bannerUrl,
      location,
      link,
      details,
      eventDate,
      eventTime,
      email,
    } = body

    const result = await pool.query(
      `INSERT INTO events (name, bannerurl, location, link, details, event_date, event_time, createdby) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id`,
      [
        eventName,
        bannerUrl,
        location,
        link ?? null,
        details ?? null,
        eventDate,
        eventTime,
        email,
      ]
    )

    return Response.json({ newEventId: result.rows[0].id })
  } catch (error) {
    console.error('Грешка при създаване на събитие:', error)
    return Response.json(
      { error: 'Грешка при създаване на събитие' },
      { status: 500 }
    )
  }
}

// Извличане на събития с pagination и търсене:
// - без параметри: списък с броячи (пагиниран)
// - ?email=...: списък + isRegistered/isInterested за този user (пагиниран)
// - ?id=... [&email=...]: конкретно събитие (детайлна страница)
// - ?limit=... & offset=...: pagination параметри
// - ?search=...: търсене в име, локация и детайли
// - ?orderBy=registeredCount&orderDir=DESC: подреждане по брой регистрирани
export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  const id = url.searchParams.get('id')
  const search = url.searchParams.get('search')
  const orderBy = url.searchParams.get('orderBy')
  const orderDir = url.searchParams.get('orderDir')
  const limit = Math.max(
    1,
    Math.min(50, Number(url.searchParams.get('limit') || 10))
  )
  const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))

  try {
    // Детайл за конкретно събитие (без pagination)
    if (id) {
      if (email) {
        const result = await pool.query(
          `SELECT 
             events.*,
             users.name as username,
             CASE WHEN er.event_id IS NOT NULL THEN true ELSE false END as "isRegistered",
             CASE WHEN ei.event_id IS NOT NULL THEN true ELSE false END as "isInterested",
             COALESCE(reg_count.count, 0)::integer as "registeredCount",
             COALESCE(int_count.count, 0)::integer as "interestedCount"
           FROM events
           INNER JOIN users ON events.createdby = users.email
           LEFT JOIN event_registration er ON events.id = er.event_id AND er.user_email = $2
           LEFT JOIN event_interest ei ON events.id = ei.event_id AND ei.user_email = $2
           LEFT JOIN (
             SELECT event_id, COUNT(*)::integer as count 
             FROM event_registration 
             GROUP BY event_id
           ) reg_count ON events.id = reg_count.event_id
           LEFT JOIN (
             SELECT event_id, COUNT(*)::integer as count 
             FROM event_interest 
             GROUP BY event_id
           ) int_count ON events.id = int_count.event_id
           WHERE events.id = $1
           LIMIT 1`,
          [id, email]
        )
        return Response.json(result.rows[0] ?? null)
      } else {
        const result = await pool.query(
          `SELECT 
             events.*,
             users.name as username,
             COALESCE(reg_count.count, 0)::integer as "registeredCount",
             COALESCE(int_count.count, 0)::integer as "interestedCount"
           FROM events
           INNER JOIN users ON events.createdby = users.email
           LEFT JOIN (
             SELECT event_id, COUNT(*)::integer as count 
             FROM event_registration 
             GROUP BY event_id
           ) reg_count ON events.id = reg_count.event_id
           LEFT JOIN (
             SELECT event_id, COUNT(*)::integer as count 
             FROM event_interest 
             GROUP BY event_id
           ) int_count ON events.id = int_count.event_id
           WHERE events.id = $1
           LIMIT 1`,
          [id]
        )
        return Response.json(result.rows[0] ?? null)
      }
    }

    // Построяваме WHERE условията за търсене
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Ако има search параметър, добавяме търсене в name, location и details
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`
      conditions.push(
        `(events.name ILIKE $${paramIndex} OR events.location ILIKE $${
          paramIndex + 1
        } OR events.details ILIKE $${paramIndex + 2})`
      )
      params.push(searchTerm, searchTerm, searchTerm)
      paramIndex += 3
    }

    // Determine the ORDER BY clause based on orderBy parameter
    let orderByClause = 'ORDER BY events.id DESC' // Default ordering
    if (orderBy === 'registeredCount') {
      const direction = orderDir === 'ASC' ? 'ASC' : 'DESC'
      orderByClause = `ORDER BY COALESCE(reg_count.count, 0) ${direction}, events.id DESC`
    }

    // Списък със събития (с pagination и търсене)
    if (email) {
      // Добавяме email параметър
      params.push(email)
      const emailParamIndex = paramIndex++

      // Добавяме limit и offset
      params.push(limit, offset)
      const limitParamIndex = paramIndex++
      const offsetParamIndex = paramIndex++

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const result = await pool.query(
        `SELECT 
           events.*,
           users.name as username,
           CASE WHEN er.event_id IS NOT NULL THEN true ELSE false END as "isRegistered",
           CASE WHEN ei.event_id IS NOT NULL THEN true ELSE false END as "isInterested",
           COALESCE(reg_count.count, 0)::integer as "registeredCount",
           COALESCE(int_count.count, 0)::integer as "interestedCount"
         FROM events
         INNER JOIN users ON events.createdby = users.email
         LEFT JOIN event_registration er ON events.id = er.event_id AND er.user_email = $${emailParamIndex}
         LEFT JOIN event_interest ei ON events.id = ei.event_id AND ei.user_email = $${emailParamIndex}
         LEFT JOIN (
           SELECT event_id, COUNT(*)::integer as count 
           FROM event_registration 
           GROUP BY event_id
         ) reg_count ON events.id = reg_count.event_id
         LEFT JOIN (
           SELECT event_id, COUNT(*)::integer as count 
           FROM event_interest 
           GROUP BY event_id
         ) int_count ON events.id = int_count.event_id
         ${whereClause}
         ${orderByClause}
         LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
        params
      )
      return Response.json(result.rows)
    } else {
      // Добавяме limit и offset
      params.push(limit, offset)
      const limitParamIndex = paramIndex++
      const offsetParamIndex = paramIndex++

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const result = await pool.query(
        `SELECT 
           events.*,
           users.name as username,
           COALESCE(reg_count.count, 0)::integer as "registeredCount",
           COALESCE(int_count.count, 0)::integer as "interestedCount"
         FROM events
         INNER JOIN users ON events.createdby = users.email
         LEFT JOIN (
           SELECT event_id, COUNT(*)::integer as count 
           FROM event_registration 
           GROUP BY event_id
         ) reg_count ON events.id = reg_count.event_id
         LEFT JOIN (
           SELECT event_id, COUNT(*)::integer as count 
           FROM event_interest 
           GROUP BY event_id
         ) int_count ON events.id = int_count.event_id
         ${whereClause}
         ${orderByClause}
         LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}`,
        params
      )
      return Response.json(result.rows)
    }
  } catch (error) {
    console.error('Грешка при извличане на събития:', error)
    return Response.json(
      { error: 'Грешка при извличане на събития' },
      { status: 500 }
    )
  }
}

// Обновяване на събитие (вкл. details)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      eventId,
      eventName,
      bannerUrl,
      location,
      link,
      details,
      eventDate,
      eventTime,
    } = body

    if (!eventId) {
      return Response.json({ error: 'Липсва ID на събитието' }, { status: 400 })
    }

    const fields: string[] = []
    const values: any[] = []
    let i = 1

    if (eventName) {
      fields.push(`name = $${i++}`)
      values.push(eventName)
    }
    if (bannerUrl) {
      fields.push(`bannerurl = $${i++}`)
      values.push(bannerUrl)
    }
    if (location) {
      fields.push(`location = $${i++}`)
      values.push(location)
    }
    if (link !== undefined) {
      fields.push(`link = $${i++}`)
      values.push(link)
    }
    if (details !== undefined) {
      fields.push(`details = $${i++}`)
      values.push(details)
    }
    if (eventDate) {
      fields.push(`event_date = $${i++}`)
      values.push(eventDate)
    }
    if (eventTime) {
      fields.push(`event_time = $${i++}`)
      values.push(eventTime)
    }

    if (fields.length === 0) {
      return Response.json(
        { error: 'Няма полета за обновяване' },
        { status: 400 }
      )
    }

    values.push(eventId)
    const updateQuery = `UPDATE events SET ${fields.join(
      ', '
    )} WHERE id = $${i} RETURNING id`
    const res = await pool.query(updateQuery, values)
    return Response.json({ updatedEventId: res.rows[0].id })
  } catch (error) {
    console.error('Грешка при обновяване на събитието:', error)
    return Response.json(
      { error: 'Грешка при обновяване на събитието' },
      { status: 500 }
    )
  }
}

// Изтриване на събитие
export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { eventId, userEmail } = body

    if (!eventId || !userEmail) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }

    const eventQuery = await pool.query(
      'SELECT createdby FROM events WHERE id = $1',
      [eventId]
    )
    if (eventQuery.rows.length === 0) {
      return Response.json(
        { error: 'Събитието не съществува' },
        { status: 404 }
      )
    }

    const userQuery = await pool.query(
      'SELECT role FROM users WHERE email = $1',
      [userEmail]
    )
    if (userQuery.rows.length === 0) {
      return Response.json(
        { error: 'Потребителят не съществува' },
        { status: 404 }
      )
    }

    const userRole = userQuery.rows[0]?.role
    const eventCreator = eventQuery.rows[0]?.createdby
    if (!isSystemAdmin(userRole) && eventCreator !== userEmail) {
      return Response.json(
        { error: 'Нямате права да изтриете това събитие' },
        { status: 403 }
      )
    }

    const deleteRes = await pool.query(
      'DELETE FROM events WHERE id = $1 RETURNING id',
      [eventId]
    )
    return Response.json({ deletedEventId: deleteRes.rows[0].id })
  } catch (error) {
    console.error('Грешка при изтриване на събитието:', error)
    return Response.json(
      { error: 'Грешка при изтриване на събитието' },
      { status: 500 }
    )
  }
}
