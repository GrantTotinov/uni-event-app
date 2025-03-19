import { client } from "@/configs/NilePostgresConfig"

export async function POST(request: Request) {
  await client.connect()
  const { eventName, bannerUrl, location, link, eventDate, eventTime, email } =
    await request.json()
  const result = await client.query(`
        
        INSERT INTO events VALUES(
        DEFAULT,
        '${eventName}',
        '${location}',
        '${link}',
        '${bannerUrl}',
        '${eventDate}',
        '${eventTime}',
        '${email}',
        DEFAULT)
        `)
  await client.end()
  return Response.json(result)
}
