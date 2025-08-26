import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface UserProfile {
  name: string
  email: string
  image: string
  role: string
}

interface FollowStats {
  followersCount: number
  followingCount: number
}

export const useUserFollowers = (userEmail?: string) => {
  return useQuery<FollowStats>({
    queryKey: ['user-followers', userEmail],
    queryFn: async () => {
      if (!userEmail) throw new Error('User email is required')
      const { data } = await axios.get(
        `${
          process.env.EXPO_PUBLIC_HOST_URL
        }/user-followers?userEmail=${encodeURIComponent(userEmail)}`
      )
      return data
    },
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  })
}

export const useFollowStatus = (
  currentUserEmail?: string,
  targetUserEmail?: string
) => {
  return useQuery<{ isFollowing: boolean }>({
    queryKey: ['follow-status', currentUserEmail, targetUserEmail],
    queryFn: async () => {
      if (!currentUserEmail || !targetUserEmail)
        throw new Error('Emails are required')
      const { data } = await axios.get(
        `${
          process.env.EXPO_PUBLIC_HOST_URL
        }/user-followers?userEmail=${encodeURIComponent(
          currentUserEmail
        )}&type=check&targetEmail=${encodeURIComponent(targetUserEmail)}`
      )
      return data
    },
    enabled:
      !!currentUserEmail &&
      !!targetUserEmail &&
      currentUserEmail !== targetUserEmail,
    staleTime: 30 * 1000,
  })
}

export const useFollowUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      followerEmail,
      followingEmail,
      isFollowing,
    }: {
      followerEmail: string
      followingEmail: string
      isFollowing: boolean
    }) => {
      if (isFollowing) {
        await axios.delete(
          `${process.env.EXPO_PUBLIC_HOST_URL}/user-followers`,
          {
            data: { followerEmail, followingEmail },
          }
        )
      } else {
        await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/user-followers`, {
          followerEmail,
          followingEmail,
        })
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-followers'] })
      queryClient.invalidateQueries({ queryKey: ['follow-status'] })
    },
  })
}

export const useUserFollowersList = (
  userEmail?: string,
  type: 'followers' | 'following' = 'followers'
) => {
  return useQuery<UserProfile[]>({
    queryKey: ['user-followers-list', userEmail, type],
    queryFn: async () => {
      if (!userEmail) throw new Error('User email is required')
      const { data } = await axios.get(
        `${
          process.env.EXPO_PUBLIC_HOST_URL
        }/user-followers?userEmail=${encodeURIComponent(
          userEmail
        )}&type=${type}`
      )
      return data
    },
    enabled: !!userEmail,
    staleTime: 2 * 60 * 1000,
  })
}
