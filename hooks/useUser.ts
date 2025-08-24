import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { CACHE_KEYS, CACHE_TIMES, GC_TIMES } from '@/configs/CacheConfig'

export interface User {
  email: string
  name: string
  image: string
  role: string
}

// Hook for user data with caching
export function useUser(email?: string, enabled: boolean = true) {
  const queryClient = useQueryClient()

  const userQuery = useQuery({
    queryKey: [CACHE_KEYS.USER, email],
    queryFn: async () => {
      if (!email) return null

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/user`,
        {
          params: { email },
        }
      )
      return response.data || null
    },
    enabled: enabled && !!email,
    staleTime: CACHE_TIMES.USER_DATA,
    gcTime: GC_TIMES.LONG,
  })

  // Mutation for updating user data
  const updateUserMutation = useMutation({
    mutationFn: async ({
      email,
      name,
      currentPassword,
      newPassword,
    }: {
      email: string
      name?: string
      currentPassword?: string
      newPassword?: string
    }) => {
      return axios.put(`${process.env.EXPO_PUBLIC_HOST_URL}/user`, {
        email,
        name,
        currentPassword,
        newPassword,
      })
    },
    onMutate: async ({ email, name }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [CACHE_KEYS.USER, email] })

      // Snapshot previous value
      const previousUser = queryClient.getQueryData([CACHE_KEYS.USER, email])

      // Optimistically update user name if provided
      if (name && previousUser) {
        queryClient.setQueryData([CACHE_KEYS.USER, email], {
          ...previousUser,
          name,
        })
      }

      return { previousUser }
    },
    onError: (err, variables, context) => {
      // Revert optimistic update
      if (context?.previousUser) {
        queryClient.setQueryData(
          [CACHE_KEYS.USER, variables.email],
          context.previousUser
        )
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate user queries to refetch latest data
      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.USER, variables.email],
      })
    },
  })

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    error: userQuery.error,
    updateUser: updateUserMutation.mutate,
    isUpdating: updateUserMutation.isPending,
    refetch: userQuery.refetch,
  }
}

// Hook for multiple users with caching
export function useUsers(emails: string[], enabled: boolean = true) {
  const usersQuery = useQuery({
    queryKey: [CACHE_KEYS.USERS, emails.sort()],
    queryFn: async () => {
      if (emails.length === 0) return []

      const promises = emails.map((email) =>
        axios.get(`${process.env.EXPO_PUBLIC_HOST_URL}/user`, {
          params: { email },
        })
      )

      const responses = await Promise.all(promises)
      return responses.map((response) => response.data).filter(Boolean)
    },
    enabled: enabled && emails.length > 0,
    staleTime: CACHE_TIMES.USER_DATA,
    gcTime: GC_TIMES.LONG,
  })

  return {
    users: usersQuery.data || [],
    isLoading: usersQuery.isLoading,
    error: usersQuery.error,
    refetch: usersQuery.refetch,
  }
}
