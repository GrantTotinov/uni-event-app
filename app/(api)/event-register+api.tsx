import { client } from "@/configs/NilePostgresConfig"

export async function POST(request: Request) {
  const { eventId, userEmail } = await request.json()

  await client.connect()
  const isRegistered = await client.query(`
    select * from event_registration 
    where event_id = ${eventId} and user_email='${userEmail}'
    `)
  if (isRegistered.rows?.length == 0) {
    const result = await client.query(`
                insert into event_registration values
                (DEFAULT,${eventId},'${userEmail}',DEFAULT)
                `)
    return Response.json(result)
  }

  await client.end()
  return Response.json(isRegistered.rows)
}

export async function GET(request: Request) {
  const email = new URL(request.url).searchParams.get("email")

  await client.connect()

  const result = await client.query(`
    select events.*, users.name as username from events
    inner join users
    on events.createdby=users.email
    inner join event_registration
    on events.id=event_registration.event_id
    where event_registration.user_email='${email}'
    order by event_registration.id desc;
    `)
  await client.end()
  return Response.json(result.rows)
}

export async function DELETE(request: Request) {
  const { eventId, userEmail } = await request.json()

  await client.connect()
  await client.query(`
    DELETE FROM event_registration 
    WHERE event_id = ${eventId} AND user_email = '${userEmail}'
  `)
  await client.end()

  return Response.json({ success: true })
}
