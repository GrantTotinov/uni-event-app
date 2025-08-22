import React, { useContext, useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Chat, ChannelList, OverlayProvider } from 'stream-chat-expo'
import { AuthContext } from '@/context/AuthContext'
import Colors from '@/data/Colors'
import { auth } from '@/configs/FirebaseConfig'
import { chatClient, connectStreamUser } from '@/configs/streamChatConfig'

export default function ChatIndex() {
  const router = useRouter()
  const { user } = useContext(AuthContext)
  const [ready, setReady] = useState(false)

  // Firebase UID is the Stream user id
  const uid = auth.currentUser?.uid || ''

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!uid) return
      try {
        await connectStreamUser({
          id: uid,
          name: user?.name,
          image: user?.image,
        })
        if (mounted) setReady(true)
      } catch (e) {
        console.warn('Stream connect error:', e)
      }
    })()
    return () => {
      mounted = false
    }
  }, [uid, user?.name, user?.image])

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.PRIMARY} />
      </View>
    )
  }

  // Show channels where current user (by UID) is a member
  const filters = { type: 'messaging', members: { $in: [uid] } }
  const sort = { last_message_at: -1 as const }
  const options = { state: true, watch: true, presence: true }

  return (
    <OverlayProvider>
      <Chat client={chatClient}>
        <ChannelList
          filters={filters}
          sort={sort}
          options={options}
          onSelect={(channel) => {
            // Typed dynamic route push
            router.push({
              pathname: '/chat/[cid]',
              params: { cid: channel.cid },
            })
          }}
        />
      </Chat>
    </OverlayProvider>
  )
}
