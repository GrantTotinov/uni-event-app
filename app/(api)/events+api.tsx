import { pool } from "@/configs/NilePostgresConfig"

export async function POST(request: Request) {
  const { eventName, bannerUrl, location, link, eventDate, eventTime, email } =
    await request.json()
  const result = await pool.query(
    `
        
        INSERT INTO events (name, location, link, bannerurl, event_date, event_time, createdby) 
        VALUES( VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
