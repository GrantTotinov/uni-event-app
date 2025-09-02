import { GestureHandlerRootView } from 'react-native-gesture-handler'
import React from 'react'
import { View, StyleSheet, StatusBar, Platform } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthContextProvider } from '@/context/AuthContext'
import Colors from '@/data/Colors'

// Initialize QueryClient once for the app
const queryClient = new QueryClient()

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <AuthContextProvider>
            <View style={styles.root}>
              {/* Gradient background fills the whole screen */}
              <LinearGradient
                colors={['#f5f7fa', '#e0eafc', '#c9d6ff']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.flex}>
                <StatusBar
                  barStyle={
                    Platform.OS === 'ios' ? 'dark-content' : 'light-content'
                  }
                  backgroundColor="transparent"
                  translucent
                />
                <View style={styles.contentWrapper}>
                  <Stack>
                    {/* Main and Auth Screens */}
                    <Stack.Screen
                      name="index"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="landing"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(auth)/SignIn"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="(auth)/SignUp"
                      options={{ headerShown: false }}
                    />

                    <Stack.Screen
                      name="chat/index"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="chat/[id]"
                      options={{ headerShown: false }}
                    />
                    {/* Event Screens */}
                    <Stack.Screen
                      name="add-event/index"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="add-post/index"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="add-club/index"
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

                    {/* Add any additional screens here as needed */}
                  </Stack>
                </View>
              </View>
            </View>
          </AuthContextProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0,
    paddingHorizontal: 0,
  },
})
