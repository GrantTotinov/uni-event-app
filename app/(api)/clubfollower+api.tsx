import { pool } from "@/configs/NilePostgresConfig"

// Добавяне на последовател (follow)
export async function POST(request: Request) {
  const { clubId, u_email } = await request.json()
  try {
    const result = await pool.query(
      `INSERT INTO clubfollowers (club_id, u_email) VALUES ($1, $2) RETURNING *;`,
      [clubId, u_email]
    )
    return Response.json(result.rows[0])
  } catch (error) {
    console.error("Error adding follower: ", error)
    return new Response("Error adding follower", { status: 500 })
  }
}

// Връщане на всички последвани клубове на даден потребител
export async function GET(request: Request) {
  const u_email = new URL(request.url).searchParams.get("u_email")
  try {
    // Връщаме само club_id, за да може лесно да се провери дали даден клуб е последван
    const result = await pool.query(
      `SELECT clubs.id as club_id, clubs.name 
     FROM clubfollowers 
     INNER JOIN clubs ON clubfollowers.club_id = clubs.id
     WHERE clubfollowers.u_email = $1;`,
      [u_email]
    )
    return Response.json(result.rows)
  } catch (error) {
    console.error("Error fetching followed clubs: ", error)
    return new Response("Error fetching followed clubs", { status: 500 })
  }
}

// Отписване от клуб (unfollow)
export async function DELETE(request: Request) {
  const u_email = new URL(request.url).searchParams.get("u_email")
  const club_id = new URL(request.url).searchParams.get("club_id")
  try {
    const result = await pool.query(
      `DELETE FROM clubfollowers WHERE club_id = $1 AND u_email = $2 RETURNING *;`,
      [club_id, u_email]
    )
    return Response.json(result.rows)
  } catch (error) {
    console.error("Error deleting follower: ", error)
    return new Response("Error deleting follower", { status: 500 })
  }
}
