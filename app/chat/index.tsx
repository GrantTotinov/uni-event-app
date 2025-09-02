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
} from 'firebase/firestore'
import { db } from '@/configs/FirebaseConfig'
import Colors from '@/data/Colors'
import { useRouter, Href } from 'expo-router'

interface ChatRoom {
  id: string
  name?: string
  participants?: string[]
  lastMessageTime?: any
  lastMessage?: string
  avatar?: string
  lastMessageUser?: string
  unreadCount?: number
}

export default function ChatList() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [loading, setLoading] = useState(true)
  const { user, getUserUid } = useContext(AuthContext)
  const router = useRouter()

  // Memoized user UID to prevent unnecessary re-renders
  const uid = useMemo(() => getUserUid(), [getUserUid])

  useEffect(() => {
    if (!uid) {
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', uid),
      orderBy('lastMessageTime', 'desc')
    )

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const rooms: ChatRoom[] = []

      for (const chatDoc of querySnapshot.docs) {
        const chatData = chatDoc.data()

        const lastMessageQuery = query(
          collection(db, 'chatRooms', chatDoc.id, 'messages'),
          orderBy('createdAt', 'desc'),
          limit(1)
        )

        const lastMessageSnapshot = (await new Promise((resolve) => {
          const unsub = onSnapshot(
            lastMessageQuery,
            (snapshot) => {
              resolve(snapshot)
              unsub()
            },
            () => {
              resolve(null)
              unsub()
            }
          )
        })) as any

        let lastMessage = ''
        let lastMessageUser = ''

        if (lastMessageSnapshot && !lastMessageSnapshot.empty) {
          const lastMsg = lastMessageSnapshot.docs[0].data()
          // Ensure these are always strings
          lastMessage = String(lastMsg.text || '')
          lastMessageUser = String(lastMsg.user?.name || '')
        }

        rooms.push({
          id: chatDoc.id,
          name: String(chatData.name || 'Чат'),
          participants: chatData.participants || [],
          lastMessageTime: chatData.lastMessageTime?.toDate?.() || null,
          avatar: String(chatData.avatar || ''),
          lastMessage,
          lastMessageUser,
          unreadCount: 0,
        })
      }

      setChatRooms(rooms)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [uid])

  // Memoized utility functions for performance
  const formatTime = useCallback((timestamp: any) => {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
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
        <Text style={styles.emptyTitle}>Все още нямате чатове</Text>
        <Text style={styles.emptySubtitle}>
          Започнете разговор с приятелите си
        </Text>
      </View>
    ),
    []
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
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
  chatItem: { backgroundColor: '#FFFFFF', height: 80 }, // Fixed height for getItemLayout
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
