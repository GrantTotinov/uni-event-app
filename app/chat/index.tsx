// app/chat/index.tsx
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
} from 'react-native'
import { AuthContext } from '@/context/AuthContext'
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore'
import { db } from '@/configs/FirebaseConfig'
import Colors from '@/data/Colors'
import { useRouter, Href } from 'expo-router'

interface MessageData {
  id: string
  text?: string
  user?: {
    name?: string
    _id?: string
    avatar?: string
  }
  createdAt?: any
  system?: boolean
}

interface ChatRoom {
  id: string
  name?: string
  participants?: string[]
  participantEmails?: string[]
  lastMessageTime?: any
  lastMessage?: string
  avatar?: string
  lastMessageUser?: string
  unreadCount?: number
  isDirect?: boolean
}

export default function ChatList() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user, getUserUid } = useContext(AuthContext)
  const router = useRouter()

  // Memoized user identifiers to prevent unnecessary re-renders
  const userIdentifiers = useMemo(() => {
    const uid = getUserUid()
    const email = user?.email
    return { uid, email }
  }, [getUserUid, user?.email])

  useEffect(() => {
    if (!userIdentifiers.uid && !userIdentifiers.email) {
      setLoading(false)
      return
    }

    console.log('Setting up chat listener for user:', userIdentifiers)
    setError(null)

    // Simplified query approach to avoid permission issues
    const setupChatListener = async () => {
      try {
        const allChatRooms = new Map<string, ChatRoom>()
        const unsubscribeFunctions: (() => void)[] = []

        // Primary query by UID
        if (userIdentifiers.uid) {
          const primaryQuery = query(
            collection(db, 'chatRooms'),
            where('participants', 'array-contains', userIdentifiers.uid)
          )

          const unsubscribe1 = onSnapshot(
            primaryQuery,
            async (querySnapshot) => {
              console.log(
                'UID query result:',
                querySnapshot.docs.length,
                'docs'
              )
              await processQuerySnapshot(querySnapshot, allChatRooms)
            },
            (error) => {
              console.error('Error in UID chat listener:', error)
              setError('Грешка при зареждане на чатове (UID)')
            }
          )
          unsubscribeFunctions.push(unsubscribe1)
        }

        // Secondary query by email if different from UID
        if (
          userIdentifiers.email &&
          userIdentifiers.email !== userIdentifiers.uid
        ) {
          const emailQuery = query(
            collection(db, 'chatRooms'),
            where('participants', 'array-contains', userIdentifiers.email)
          )

          const unsubscribe2 = onSnapshot(
            emailQuery,
            async (querySnapshot) => {
              console.log(
                'Email query result:',
                querySnapshot.docs.length,
                'docs'
              )
              await processQuerySnapshot(querySnapshot, allChatRooms)
            },
            (error) => {
              console.error('Error in email chat listener:', error)
              // Don't set error for secondary query unless primary also fails
            }
          )
          unsubscribeFunctions.push(unsubscribe2)

          // Tertiary query by participantEmails
          const participantEmailsQuery = query(
            collection(db, 'chatRooms'),
            where('participantEmails', 'array-contains', userIdentifiers.email)
          )

          const unsubscribe3 = onSnapshot(
            participantEmailsQuery,
            async (querySnapshot) => {
              console.log(
                'ParticipantEmails query result:',
                querySnapshot.docs.length,
                'docs'
              )
              await processQuerySnapshot(querySnapshot, allChatRooms)
            },
            (error) => {
              console.error('Error in participantEmails chat listener:', error)
              // Don't set error for tertiary query
            }
          )
          unsubscribeFunctions.push(unsubscribe3)
        }

        const processQuerySnapshot = async (
          querySnapshot: any,
          chatRoomsMap: Map<string, ChatRoom>
        ) => {
          console.log(
            'Processing query snapshot with',
            querySnapshot.docs.length,
            'docs'
          )

          for (const chatDoc of querySnapshot.docs) {
            const chatData = chatDoc.data()
            console.log('Processing chat:', chatDoc.id, chatData)

            // Skip if already processed
            if (chatRoomsMap.has(chatDoc.id)) continue

            try {
              // Get last message without orderBy to avoid permission issues
              const lastMessageQuery = query(
                collection(db, 'chatRooms', chatDoc.id, 'messages'),
                limit(50) // Get recent messages and sort manually
              )

              const lastMessageSnapshot = await getDocs(lastMessageQuery)

              let lastMessage = ''
              let lastMessageUser = ''

              if (!lastMessageSnapshot.empty) {
                // Manually sort by createdAt and get the last message
                const sortedMessages = lastMessageSnapshot.docs
                  .map(
                    (doc) =>
                      ({
                        id: doc.id,
                        ...doc.data(),
                      } as MessageData)
                  )
                  .sort((a: MessageData, b: MessageData) => {
                    const aTime = a.createdAt?.seconds || 0
                    const bTime = b.createdAt?.seconds || 0
                    return bTime - aTime
                  })

                if (sortedMessages.length > 0) {
                  const lastMsg = sortedMessages[0]
                  // Fixed: Properly access text and user properties
                  lastMessage = String(lastMsg.text || '')
                  lastMessageUser = String(lastMsg.user?.name || '')
                }
              }

              const chatRoom: ChatRoom = {
                id: chatDoc.id,
                name: String(chatData.name || 'Чат'),
                participants: chatData.participants || [],
                participantEmails: chatData.participantEmails || [],
                lastMessageTime: chatData.lastMessageTime?.toDate?.() || null,
                avatar: String(chatData.avatar || ''),
                lastMessage,
                lastMessageUser,
                unreadCount: 0,
                isDirect: chatData.isDirect || false,
              }

              chatRoomsMap.set(chatDoc.id, chatRoom)
            } catch (messageError) {
              console.error(
                'Error getting messages for chat:',
                chatDoc.id,
                messageError
              )
              // Still add the chat room without last message info
              const chatRoom: ChatRoom = {
                id: chatDoc.id,
                name: String(chatData.name || 'Чат'),
                participants: chatData.participants || [],
                participantEmails: chatData.participantEmails || [],
                lastMessageTime: chatData.lastMessageTime?.toDate?.() || null,
                avatar: String(chatData.avatar || ''),
                lastMessage: '',
                lastMessageUser: '',
                unreadCount: 0,
                isDirect: chatData.isDirect || false,
              }
              chatRoomsMap.set(chatDoc.id, chatRoom)
            }
          }

          // Update state with all unique chat rooms
          const uniqueChatRooms = Array.from(chatRoomsMap.values()).sort(
            (a, b) => {
              if (!a.lastMessageTime && !b.lastMessageTime) return 0
              if (!a.lastMessageTime) return 1
              if (!b.lastMessageTime) return -1
              return b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
            }
          )

          console.log('Setting chat rooms:', uniqueChatRooms.length)
          setChatRooms(uniqueChatRooms)
          setLoading(false)
          setError(null)
        }

        return () => {
          unsubscribeFunctions.forEach((unsub) => unsub())
        }
      } catch (setupError) {
        console.error('Error setting up chat listeners:', setupError)
        setError('Грешка при настройване на чат листенърите')
        setLoading(false)
      }
    }

    const cleanup = setupChatListener()
    return () => {
      cleanup.then((cleanupFn) => cleanupFn?.())
    }
  }, [userIdentifiers.uid, userIdentifiers.email])

  // Memoized utility functions for performance
  const formatTime = useCallback((timestamp: any) => {
    if (!timestamp) return ''
    const date =
      timestamp instanceof Date
        ? timestamp
        : timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (diffInDays === 0) {
      return date.toLocaleTimeString('bg-BG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    } else if (diffInDays === 1) return 'Вчера'
    else if (diffInDays < 7)
      return date.toLocaleDateString('bg-BG', { weekday: 'short' })
    else
      return date.toLocaleDateString('bg-BG', {
        day: '2-digit',
        month: '2-digit',
      })
  }, [])

  const truncateMessage = useCallback(
    (message?: string, maxLength: number = 35) => {
      if (!message) return ''
      if (message.length <= maxLength) return message
      return message.substring(0, maxLength) + '...'
    },
    []
  )

  // Navigation handler
  const handleChatPress = useCallback(
    (chatId: string) => {
      router.push(`/chat/${chatId}` as Href)
    },
    [router]
  )

  // Optimized render function with proper text wrapping
  const renderChatItem = useCallback(
    ({ item }: { item: ChatRoom }) => {
      const formattedTime = formatTime(item.lastMessageTime)
      const isMyLastMessage = item.lastMessageUser === user?.name

      return (
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => handleChatPress(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.chatContent}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: item.avatar || 'https://placehold.co/600x400' }}
                style={styles.avatar}
              />
              {item.unreadCount != null && item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>
                    {item.unreadCount > 99 ? '99+' : String(item.unreadCount)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName} numberOfLines={1}>
                  {String(item.name || 'Чат')}
                </Text>
                {formattedTime ? (
                  <Text style={styles.timeText}>{String(formattedTime)}</Text>
                ) : null}
              </View>
              {item.lastMessage ? (
                <View style={styles.lastMessageContainer}>
                  <Text style={styles.lastMessageText} numberOfLines={1}>
                    {isMyLastMessage &&
                    !item.lastMessage?.startsWith('Чат стаята')
                      ? `Вие: ${truncateMessage(item.lastMessage)}`
                      : truncateMessage(item.lastMessage)}
                  </Text>
                  {item.unreadCount && item.unreadCount > 0 ? (
                    <View style={styles.unreadIndicator} />
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      )
    },
    [formatTime, truncateMessage, handleChatPress, user?.name]
  )

  // Memoized key extractor
  const keyExtractor = useCallback((item: ChatRoom) => item.id, [])

  // Memoized empty component
  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          {error ? 'Грешка при зареждане' : 'Все още нямате чатове'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {error ? error : 'Започнете разговор с приятелите си'}
        </Text>
      </View>
    ),
    [error]
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Зареждане на чатове...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={Colors.PRIMARY} barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Чатове</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Text style={styles.headerButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={chatRooms}
        renderItem={renderChatItem}
        keyExtractor={keyExtractor}
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={ListEmptyComponent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        getItemLayout={(data, index) => ({
          length: 80,
          offset: 80 * index,
          index,
        })}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.GRAY,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  headerActions: { flexDirection: 'row' },
  headerButton: { padding: 8 },
  headerButtonText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  chatList: { flex: 1 },
  chatItem: { backgroundColor: '#FFFFFF', height: 80 },
  chatContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    height: '100%',
  },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E5DDD5',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#25D366',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  chatInfo: { flex: 1, justifyContent: 'center' },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  timeText: { fontSize: 13, color: '#8696A0' },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageText: { fontSize: 14, color: '#667781', flex: 1, marginRight: 8 },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#25D366',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#41525D',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#667781',
    textAlign: 'center',
    lineHeight: 22,
  },
})
