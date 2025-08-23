import React, { useContext, useMemo } from 'react'
import { SafeAreaView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ChannelList } from 'stream-chat-expo'
import { ChannelSort } from 'stream-chat'
import { AuthContext } from '@/context/AuthContext'
import { useChatContext } from '@/context/ChatContext'
import { ChatWrapper } from '@/components/ChatWrapper'
import {
  createStreamUserData,
  generateUserToken,
} from '@/configs/streamChatConfig'
import { auth } from '@/configs/FirebaseConfig'
import Colors from '@/data/Colors'

export default function ChatIndex() {
  const router = useRouter()
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

  // Channel filters - show channels where current user is a member
  const filters = useMemo(
    () => ({
      type: 'messaging',
      members: { $in: [firebaseUser?.uid || ''] },
    }),
    [firebaseUser?.uid]
  )

  const sort: ChannelSort = useMemo(() => ({ last_message_at: -1 }), [])
  const options = useMemo(
    () => ({
      state: true,
      watch: true,
      presence: true,
    }),
    []
  )

  if (!userData || !userToken || !firebaseUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          {/* Loading or empty state */}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ChatWrapper userData={userData} userToken={userToken}>
        <ChannelList
          filters={filters}
          sort={sort}
          options={options}
          onSelect={(channel) => {
            setChannel(channel)
            router.push({
              pathname: '/chat/[cid]',
              params: { cid: channel.cid },
            })
          }}
        />
      </ChatWrapper>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
