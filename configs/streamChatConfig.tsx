import { StreamChat } from 'stream-chat'

const API_KEY = process.env.EXPO_PUBLIC_STREAM_CHAT_API_KEY || ''

if (!API_KEY) {
  console.warn('Missing EXPO_PUBLIC_STREAM_CHAT_API_KEY in .env')
}

// Single client instance
export const chatClient = StreamChat.getInstance(API_KEY)

/**
 * Generate dev token for a user (development only!)
 * In production, generate tokens on your backend server
 */
export const generateUserToken = (userId: string): string => {
  return chatClient.devToken(userId)
}

/**
 * Create user data object from Firebase user info
 */
export const createStreamUserData = (firebaseUser: {
  uid: string
  displayName?: string | null
  photoURL?: string | null
  email?: string | null
}) => ({
  id: firebaseUser.uid,
  name: firebaseUser.displayName || firebaseUser.email || firebaseUser.uid,
  image: firebaseUser.photoURL || undefined,
})

/**
 * Connect the logged-in user to Stream by Firebase UID.
 * This is handled by useCreateChatClient hook in ChatWrapper
 */
export async function connectStreamUser(user: {
  id: string
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

    const token = generateUserToken(user.id)
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
