import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { CACHE_KEYS } from '@/configs/CacheConfig'

export interface Club {
  id: number
  name: string
  club_logo: string
  about: string
  createdon: string
  club_id?: number // За съвместимост с API отговора
}

export function useFollowedClubs(userEmail?: string) {
  return useQuery({
    queryKey: [CACHE_KEYS.CLUBS, 'followed', userEmail],
    queryFn: async () => {
      if (!userEmail) return []

      const { data } = await axios.get(
        `${
          process.env.EXPO_PUBLIC_HOST_URL
        }/clubfollower?u_email=${encodeURIComponent(userEmail)}`
      )

      // Нормализирай данните - понякога API връща club_id вместо id
      const normalizedData = Array.isArray(data)
        ? data
            .map((club: any) => ({
              ...club,
              id: club.id || club.club_id, // Използвай id или club_id
            }))
            .filter((club: any) => club.id != null && club.name) // Филтрирай валидни клубове
        : []

      console.log('Followed clubs data:', normalizedData) // Debug лог
      return normalizedData
    },
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}
