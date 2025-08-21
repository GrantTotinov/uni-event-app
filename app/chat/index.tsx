import React, { useContext, useState, useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { StreamChat } from 'stream-chat'
import { Chat, ChannelList, OverlayProvider } from 'stream-chat-expo'
import Colors from '@/data/Colors'
import { AuthContext } from '@/context/AuthContext'
import { auth } from '@/configs/FirebaseConfig'
import ChatRoomPage from './ChatRoomPage'

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_CHAT_API_KEY

let chatClient: StreamChat | null = null
if (!chatClient && STREAM_API_KEY?.trim()) {
  chatClient = StreamChat.getInstance(STREAM_API_KEY)
}

export default function ChatListPage() {
  const { user } = useContext(AuthContext)
  const [clientReady, setClientReady] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<any>(null)

  const getFirebaseUid = () => auth.currentUser?.uid

  useEffect(() => {
    const connectUser = async () => {
      if (!chatClient || !user?.name || !user?.email) return
      const uid = getFirebaseUid()
      if (!uid) return

      try {
        const token = chatClient.devToken(uid)
        await chatClient.connectUser(
          { id: uid, name: user.name, image: user.image || undefined },
          token
        )
        setClientReady(true)
      } catch (err) {
        console.error('Chat connect error:', err)
      }
    }

    connectUser()
    return () => {
      chatClient?.disconnectUser().catch(console.error)
    }
  }, [user])

  if (!clientReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={{ marginTop: 10 }}>Свързване с чат сървъра...</Text>
      </View>
    )
  }

  if (selectedChannel) {
    return (
      <OverlayProvider>
        <ChatRoomPage
          chatClient={chatClient!}
          channel={selectedChannel}
          onBack={() => setSelectedChannel(null)}
        />
      </OverlayProvider>
    )
  }

  // Wrap Chat and ChannelList with OverlayProvider for theme/context support
  return (
    <OverlayProvider>
      <Chat client={chatClient!}>
        <View style={styles.container}>
          <Text style={styles.header}>Чат канали</Text>
          <ChannelList
            onSelect={(channel) => setSelectedChannel(channel)}
            filters={{ members: { $in: [getFirebaseUid()!] } }}
            sort={{ last_message_at: -1 }}
            options={{ state: true, presence: true, watch: true }}
          />
        </View>
      </Chat>
    </OverlayProvider>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.WHITE, paddingTop: 50 },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 10,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
})
