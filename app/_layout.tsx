// app/_layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import React from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { AuthContextProvider } from '@/context/AuthContext'
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext'
import { queryClient } from '@/context/QueryClient'

// Every route draws its own header
const SCREENS = [
  'index',
  'landing',
  '(tabs)',
  '(auth)/SignIn',
  '(auth)/SignUp',
  'chat/index',
  'chat/[id]',
  'add-event/index',
  'add-post/index',
  'add-club/index',
  'explore-clubs/index',
  'user-page/[email]',
  'event/[id]',
  'settings/index',
  'notifications/index',
]

function ThemedStack() {
  const { isDarkMode, theme } = useAppTheme()
  const { top } = useSafeAreaInsets()
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={[styles.root, { paddingTop: top }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colors.background },
            animation: 'slide_from_right',
          }}
        >
          {SCREENS.map((name) => (
            <Stack.Screen key={name} name={name} />
          ))}
        </Stack>
      </View>
    </View>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthContextProvider>
              <ThemedStack />
            </AuthContextProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
})
