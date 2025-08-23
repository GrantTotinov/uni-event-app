import React, { useContext, useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Channel, Thread } from 'stream-chat-expo'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AuthContext } from '../../../context/AuthContext'
import { useChatContext } from '../../../context/ChatContext'
import { ChatWrapper } from '../../../components/ChatWrapper'
import {
  createStreamUserData,
  generateUserToken,
} from '../../../configs/streamChatConfig'
import { auth } from '../../../configs/FirebaseConfig'
import Colors from '../../../data/Colors'

export default function ThreadScreen() {
  const router = useRouter()
  const { cid } = useLocalSearchParams<{ cid: string }>()
  const { user } = useContext(AuthContext)
  const { channel, thread, setThread } = useChatContext()

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

  if (!userData || !userToken || !firebaseUser || !channel || !thread) {
    return <SafeAreaView style={styles.container} />
  }

  return (
    <SafeAreaView style={styles.container}>
      <ChatWrapper userData={userData} userToken={userToken}>
        <Channel
          channel={channel}
          thread={thread}
          threadList
          audioRecordingEnabled={true}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
            </TouchableOpacity>

            <Text style={styles.title} numberOfLines={1}>
              Thread
            </Text>

            <View style={styles.placeholder} />
          </View>

          <View style={styles.threadContainer}>
            <Thread
              onThreadDismount={() => {
                setThread(undefined)
              }}
            />
          </View>
        </Channel>
      </ChatWrapper>
    </SafeAreaView>
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
  threadContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
})
