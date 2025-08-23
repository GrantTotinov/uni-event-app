import React, { useContext, useMemo, useEffect } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Channel, MessageInput, MessageList } from 'stream-chat-expo'
import { useChatContext as useStreamChatContext } from 'stream-chat-expo'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AuthContext } from '../../context/AuthContext'
import { useChatContext } from '../../context/ChatContext'
import { ChatWrapper } from '../../components/ChatWrapper'
import {
  createStreamUserData,
  generateUserToken,
} from '../../configs/streamChatConfig'
import { auth } from '../../configs/FirebaseConfig'
import Colors from '../../data/Colors'

export default function ChatChannelScreen() {
  const router = useRouter()
  const { cid } = useLocalSearchParams<{ cid: string }>()
  const { user } = useContext(AuthContext)
  const { setChannel } = useChatContext()

  // Get current Firebase user
  const firebaseUser = auth.currentUser

  // Create Stream user data from Firebase user
  const userData = useMemo(() => {
    if (!firebaseUser) return null
    return createStreamUserData(firebaseUser)
  }, [firebaseUser])

  // Generate token for current user
  const userToken = useMemo(() => {
    if (!firebaseUser) return ''
    return generateUserToken(firebaseUser.uid)
  }, [firebaseUser])

  if (!userData || !userToken || !firebaseUser || !cid) {
    return <SafeAreaView style={styles.container} />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ChatWrapper userData={userData} userToken={userToken}>
        <ChannelScreen cid={cid as string} />
      </ChatWrapper>
    </SafeAreaView>
  )
}

// Inner component that has access to Stream Chat context
function ChannelScreen({ cid }: { cid: string }) {
  const router = useRouter()
  const { client } = useStreamChatContext()
  const { setChannel } = useChatContext()

  // Get channel from cid
  const channel = useMemo(() => {
    if (!cid || !client) return null
    const [type, id] = String(cid).split(':')
    return client.channel(type, id)
  }, [cid, client])

  // Watch channel when component mounts
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!channel) return
      try {
        await channel.watch()
        if (mounted) setChannel(channel)
      } catch (e) {
        console.warn('Channel watch error:', e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [channel, setChannel])

  if (!channel) {
    return <View style={styles.container} />
  }

  // Get channel name safely
  const channelName = (channel.data as any)?.name || 'Чат'

  return (
    <Channel channel={channel} audioRecordingEnabled={true}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={1}>
          {channelName}
        </Text>

        <View style={styles.placeholder} />
      </View>

      <View style={styles.chatContainer}>
        <MessageList />
        <MessageInput />
      </View>
    </Channel>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
    backgroundColor: Colors.WHITE,
  },
  backButton: {
    padding: 8,
  },
  title: {
    flex: 1,
    marginLeft: 8,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.PRIMARY,
  },
  placeholder: {
    width: 40,
  },
  chatContainer: {
    flex: 1,
  },
})
