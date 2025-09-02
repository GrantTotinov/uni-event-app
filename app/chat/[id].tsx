// app/chat/ChatRoom.tsx
import React, { useContext, useEffect, useState } from 'react'
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

export default function ChatRoom() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatRoom, setChatRoom] = useState<any>(null)
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { user, getUserUid } = useContext(AuthContext)

  const safeText = (value: any) => {
    if (value === null || value === undefined) return ''
    if (typeof value !== 'string') return String(value)
    return value
  }

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
    })

    return () => {
      unsubscribeChatRoom()
      unsubscribeMessages()
    }
  }, [id])

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !id) return

    const uid = getUserUid()
    if (!uid) return

    try {
      await addDoc(collection(db, 'chatRooms', id as string, 'messages'), {
        text: newMessage.trim(),
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

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message: ', error)
      Alert.alert('Грешка', 'Неуспешно изпращане на съобщение')
    }
  }

  const formatTime = (timestamp: any) => {
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
    } else if (diffInDays < 7) {
      return (
        date.toLocaleDateString('bg-BG', { weekday: 'short' }) +
        ' ' +
        date.toLocaleTimeString('bg-BG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      )
    } else {
      return (
        date.toLocaleDateString('bg-BG', {
          day: '2-digit',
          month: '2-digit',
        }) +
        ' ' +
        date.toLocaleTimeString('bg-BG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      )
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.user._id === getUserUid()

    if (item.system) {
      return (
        <View style={styles.systemMessageContainer}>
          <View style={styles.systemMessageBubble}>
            <Text style={styles.systemMessageText}>{safeText(item.text)}</Text>
            <Text style={styles.systemMessageTime}>
              {formatTime(item.createdAt)}
            </Text>
          </View>
        </View>
      )
    }

    return (
      <View
        style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        {!isMyMessage && (
          <Image
            source={{ uri: safeText(item.user.avatar) }}
            style={styles.avatar}
          />
        )}

        <View style={styles.messageContent}>
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            ]}
          >
            {!isMyMessage && (
              <Text style={styles.senderName}>{safeText(item.user.name)}</Text>
            )}
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myMessageText : styles.otherMessageText,
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

  if (!chatRoom) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Image
          source={{
            uri: safeText(chatRoom.avatar || 'https://placehold.co/600x400'),
          }}
          style={styles.headerAvatar}
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{safeText(chatRoom.name)}</Text>
          <Text style={styles.headerSubtitle}>
            {safeText(chatRoom.participants?.length)} участници
          </Text>
        </View>
      </View>

      <View style={styles.messagesContainer}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Съобщение..."
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled,
            ]}
            disabled={!newMessage.trim()}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

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

  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#E8F5E8',
    marginTop: 1,
  },

  // Messages Container
  messagesContainer: {
    flex: 1,
    backgroundColor: '#E5DDD5',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 8,
  },

  // Message Row Styles
  messageRow: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },

  // Avatar
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },

  // Message Content
  messageContent: {
    maxWidth: '75%',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  myMessageBubble: {
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },

  // Message Text
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.PRIMARY,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  myMessageText: {
    color: '#000',
  },
  otherMessageText: {
    color: '#000',
  },

  // Message Time
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  myMessageTime: {
    color: '#4A4A4A',
  },
  otherMessageTime: {
    color: '#999',
  },

  // System Messages
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageBubble: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  systemMessageText: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  systemMessageTime: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
  },

  // Input Container
  inputContainer: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 8,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
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
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 0,
    paddingRight: 8,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
})
