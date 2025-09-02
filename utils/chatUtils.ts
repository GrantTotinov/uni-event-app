// utils/chatUtils.ts
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/configs/FirebaseConfig'

interface UserInfo {
  email: string
  name: string
  image: string
  uid?: string
}

interface CreateDirectChatParams {
  currentUser: UserInfo
  targetUser: UserInfo
}

export const createDirectChat = async ({
  currentUser,
  targetUser,
}: CreateDirectChatParams): Promise<string> => {
  try {
    // Get user UIDs - prefer uid over email for better consistency
    const currentUserIdentifier = currentUser.uid || currentUser.email
    const targetUserIdentifier = targetUser.uid || targetUser.email

    console.log('Creating chat between:', {
      currentUser: currentUserIdentifier,
      targetUser: targetUserIdentifier,
    })

    // Create a consistent array of participants for searching
    const participantIds = [currentUserIdentifier, targetUserIdentifier].sort()

    // Search for existing chats more thoroughly
    // First, get all chats where current user is a participant
    const currentUserChatsQuery = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', currentUserIdentifier)
    )

    const currentUserChatsSnapshot = await getDocs(currentUserChatsQuery)

    // Check each chat to see if it's a direct chat with the target user
    let existingChatId: string | null = null

    for (const doc of currentUserChatsSnapshot.docs) {
      const chatData = doc.data()
      const participants = chatData.participants || []

      // Check if this is a direct chat (only 2 participants) and includes target user
      if (
        participants.length === 2 &&
        (participants.includes(targetUserIdentifier) ||
          participants.includes(targetUser.email))
      ) {
        existingChatId = doc.id
        console.log('Found existing chat:', existingChatId)
        break
      }
    }

    if (existingChatId) {
      return existingChatId
    }

    // Create new direct chat with proper participant handling
    const chatName = `${currentUser.name}, ${targetUser.name}`
    const participants = [currentUserIdentifier, targetUserIdentifier]

    console.log('Creating new chat with participants:', participants)

    const newChatRef = await addDoc(collection(db, 'chatRooms'), {
      name: chatName,
      participants,
      avatar: targetUser.image,
      createdAt: serverTimestamp(),
      createdBy: currentUserIdentifier,
      lastMessageTime: serverTimestamp(),
      isDirect: true, // Mark as direct chat
      // Add additional metadata for better querying
      participantEmails: [currentUser.email, targetUser.email].sort(),
      participantNames: [currentUser.name, targetUser.name].sort(),
    })

    console.log('Created new chat:', newChatRef.id)

    // Add initial system message
    await addDoc(collection(db, 'chatRooms', newChatRef.id, 'messages'), {
      text: `Чат стаята беше създадена от ${currentUser.name}`,
      user: {
        _id: 'system',
        name: 'Система',
        avatar: '',
      },
      createdAt: serverTimestamp(),
      system: true,
    })

    return newChatRef.id
  } catch (error) {
    console.error('Error creating direct chat:', error)
    throw new Error('Неуспешно създаване на чат')
  }
}

export const generateChatId = (user1Id: string, user2Id: string): string => {
  // Create consistent chat ID for direct messages
  return [user1Id, user2Id].sort().join('_')
}
