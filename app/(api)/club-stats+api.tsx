// app/(api)/club-stats+api.tsx
import { pool } from '@/configs/NilePostgresConfig'

// GET - за извличане на статистики за клуб
export async function GET(request: Request) {
  const url = new URL(request.url)
  const clubId = url.searchParams.get('clubId')

  console.log('Club stats API called with clubId:', clubId)

  if (!clubId) {
    console.error('Missing clubId parameter')
    return Response.json({ error: 'Club ID е задължителен' }, { status: 400 })
  }

  try {
    console.log('Executing database queries for club:', clubId)

    // Fetch members count and posts count in parallel - following performance guidelines
    const [membersResult, postsResult] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) as count
         FROM clubfollowers 
         WHERE club_id = $1`,
        [clubId]
      ),
      pool.query(
        `SELECT COUNT(*) as count
         FROM post 
         WHERE club = $1`,
        [clubId]
      ),
    ])

    console.log('Database results:', {
      membersResult: membersResult.rows,
      postsResult: postsResult.rows,
    })

    const stats = {
      membersCount: parseInt(membersResult.rows[0]?.count || '0'),
      postsCount: parseInt(postsResult.rows[0]?.count || '0'),
    }

    console.log(`Club ${clubId} stats computed:`, stats)
    return Response.json(stats)
  } catch (error) {
    console.error('Database error fetching club stats:', error)

    // ПОПРАВЕНО: Proper TypeScript error handling
    const errorMessage =
      error instanceof Error ? error.message : 'Неизвестна грешка'

    return Response.json(
      {
        error: 'Грешка при извличане на статистиките',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
