import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 минути
      gcTime: 10 * 60 * 1000, // 10 минути (заменяме cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
