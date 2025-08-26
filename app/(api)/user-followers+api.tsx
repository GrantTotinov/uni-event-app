import { pool } from '@/configs/NilePostgresConfig'

// Създаване на последовател (follow user)
export async function POST(request: Request) {
  try {
    const { followerEmail, followingEmail } = await request.json()

    if (!followerEmail || !followingEmail) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }

    if (followerEmail === followingEmail) {
      return Response.json(
        { error: 'Не можете да последвате себе си' },
        { status: 400 }
      )
    }

    // Проверяваме дали вече съществува връзка
    const existingFollow = await pool.query(
      'SELECT id FROM user_followers WHERE follower_email = $1 AND following_email = $2',
      [followerEmail, followingEmail]
    )

    if (existingFollow.rows.length > 0) {
      return Response.json(
        { error: 'Вече следвате този потребител' },
        { status: 409 }
      )
    }

    const result = await pool.query(
      'INSERT INTO user_followers (follower_email, following_email) VALUES ($1, $2) RETURNING id',
      [followerEmail, followingEmail]
    )

    return Response.json({
      message: 'Успешно последвахте потребителя',
      followId: result.rows[0].id,
    })
  } catch (error) {
    console.error('Error following user:', error)
    return Response.json({ error: 'Грешка при последване' }, { status: 500 })
  }
}

// Извличане на последователи и следвани потребители
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const userEmail = url.searchParams.get('userEmail')
    const type = url.searchParams.get('type') // 'followers', 'following', or 'check'
    const targetEmail = url.searchParams.get('targetEmail')

    if (!userEmail) {
      return Response.json(
        { error: 'Липсва потребителски имейл' },
        { status: 400 }
      )
    }

    if (type === 'check' && targetEmail) {
      // Проверяваме дали userEmail следва targetEmail
      const result = await pool.query(
        'SELECT id FROM user_followers WHERE follower_email = $1 AND following_email = $2',
        [userEmail, targetEmail]
      )
      return Response.json({ isFollowing: result.rows.length > 0 })
    }

    if (type === 'followers') {
      // Връщаме последователите на потребителя
      const result = await pool.query(
        `
        SELECT u.name, u.email, u.image, u.role
        FROM user_followers uf
        JOIN users u ON uf.follower_email = u.email
        WHERE uf.following_email = $1
        ORDER BY uf.created_at DESC
      `,
        [userEmail]
      )
      return Response.json(result.rows)
    }

    if (type === 'following') {
      // Връщаме потребителите, които този потребител следва
      const result = await pool.query(
        `
        SELECT u.name, u.email, u.image, u.role
        FROM user_followers uf
        JOIN users u ON uf.following_email = u.email
        WHERE uf.follower_email = $1
        ORDER BY uf.created_at DESC
      `,
        [userEmail]
      )
      return Response.json(result.rows)
    }

    // Статистики
    const [followersCount, followingCount] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) FROM user_followers WHERE following_email = $1',
        [userEmail]
      ),
      pool.query(
        'SELECT COUNT(*) FROM user_followers WHERE follower_email = $1',
        [userEmail]
      ),
    ])

    return Response.json({
      followersCount: parseInt(followersCount.rows[0].count),
      followingCount: parseInt(followingCount.rows[0].count),
    })
  } catch (error) {
    console.error('Error getting user followers:', error)
    return Response.json(
      { error: 'Грешка при извличане на данни' },
      { status: 500 }
    )
  }
}

// Отписване от потребител (unfollow)
export async function DELETE(request: Request) {
  try {
    const { followerEmail, followingEmail } = await request.json()

    if (!followerEmail || !followingEmail) {
      return Response.json(
        { error: 'Липсват задължителни данни' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      'DELETE FROM user_followers WHERE follower_email = $1 AND following_email = $2 RETURNING id',
      [followerEmail, followingEmail]
    )

    if (result.rows.length === 0) {
      return Response.json(
        { error: 'Не следвате този потребител' },
        { status: 404 }
      )
    }

    return Response.json({ message: 'Успешно се отписахте' })
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return Response.json({ error: 'Грешка при отписване' }, { status: 500 })
  }
}
