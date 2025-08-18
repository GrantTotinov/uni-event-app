import React, {
  useCallback,
  useEffect,
  useState,
  useContext,
  useRef,
} from 'react'
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import {
  addDoc,
  collection,
  doc,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { onAuthStateChanged, Unsubscribe } from 'firebase/auth'
import { Ionicons } from '@expo/vector-icons'

import { auth } from '@/configs/FirebaseConfig'
import { AuthContext } from '@/context/AuthContext'
import Colors from '@/data/Colors'

type ChatRoom = {
  id: string
  name: string
  createdAt: Date
  lastMessageTime: Date
  participants: string[]
  createdBy: string
  avatar?: string
}

type ChatMessage = {
  id: string
  text: string
  createdAt: Date
  user: {
    id: string
    name: string
    avatar?: string
  }
}

export default function ChatPage() {
  const { user } = useContext(AuthContext)
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [authReady, setAuthReady] = useState(false)
  const [authRetryCount, setAuthRetryCount] = useState(0)
  const [inputText, setInputText] = useState('')
  const db = getFirestore()
  const scrollViewRef = useRef<ScrollView>(null)

  useEffect(() => {
    let authUnsubscribe: Unsubscribe | null = null

    const initializeAuth = async () => {
      try {
        if (!auth.currentUser && user?.email) {
          console.log('Context user found but no Firebase user')
        }
        authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (user?.email && !firebaseUser) {
            if (authRetryCount < 3) {
              setAuthRetryCount((prev) => prev + 1)
              setTimeout(() => setAuthReady(true), 1000)
              return
            } else {
              Alert.alert(
                'Проблем с автентикацията',
                'Моля, излезте и влезте отново в профила си.',
                [{ text: 'ОК' }]
              )
              return
            }
          }
          setAuthReady(true)
        })
      } catch (error) {
        setAuthReady(true)
      }
    }

    initializeAuth()

    return () => {
      if (authUnsubscribe) {
        authUnsubscribe()
      }
    }
  }, [user, authRetryCount])

  const validateAuthentication = useCallback(() => {
    if (!authReady) return false
    if (!auth.currentUser?.uid) return false
    if (!user?.email || !user?.name) return false
    return true
  }, [user, authReady])

  useEffect(() => {
    if (!authReady) return
    if (!validateAuthentication()) {
      setLoading(false)
      return
    }
    const currentUserUid = auth.currentUser?.uid
    if (!currentUserUid) {
      setLoading(false)
      return
    }
    setLoading(true)
    const chatRoomsRef = collection(db, 'chatRooms')
    const chatRoomsQuery = query(
      chatRoomsRef,
      where('participants', 'array-contains', currentUserUid)
    )
    const unsubscribe = onSnapshot(
      chatRoomsQuery,
      (snapshot) => {
        const rooms: ChatRoom[] = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              name: data.name || 'Unnamed Room',
              createdAt: data.createdAt?.toDate() || new Date(),
              lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
              participants: data.participants || [],
              createdBy: data.createdBy || '',
              avatar: data.avatar || '',
            }
          })
          .sort(
            (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
          )
        setChatRooms(rooms)
        setLoading(false)
      },
      (error) => {
        setLoading(false)
        Alert.alert('Грешка при зареждане', error.message)
      }
    )
    return () => unsubscribe()
  }, [db, validateAuthentication, authReady])

  useEffect(() => {
    if (!selectedRoom) {
      setMessages([])
      return
    }
    if (!validateAuthentication()) return
    setMessagesLoading(true)
    const messagesRef = collection(db, 'chats', selectedRoom, 'messages')
    const messagesQuery = query(messagesRef)
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const loadedMessages: ChatMessage[] = snapshot.docs
          .map((doc) => {
            const data = doc.data()
            return {
              id: doc.id,
              text: data.text || '',
              createdAt: data.createdAt?.toDate() || new Date(),
              user: {
                id: data.user?._id || data.user?.id || 'unknown',
                name: data.user?.name || 'Неизвестен потребител',
                avatar: data.user?.avatar || undefined,
              },
            }
          })
          .sort((a, b) => {
            const dateA =
              a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
            const dateB =
              b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
            return dateA.getTime() - dateB.getTime()
          })
        setMessages(loadedMessages)
        setMessagesLoading(false)
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }, 100)
      },
      (error) => {
        setMessagesLoading(false)
        Alert.alert('Грешка при зареждане на съобщения', error.message)
      }
    )
    return () => unsubscribe()
  }, [db, selectedRoom, validateAuthentication])

  const createChatRoom = async () => {
    if (!validateAuthentication()) {
      Alert.alert('Грешка', 'Трябва да сте влезли в профила си.')
      return
    }
    const currentUserUid = auth.currentUser?.uid
    if (!currentUserUid) {
      Alert.alert(
        'Грешка',
        'Не може да се определи потребителския идентификатор.'
      )
      return
    }
    try {
      const roomId = `chat_${Date.now()}`
      const chatRoomRef = doc(db, 'chatRooms', roomId)
      const roomData = {
        name: 'Общ чат',
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        participants: [currentUserUid],
        createdBy: currentUserUid,
        avatar: 'https://via.placeholder.com/100',
      }
      await setDoc(chatRoomRef, roomData)
      const messagesRef = collection(db, 'chats', roomId, 'messages')
      await addDoc(messagesRef, {
        text: 'Чат стаята е създадена',
        createdAt: serverTimestamp(),
        user: {
          _id: 'system',
          name: 'Система',
        },
      })
      Alert.alert('Успех', 'Чат стаята е създадена успешно!')
    } catch (error) {
      Alert.alert(
        'Грешка при създаване на чат стая',
        error instanceof Error ? error.message : 'Неизвестна грешка'
      )
    }
  }

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedRoom) return
    if (!validateAuthentication()) {
      Alert.alert('Грешка', 'Трябва да сте влезли в профила си.')
      return
    }
    const currentUserUid = auth.currentUser?.uid
    if (!currentUserUid) {
      Alert.alert(
        'Грешка',
        'Не може да се определи потребителския идентификатор.'
      )
      return
    }
    try {
      const messagesRef = collection(db, 'chats', selectedRoom, 'messages')
      await addDoc(messagesRef, {
        text: inputText.trim(),
        createdAt: serverTimestamp(),
        user: {
          _id: currentUserUid,
          name: user?.name || 'Потребител',
          avatar: user?.image || undefined,
        },
      })
      const chatRoomRef = doc(db, 'chatRooms', selectedRoom)
      await updateDoc(chatRoomRef, {
        lastMessageTime: serverTimestamp(),
      })
      setInputText('')
    } catch (error) {
      Alert.alert(
        'Грешка при изпращане на съобщение',
        error instanceof Error ? error.message : 'Неизвестна грешка'
      )
    }
  }

  const renderChatRoom = ({ item }: { item: ChatRoom }) => (
    <TouchableOpacity
      style={[
        styles.chatRoomItem,
        selectedRoom === item.id && styles.selectedChatRoom,
      ]}
      onPress={() => setSelectedRoom(item.id)}
    >
      <Image
        source={{ uri: item.avatar || 'https://via.placeholder.com/50' }}
        style={styles.chatRoomAvatar}
      />
      <View style={styles.chatRoomInfo}>
        <Text style={styles.chatRoomName}>{item.name}</Text>
        <Text style={styles.chatRoomTime}>
          {item.lastMessageTime.toLocaleTimeString('bg-BG', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </TouchableOpacity>
  )

  if (!authReady || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.PRIMARY} size="large" />
        <Text style={styles.loadingText}>
          {!authReady
            ? 'Проверяване на автентикация...'
            : 'Зареждане на чат стаи...'}
        </Text>
      </View>
    )
  }

  if (!selectedRoom) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Чат стаи</Text>
          <TouchableOpacity
            onPress={createChatRoom}
            style={styles.createButton}
          >
            <Ionicons name="add" size={24} color={Colors.WHITE} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={chatRooms}
          renderItem={renderChatRoom}
          keyExtractor={(item) => item.id}
          style={styles.chatRoomsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Няма налични чат стаи</Text>
              <TouchableOpacity
                onPress={createChatRoom}
                style={styles.createFirstButton}
              >
                <Text style={styles.createFirstButtonText}>
                  Създайте първата чат стая
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    )
  }

  const selectedRoomData = chatRooms.find((room) => room.id === selectedRoom)

  return (
    <View style={styles.container}>
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => setSelectedRoom(null)}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.chatTitle}>{selectedRoomData?.name || 'Чат'}</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 34 : 0}
      >
        {messagesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.PRIMARY} size="small" />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ padding: 10, paddingBottom: 80 }}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map((msg) => (
              <View key={msg.id} style={styles.messageItem}>
                <Image
                  source={{
                    uri: msg.user.avatar || 'https://via.placeholder.com/36',
                  }}
                  style={styles.avatar}
                />
                <View style={styles.messageContent}>
                  <Text style={styles.messageUser}>{msg.user.name}</Text>
                  <Text style={styles.messageText}>{msg.text}</Text>
                  <Text style={styles.messageTime}>
                    {msg.createdAt instanceof Date
                      ? msg.createdAt.toLocaleTimeString('bg-BG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Напишете съобщение..."
            placeholderTextColor={Colors.GRAY}
            multiline
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={22} color={Colors.WHITE} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.GRAY,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  createButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 20,
    padding: 8,
  },
  chatRoomsList: {
    flex: 1,
  },
  chatRoomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  selectedChatRoom: {
    backgroundColor: Colors.LIGHT_GRAY,
  },
  chatRoomAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  chatRoomInfo: {
    flex: 1,
  },
  chatRoomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  chatRoomTime: {
    fontSize: 12,
    color: Colors.GRAY,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.GRAY,
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 15,
    borderRadius: 10,
  },
  createFirstButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
    backgroundColor: Colors.WHITE,
  },
  backButton: {
    marginRight: 15,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: Colors.LIGHT_GRAY,
  },
  messageContent: {
    flex: 1,
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 12,
    padding: 10,
  },
  messageUser: {
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: Colors.BLACK,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.GRAY,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.LIGHT_GRAY,
    backgroundColor: Colors.WHITE,
  },
  input: {
    flex: 1,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.WHITE,
    marginRight: 8,
    minHeight: 40,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
