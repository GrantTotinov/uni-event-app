import { StreamChat } from 'stream-chat'

const API_KEY =
  process.env.EXPO_PUBLIC_STREAM_CHAT_API_KEY ||
  process.env.EXPO_PUBLIC_STREAM_API_KEY ||
  ''

if (!API_KEY) {
  console.warn('Missing EXPO_PUBLIC_STREAM_CHAT_API_KEY in .env')
}

// Single client instance
export const chatClient = StreamChat.getInstance(API_KEY)

/**
 * Connect the logged-in user to Stream by Firebase UID.
 * Uses dev tokens for development only.
 */
export async function connectStreamUser(user: {
  id: string // Firebase UID
  name?: string
  image?: string
}) {
  try {
    if (!user?.id) return

    // Already connected as same user
    if (chatClient.userID === user.id) return

    // If connected as another user, disconnect first
    if (chatClient.userID && chatClient.userID !== user.id) {
      await chatClient.disconnectUser()
    }

    const token = chatClient.devToken(user.id)
    await chatClient.connectUser(
      {
        id: user.id,
        name: user.name || user.id,
        image: user.image,
      },
      token
    )
  } catch (e) {
    console.warn('Stream connectUser error:', e)
    throw e
  }
}

/**
 * Disconnect on logout.
 */
export async function disconnectStreamUser() {
  try {
    if (chatClient.userID) {
      await chatClient.disconnectUser()
    }
  } catch (e) {
    console.warn('Stream disconnectUser error:', e)
  }
}
