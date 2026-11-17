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

// Извличане на събития:
// - ?id=...[&email=...]       → едно събитие (детайлна страница)
// - ?filter=upcoming          → бъдещи събития, най-близките първи (по подразбиране в UI)
// - ?filter=registered        → събития, за които email е записан (upcomingOnly=1 → само бъдещи)
// - ?filter=mine              → създадени от email
// - ?filter=popular           → по брой регистрации
// - без filter                → всички, най-новите първи (стар режим)
// - ?search=... ?limit=... ?offset=...
//
// event_date е текст "<ден>,YYYY-MM-DD" → датата се вади с regex.
const EVENT_DAY = `to_date(substring(events.event_date::text from '[0-9]{4}-[0-9]{2}-[0-9]{2}'), 'YYYY-MM-DD')`
const TODAY = `(now() AT TIME ZONE 'Europe/Sofia')::date`

const EVENT_SELECT = `
  SELECT
    events.*,
    users.name AS username,
    (er.event_id IS NOT NULL) AS "isRegistered",
    (ei.event_id IS NOT NULL) AS "isInterested",
    COALESCE(reg_count.count, 0)::integer AS "registeredCount",
    COALESCE(int_count.count, 0)::integer AS "interestedCount"
  FROM events
  INNER JOIN users ON events.createdby = users.email
  LEFT JOIN event_registration er ON events.id = er.event_id AND er.user_email = $1
  LEFT JOIN event_interest ei ON events.id = ei.event_id AND ei.user_email = $1
  LEFT JOIN (
    SELECT event_id, COUNT(*)::integer AS count FROM event_registration GROUP BY event_id
  ) reg_count ON events.id = reg_count.event_id
  LEFT JOIN (
    SELECT event_id, COUNT(*)::integer AS count FROM event_interest GROUP BY event_id
  ) int_count ON events.id = int_count.event_id`

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email') // $1; null → флаговете са false
  const id = url.searchParams.get('id')
  const search = url.searchParams.get('search')?.trim()
  const filter = url.searchParams.get('filter')
  const upcomingOnly = url.searchParams.get('upcomingOnly') === '1'
  const legacyPopular = url.searchParams.get('orderBy') === 'registeredCount'
  const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || 10)))
  const offset = Math.max(0, Number(url.searchParams.get('offset') || 0))

  try {
    if (id) {
      const result = await pool.query(
        `${EVENT_SELECT} WHERE events.id = $2 LIMIT 1`,
        [email, id]
      )
      return Response.json(result.rows[0] ?? null)
    }

    const params: unknown[] = [email]
    const where: string[] = []

    if (search) {
      params.push(`%${search}%`)
      const p = `$${params.length}`
      where.push(`(events.name ILIKE ${p} OR events.location ILIKE ${p} OR events.details ILIKE ${p})`)
    }

    let orderBy = 'events.id DESC'
    switch (filter) {
      case 'upcoming':
        where.push(`${EVENT_DAY} >= ${TODAY}`)
        orderBy = `${EVENT_DAY} ASC, events.event_time ASC`
        break
      case 'registered':
      case 'mine':
        if (!email) return Response.json([])
        where.push(filter === 'registered' ? 'er.event_id IS NOT NULL' : 'events.createdby = $1')
        if (upcomingOnly) where.push(`${EVENT_DAY} >= ${TODAY}`)
        // предстоящите (най-близките първи), после миналите (най-новите първи)
        orderBy = `(${EVENT_DAY} < ${TODAY}) ASC,
          CASE WHEN ${EVENT_DAY} >= ${TODAY} THEN ${EVENT_DAY} END ASC,
          ${EVENT_DAY} DESC, events.event_time ASC`
        break
      case 'popular':
        orderBy = 'COALESCE(reg_count.count, 0) DESC, COALESCE(int_count.count, 0) DESC, events.id DESC'
        break
      default:
        if (legacyPopular) orderBy = 'COALESCE(reg_count.count, 0) DESC, events.id DESC'
    }

    params.push(limit, offset)
    const result = await pool.query(
      `${EVENT_SELECT}
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )
    return Response.json(result.rows)
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
