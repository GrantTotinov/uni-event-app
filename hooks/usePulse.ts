import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import type { PulseStats } from '@/utils/pulse'

const API = process.env.EXPO_PUBLIC_HOST_URL

export type PulseRow = PulseStats & {
  email: string
  name: string
  image: string | null
  role: string | null
  points: number
  rank: number
  total: number
}

export type LeaderboardRow = Pick<
  PulseRow,
  'email' | 'name' | 'image' | 'role' | 'points' | 'rank'
>

export function usePulse(email?: string) {
  return useQuery<PulseRow | null, Error>({
    queryKey: ['pulse', email],
    queryFn: async () =>
      (await axios.get(`${API}/pulse`, { params: { email } })).data ?? null,
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLeaderboard(top = 10) {
  return useQuery<LeaderboardRow[], Error>({
    queryKey: ['pulse-top', top],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/pulse`, { params: { top } })
      return Array.isArray(data) ? data : []
    },
    staleTime: 5 * 60 * 1000,
  })
}
