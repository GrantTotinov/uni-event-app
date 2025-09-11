// File: app/chat/[id].tsx
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Keyboard,
  Dimensions,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/configs/FirebaseConfig'
import Colors from '@/data/Colors'
import { deleteChatRoom, canDeleteChat } from '@/utils/chatUtils'

interface Message {
  id: string
  text: string
  user: {
    _id: string
    name: string
    avatar: string
  }
  createdAt: any
  system?: boolean
}

const { height: screenHeight } = Dimensions.get('window')

// ОПТИМИЗИРАНО: Memoized Message Component за по-добра производителност
const MessageItem = React.memo(
  ({
    item,
    index,
    messages,
    getUserUid,
    formatTime,
    safeText,
  }: {
    item: Message
    index: number
    messages: Message[]
    getUserUid: () => string | null
    formatTime: (timestamp: any) => string
    safeText: (value: any) => string
  }) => {
    const isMyMessage = item.user._id === getUserUid()
    const showAvatar =
      !isMyMessage &&
      (index === 0 || messages[index - 1]?.user._id !== item.user._id)

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage && styles.myMessageContainer,
        ]}
      >
        {showAvatar && (
          <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        )}
        <View
          style={[
            styles.messageWrapper,
            !showAvatar && !isMyMessage && styles.messageWrapperNoAvatar,
          ]}
        >
          {!isMyMessage && showAvatar && (
            <Text style={styles.senderName}>{safeText(item.user.name)}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessage : styles.otherMessage,
              item.system && styles.systemMessage,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
                item.system && styles.systemMessageText,
              ]}
            >
              {safeText(item.text)}
            </Text>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
              ]}
            >
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    )
  }
)

// ОПТИМИЗИРАНО: Main Chat Component
const ChatRoom = React.memo(function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatRoom, setChatRoom] = useState<any>(null)
  const [canDelete, setCanDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  // ОПТИМИЗИРАНО: Spam protection с по-кратки интервали
  const [isSending, setIsSending] = useState(false)
  const [lastSentTime, setLastSentTime] = useState(0)
  const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const duplicateCheckRef = useRef<string>('')
  const flatListRef = useRef<FlatList>(null)

  // ОПТИМИЗИРАНО: Performance settings
  const SEND_DELAY = 300 // 300ms като Messenger
  const DUPLICATE_CHECK_DELAY = 2000
  const MIN_MESSAGE_LENGTH = 1
  const MAX_MESSAGE_LENGTH = 1000

  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { user, getUserUid } = useContext(AuthContext)

  // ОПТИМИЗИРАНО: Memoized utility functions
  const safeText = useCallback((value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value !== 'string') return String(value)
    return value
  }, [])

  const formatTime = useCallback((timestamp: any): string => {
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
    } else if (diffInDays === 1) {
      return (
        'Вчера ' +
        date.toLocaleTimeString('bg-BG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      )
    } else {
      return date.toLocaleDateString('bg-BG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    }
  }, [])

  // ПОПРАВЕНО: Keyboard listeners за по-добро управление
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height)
        // ОПТИМИЗИРАНО: Scroll до дъното при отваряне на клавиатурата
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true })
        }, 100)
      }
    )

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0)
      }
    )

    return () => {
      keyboardWillShowListener.remove()
      keyboardWillHideListener.remove()
    }
  }, [])

  // Check delete permissions
  useEffect(() => {
    const checkDeletePermissions = async () => {
      if (!id || !user?.email) return

      try {
        const canDeleteResult = await canDeleteChat(id as string, user.email)
        setCanDelete(canDeleteResult)
      } catch (error) {
        console.error('Error checking delete permissions:', error)
        setCanDelete(false)
      }
    }

    checkDeletePermissions()
  }, [id, user?.email])

  // ОПТИМИЗИРАНО: Real-time listeners с по-добра производителност
  useEffect(() => {
    if (!id) return

    const chatRoomRef = doc(db, 'chatRooms', id as string)
    const unsubscribeChatRoom = onSnapshot(chatRoomRef, (doc) => {
      if (doc.exists()) {
        setChatRoom({ id: doc.id, ...doc.data() })
      }
    })

    const q = query(
      collection(db, 'chatRooms', id as string, 'messages'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        msgs.push({
          id: doc.id,
          text: data.text,
          user: data.user,
          createdAt: data.createdAt,
          system: data.system,
        })
      })
      setMessages(msgs)

      // ОПТИМИЗИРАНО: Auto-scroll до дъното при нови съобщения
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    })

    return () => {
      unsubscribeChatRoom()
      unsubscribeMessages()
    }
  }, [id])

  // ОПТИМИЗИРАНО: Message sending с по-добра производителност
  const sendMessage = useCallback(async () => {
    const trimmedMessage = newMessage.trim()

    if (!trimmedMessage || !user || !id) return
    if (trimmedMessage.length < MIN_MESSAGE_LENGTH) return
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      Alert.alert(
        'Съобщението е твърде дълго',
        `Максимум ${MAX_MESSAGE_LENGTH} символа`
      )
      return
    }

    const uid = getUserUid()
    if (!uid) return

    const now = Date.now()

    if (isSending) {
      console.log('⏳ Message sending in progress, ignoring duplicate request')
      return
    }

    if (now - lastSentTime < SEND_DELAY) {
      console.log('⏳ Rate limited, ignoring send request')
      return
    }

    if (
      duplicateCheckRef.current === trimmedMessage &&
      now - lastSentTime < DUPLICATE_CHECK_DELAY
    ) {
      console.log('⏳ Duplicate message detected, ignoring')
      return
    }

    if (sendTimeoutRef.current) {
      clearTimeout(sendTimeoutRef.current)
      sendTimeoutRef.current = null
    }

    setIsSending(true)
    duplicateCheckRef.current = trimmedMessage
    setLastSentTime(now)

    try {
      // ОПТИМИЗИРАНО: Clear input веднага за по-бърз отговор
      setNewMessage('')

      await addDoc(collection(db, 'chatRooms', id as string, 'messages'), {
        text: trimmedMessage,
        user: {
          _id: uid,
          name: user.name,
          avatar: user.image,
        },
        createdAt: serverTimestamp(),
      })

      await updateDoc(doc(db, 'chatRooms', id as string), {
        lastMessageTime: serverTimestamp(),
      })

      console.log('✅ Message sent successfully')
    } catch (error) {
      console.error('❌ Error sending message:', error)
      setNewMessage(trimmedMessage)
      Alert.alert(
        'Грешка при изпращане',
        'Съобщението не можа да бъде изпратено. Опитайте отново.'
      )
    } finally {
      sendTimeoutRef.current = setTimeout(() => {
        setIsSending(false)
        sendTimeoutRef.current = null
      }, SEND_DELAY)
    }
  }, [newMessage, user, id, getUserUid, lastSentTime, isSending])

  // ОПТИМИЗИРАНО: Delete chat function
  const handleDeleteChat = useCallback(() => {
    if (!canDelete || !user?.email || !id) return

    Alert.alert(
      'Изтриване на чат',
      'Сигурни ли сте, че искате да изтриете този чат? Това действие е необратимо и ще премахне всички съобщения.',
      [
        {
          text: 'Отказ',
          style: 'cancel',
        },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true)
            try {
              await deleteChatRoom(id as string, user.email)
              Alert.alert('Успех', 'Чатът беше изтрит успешно', [
                { text: 'OK', onPress: () => router.back() },
              ])
            } catch (error) {
              console.error('Error deleting chat:', error)
              const errorMessage =
                error instanceof Error
                  ? error.message
                  : 'Неуспешно изтриване на чат'

              Alert.alert('Грешка', errorMessage)
            } finally {
              setIsDeleting(false)
            }
          },
        },
      ]
    )
  }, [canDelete, user?.email, id, router])

  // ОПТИМИЗИРАНО: Memoized render function за по-добра производителност
  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => (
      <MessageItem
        item={item}
        index={index}
        messages={messages}
        getUserUid={getUserUid}
        formatTime={formatTime}
        safeText={safeText}
      />
    ),
    [messages, getUserUid, formatTime, safeText]
  )

  // ОПТИМИЗИРАНО: Memoized props за FlatList
  const keyExtractor = useCallback((item: Message) => item.id, [])

  const getItemLayout = useCallback(
    (data: any, index: number) => ({
      length: 80,
      offset: 80 * index,
      index,
    }),
    []
  )

  // ОПТИМИЗИРАНО: Memoized computed values
  const canSendMessage = useMemo(
    () =>
      newMessage.trim().length >= MIN_MESSAGE_LENGTH &&
      newMessage.trim().length <= MAX_MESSAGE_LENGTH &&
      !isSending,
    [newMessage, isSending]
  )

  const inputContainerPaddingBottom = useMemo(
    () => Math.max(10, keyboardHeight > 0 ? 10 : 10),
    [keyboardHeight]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (sendTimeoutRef.current) {
        clearTimeout(sendTimeoutRef.current)
      }
    }
  }, [])

  if (!chatRoom) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Зареждане на чат...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* ПОПРАВЕНО: Header с по-добро позициониране */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Image
          source={{
            uri: safeText(chatRoom.avatar || 'https://placehold.co/40x40'),
          }}
          style={styles.headerAvatar}
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{safeText(chatRoom.name)}</Text>
          <Text style={styles.headerSubtitle}>
            {safeText(chatRoom.participants?.length)} участници
          </Text>
        </View>

        {canDelete && (
          <TouchableOpacity
            onPress={handleDeleteChat}
            style={styles.deleteButton}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ff4444" />
            ) : (
              <Text style={styles.deleteButtonText}>🗑️</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ОПТИМИЗИРАНО: Messages container със стабилна височина */}
      <View
        style={[
          styles.messagesContainer,
          { paddingBottom: keyboardHeight > 0 ? 10 : 0 },
        ]}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={keyExtractor}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={15}
          windowSize={21}
          initialNumToRender={10}
          getItemLayout={getItemLayout}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      {/* ПОПРАВЕНО: Input container с подобрено keyboard handling */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardAvoidingView}
      >
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: inputContainerPaddingBottom },
          ]}
        >
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.textInput, isSending && styles.textInputDisabled]}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Съобщение..."
              placeholderTextColor="#999"
              multiline
              maxLength={MAX_MESSAGE_LENGTH}
              editable={!isSending}
              returnKeyType="send"
              onSubmitEditing={() => {
                if (canSendMessage) {
                  sendMessage()
                }
              }}
              blurOnSubmit={false}
            />

            {newMessage.length > MAX_MESSAGE_LENGTH * 0.9 && (
              <Text
                style={[
                  styles.characterCounter,
                  newMessage.length > MAX_MESSAGE_LENGTH &&
                    styles.characterCounterError,
                ]}
              >
                {newMessage.length}/{MAX_MESSAGE_LENGTH}
              </Text>
            )}

            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendButton,
                !canSendMessage && styles.sendButtonDisabled,
              ]}
              disabled={!canSendMessage}
              activeOpacity={0.8}
            >
              {isSending ? (
                <ActivityIndicator size="small" color={Colors.WHITE} />
              ) : (
                <Text style={styles.sendButtonText}>➤</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
})

// ОПТИМИЗИРАНО: Styles за по-добра производителност
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.GRAY,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.8,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginVertical: 2,
  },
  myMessageContainer: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  messageWrapper: {
    maxWidth: '80%',
  },
  messageWrapperNoAvatar: {
    marginLeft: 40,
  },
  senderName: {
    fontSize: 12,
    color: Colors.GRAY,
    marginBottom: 2,
    marginLeft: 12,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 2,
  },
  myMessage: {
    backgroundColor: Colors.PRIMARY,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  systemMessage: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'center',
    borderRadius: 12,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#333',
  },
  systemMessageText: {
    color: '#1976d2',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: Colors.GRAY,
    textAlign: 'left',
  },
  keyboardAvoidingView: {
    // Не задавай flex тук, за да избегнеш проблеми с клавиатурата
  },
  inputContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    minHeight: 60,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
    minHeight: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 8,
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  textInputDisabled: {
    opacity: 0.8,
  },
  characterCounter: {
    position: 'absolute',
    bottom: -15,
    right: 50,
    fontSize: 10,
    color: Colors.GRAY,
  },
  characterCounterError: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
})

export default ChatRoom
