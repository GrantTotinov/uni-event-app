import React, { useEffect, useMemo, useState } from 'react'

import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import { useLocalSearchParams, useRouter } from 'expo-router'

import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  OverlayProvider,
} from 'stream-chat-expo'

import { chatClient } from '@/configs/streamChatConfig'

import Colors from '@/data/Colors'

import Ionicons from '@expo/vector-icons/Ionicons'

export default function ChatRoomRoute() {
  const router = useRouter()

  const { cid } = useLocalSearchParams<{ cid: string }>()

  const [channelReady, setChannelReady] = useState(false)

  const channel = useMemo(() => {
    if (!cid || !chatClient) return null

    const [type, id] = String(cid).split(':')

    return chatClient.channel(type, id)
  }, [cid])

  useEffect(() => {
    let mounted = true

    ;(async () => {
      if (!channel) return

      try {
        await channel.watch()

        if (mounted) setChannelReady(true)
      } catch (e) {
        console.warn('Channel watch error:', e)
      }
    })()

    return () => {
      mounted = false
    }
  }, [channel])

  if (!channel || !channelReady) {
    return <View style={{ flex: 1, backgroundColor: Colors.WHITE }} />
  }

  // name is a custom field – not present in the SDK’s default type, so cast to any

  const channelName =
    ((channel.data as any) && (channel.data as any).name) || 'Чат'

  return (
    <OverlayProvider>
      <Chat client={chatClient}>
        <Channel
          channel={channel}
          // Keep Android "pan/resize" conflicts away by letting Stream skip its own wrapper

          disableKeyboardCompatibleView={Platform.OS === 'android'}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.back}>
              <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
            </TouchableOpacity>

            <Text style={styles.title} numberOfLines={1}>
              {channelName}
            </Text>

            <View style={{ width: 40 }} />
          </View>

          <MessageList />

          <MessageInput />
        </Channel>
      </Chat>
    </OverlayProvider>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 15,

    paddingVertical: 10,

    borderBottomWidth: 1,

    borderBottomColor: Colors.LIGHT_GRAY,

    backgroundColor: Colors.WHITE,
  },

  back: { padding: 8 },

  title: {
    flex: 1,

    marginLeft: 8,

    fontSize: 18,

    fontWeight: '600',

    color: Colors.PRIMARY,
  },
})
