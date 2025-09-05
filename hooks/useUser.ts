import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface User {
  id: number
  name: string
  email: string
  image?: string
  role: string
  contact_email?: string
  contact_phone?: string
  uid?: string
}

const fetchUser = async (email?: string): Promise<User | null> => {
  if (!email) return null

  const response = await axios.get(
    `${process.env.EXPO_PUBLIC_HOST_URL}/user?email=${email}`,
    {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    }
  )

  console.log('API returning fresh user data:', response.data)
  return response.data
}

export const useUser = (email?: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['user', email],
    queryFn: () => fetchUser(email),
    enabled: !!email && options?.enabled !== false,
    staleTime: 0, // Винаги ще зарежда свежи данни
    gcTime: 1000 * 60 * 5, // 5 минути в паметта
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 1,
  })
}

// Mutation за обновяване на потребителска снимка
export const useUpdateUserImage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      imageUrl,
    }: {
      email: string
      imageUrl: string
    }) => {
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_HOST_URL}/user`,
        {
          email,
          image: imageUrl,
        }
      )
      return response.data
    },
    onSuccess: (data, variables) => {
      // Обновяваме кеша за текущия потребител
      queryClient.setQueryData(['user', variables.email], data)

      // Инвалидираме всички user заявки за да се обновят навсякъде
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
