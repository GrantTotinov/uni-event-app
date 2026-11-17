import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

export type NotificationType =
  | 'comment'
  | 'reply'
  | 'follow'
  | 'club_post'
  | 'event_soon'

export interface AppNotification {
  type: NotificationType
  key: string
  actor_name: string
  actor_image: string | null
  actor_email: string
  preview: string | null
  club_name: string | null
  post_id: number | null
  event_id: number | null
  event_date: string | null
  event_time: string | null
  created_at: string
}

const seenKey = (email: string) => `notifications:lastSeen:${email}`

export function useNotifications(email?: string) {
  return useQuery<AppNotification[], Error>({
    queryKey: ['notifications', email],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/user-notifications`,
        { params: { email } }
      )
      return Array.isArray(data) ? data : []
    },
    enabled: !!email,
    staleTime: 30 * 1000,
    // ponytail: polling while the app is open; switch to push (expo-notifications) if it ships to stores
    refetchInterval: 60 * 1000,
  })
}

/** Epoch ms of the last time the user left the notifications screen. */
export function useNotificationsLastSeen(email?: string) {
  return useQuery<number>({
    queryKey: ['notifications-seen', email],
    queryFn: async () => {
      try {
        return Number(await AsyncStorage.getItem(seenKey(email!))) || 0
      } catch {
        return 0
      }
    },
    enabled: !!email,
    staleTime: Infinity,
  })
}

export function useUnreadNotificationsCount(email?: string): number {
  const { data } = useNotifications(email)
  const { data: lastSeen = 0 } = useNotificationsLastSeen(email)
  return (
    data?.filter((n) => new Date(n.created_at).getTime() > lastSeen).length ?? 0
  )
}

export function useMarkNotificationsSeen(email?: string) {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    if (!email) return
    const now = Date.now()
    queryClient.setQueryData(['notifications-seen', email], now)
    await AsyncStorage.setItem(seenKey(email), String(now)).catch(() => {})
  }, [email, queryClient])
}
