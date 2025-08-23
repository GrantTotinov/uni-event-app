import React, { PropsWithChildren } from 'react'
import { Chat, OverlayProvider, useCreateChatClient } from 'stream-chat-expo'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import Colors from '@/data/Colors'

const API_KEY = process.env.EXPO_PUBLIC_STREAM_CHAT_API_KEY || ''

if (!API_KEY) {
  console.warn('Missing EXPO_PUBLIC_STREAM_CHAT_API_KEY in .env')
}

export const ChatWrapper = ({
  children,
  userData,
  userToken,
}: PropsWithChildren<{
  userData: {
    id: string
    name?: string
    image?: string
  }
  userToken: string
}>) => {
  const chatClient = useCreateChatClient({
    apiKey: API_KEY,
    userData,
    tokenOrProvider: userToken,
  })

  if (!chatClient) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    )
  }

  return (
    <OverlayProvider>
      <Chat client={chatClient}>{children}</Chat>
    </OverlayProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WHITE,
  },
})
