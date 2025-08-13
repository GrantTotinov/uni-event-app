import React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Stack } from "expo-router"
import { AuthContextProvider } from "@/context/AuthContext"

// Create Query Client with optimized settings for performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      cacheTime: 10 * 60 * 1000, // 10 minutes - data stays in memory
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      refetchOnReconnect: true, // Refetch when internet reconnects
    },
    mutations: {
      retry: 1, // Retry failed mutations once
    },
  },
})

export default function RootLayout() {
  return (
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
        </Stack>
      </AuthContextProvider>
    </QueryClientProvider>
  )
}
