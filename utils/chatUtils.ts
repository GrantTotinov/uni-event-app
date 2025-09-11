// File: utils/chatUtils.ts
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  serverTimestamp,
  orderBy,
  limit,
  doc,
  deleteDoc,
  writeBatch,
  FieldPath, // FIXED: Add this import
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

export const deleteChatRoom = async (
  chatId: string,
  userEmail: string
): Promise<void> => {
  try {
    console.log('🗑️ Starting chat deletion:', { chatId, userEmail })

    // FIXED: Simplified approach - get document directly
    const chatRef = doc(db, 'chatRooms', chatId)
    const chatSnap = await getDoc(chatRef)

    if (!chatSnap.exists()) {
      throw new Error('Чатът не съществува')
    }

    const chatData = chatSnap.data()
    const participantEmails = chatData.participantEmails || []
    const participants = chatData.participants || []

    // Check if user is participant
    const isParticipant =
      participantEmails.includes(userEmail) || participants.includes(userEmail)

    if (!isParticipant) {
      throw new Error('Нямате право да изтриете този чат')
    }

    // Use batch for atomic deletion
    const batch = writeBatch(db)

    // Delete all messages first
    const messagesQuery = query(collection(db, 'chatRooms', chatId, 'messages'))
    const messagesSnapshot = await getDocs(messagesQuery)

    console.log(`🗑️ Deleting ${messagesSnapshot.docs.length} messages`)

    // Add message deletions to batch
    messagesSnapshot.docs.forEach((messageDoc) => {
      batch.delete(messageDoc.ref)
    })

    // Add chat room deletion to batch
    batch.delete(chatRef)

    // Execute batch
    await batch.commit()

    console.log('✅ Chat deleted successfully:', chatId)
  } catch (error) {
    console.error('❌ Error deleting chat:', error)

    // Better error messages
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        throw new Error('Нямате права за изтриване на този чат')
      } else if (error.message.includes('not-found')) {
        throw new Error('Чатът не съществува')
      } else {
        throw new Error(error.message)
      }
    } else {
      throw new Error('Неуспешно изтриване на чат')
    }
  }
}

// Better permission checking
export const canDeleteChat = async (
  chatId: string,
  userEmail: string
): Promise<boolean> => {
  try {
    const chatRef = doc(db, 'chatRooms', chatId)
    const chatSnap = await getDoc(chatRef)

    if (!chatSnap.exists()) return false

    const chatData = chatSnap.data()
    const participantEmails = chatData.participantEmails || []
    const participants = chatData.participants || []

    return (
      participantEmails.includes(userEmail) || participants.includes(userEmail)
    )
  } catch (error) {
    console.error('Error checking delete permissions:', error)
    return false
  }
}

export const createDirectChat = async ({
  currentUser,
  targetUser,
}: CreateDirectChatParams): Promise<string> => {
  try {
    // Get user identifiers - prefer uid over email for consistency
    const currentUserIdentifier = currentUser.uid || currentUser.email
    const targetUserIdentifier = targetUser.uid || targetUser.email

    console.log('🔍 Searching for existing chat between:', {
      currentUser: currentUserIdentifier,
      targetUser: targetUserIdentifier,
    })

    // Search for existing chats where current user is participant
    const currentUserChatsQuery = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', currentUserIdentifier),
      where('isDirect', '==', true) // Only direct chats
    )

    const currentUserChatsSnapshot = await getDocs(currentUserChatsQuery)
    console.log(
      `📋 Found ${currentUserChatsSnapshot.docs.length} direct chats for current user`
    )

    // Check each chat to see if it contains the target user
    for (const doc of currentUserChatsSnapshot.docs) {
      const chatData = doc.data()
      const participants = chatData.participants || []
      const participantEmails = chatData.participantEmails || []

      console.log('🔍 Checking chat:', {
        chatId: doc.id,
        participants,
        participantEmails,
        isDirect: chatData.isDirect,
      })

      // Check if this is a direct chat with exactly 2 participants
      if (participants.length === 2 && chatData.isDirect === true) {
        // Check if target user is in participants
        const hasTargetUser =
          participants.includes(targetUserIdentifier) ||
          participants.includes(targetUser.email) ||
          participantEmails.includes(targetUser.email) ||
          participantEmails.includes(targetUserIdentifier)

        if (hasTargetUser) {
          console.log('✅ Found existing direct chat:', doc.id)
          return doc.id
        }
      }
    }

    // Additional search by email if not found
    if (currentUser.email !== currentUserIdentifier) {
      console.log('🔍 Searching by email as fallback...')

      const emailChatsQuery = query(
        collection(db, 'chatRooms'),
        where('participantEmails', 'array-contains', currentUser.email),
        where('isDirect', '==', true)
      )

      const emailChatsSnapshot = await getDocs(emailChatsQuery)

      for (const doc of emailChatsSnapshot.docs) {
        const chatData = doc.data()
        const participantEmails = chatData.participantEmails || []

        if (
          participantEmails.length === 2 &&
          (participantEmails.includes(targetUser.email) ||
            participantEmails.includes(targetUserIdentifier))
        ) {
          console.log('✅ Found existing chat by email:', doc.id)
          return doc.id
        }
      }
    }

    console.log('❌ No existing chat found. Creating new one...')

    // Create new direct chat
    const chatName = `${currentUser.name}, ${targetUser.name}`
    const participants = [currentUserIdentifier, targetUserIdentifier].sort()
    const participantEmails = [currentUser.email, targetUser.email].sort()

    console.log('🆕 Creating new chat with:', {
      chatName,
      participants,
      participantEmails,
    })

    const newChatRef = await addDoc(collection(db, 'chatRooms'), {
      name: chatName,
      participants,
      participantEmails,
      avatar: targetUser.image || 'https://placehold.co/120x120',
      createdAt: serverTimestamp(),
      createdBy: currentUserIdentifier,
      lastMessageTime: serverTimestamp(),
      isDirect: true,
      // Metadata for easier searching
      participantNames: [currentUser.name, targetUser.name].sort(),
      participantCount: 2,
    })

    console.log('✅ Created new chat:', newChatRef.id)

    // Add initial system message
    await addDoc(collection(db, 'chatRooms', newChatRef.id, 'messages'), {
      text: `Чат стаята беше създадена между ${currentUser.name} и ${targetUser.name}`,
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
    console.error('❌ Error in createDirectChat:', error)
    throw new Error('Неуспешно създаване/намиране на чат')
  }
}

// Utility function for generating consistent chat ID
export const generateChatId = (user1Id: string, user2Id: string): string => {
  return [user1Id, user2Id].sort().join('_')
}

// Function for finding duplicate chats (for debugging)
export const findDuplicateChats = async (userEmail: string) => {
  try {
    const chatsQuery = query(
      collection(db, 'chatRooms'),
      where('participantEmails', 'array-contains', userEmail),
      where('isDirect', '==', true)
    )

    const snapshot = await getDocs(chatsQuery)
    const chatsByParticipants = new Map<string, string[]>()

    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      const participantKey = data.participantEmails?.sort().join('|') || ''

      if (!chatsByParticipants.has(participantKey)) {
        chatsByParticipants.set(participantKey, [])
      }
      chatsByParticipants.get(participantKey)!.push(doc.id)
    })

    const duplicates: string[][] = []
    chatsByParticipants.forEach((chatIds, participants) => {
      if (chatIds.length > 1) {
        duplicates.push(chatIds)
        console.log(`🔍 Duplicate chats found for ${participants}:`, chatIds)
      }
    })

    return duplicates
  } catch (error) {
    console.error('Error finding duplicates:', error)
    return []
  }
}
