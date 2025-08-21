import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { AuthContextProvider } from '@/context/AuthContext'

// Initialize QueryClient once for the app
const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthContextProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="add-post/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="add-club/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="add-event/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="explore-clubs/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="settings/index"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="chat/index" options={{ headerShown: false }} />
          </Stack>
        </AuthContextProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
