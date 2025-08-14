import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  QueryFunctionContext,
} from '@tanstack/react-query'
import axios from 'axios'

export interface Event {
  id: number
  name: string
  bannerurl: string
  location: string
  link?: string | null
  details?: string | null
  event_date: string
  event_time: string
  createdby: string
  username: string
  isRegistered?: boolean
  isInterested?: boolean
  registeredCount?: number
  interestedCount?: number
}

export interface UseEventsOptions {
  userEmail?: string
  filterRegistered?: boolean
  enabled?: boolean
  eventsPerPage?: number
  prefetchNextPage?: boolean
  searchQuery?: string
}

export interface EventsResponse {
  events: Event[]
  nextOffset?: number
}

export function useEvents({
  userEmail,
  filterRegistered = false,
  enabled = true,
  eventsPerPage = 10,
  prefetchNextPage = true,
  searchQuery = '',
}: UseEventsOptions = {}) {
  const queryClient = useQueryClient()
  const queryKey = ['events', userEmail, filterRegistered, searchQuery]

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery<EventsResponse, Error>({
    queryKey,
    queryFn: async (context: QueryFunctionContext) => {
      const pageParam =
        typeof context.pageParam === 'number' ? context.pageParam : 0

      const baseUrl = `${process.env.EXPO_PUBLIC_HOST_URL}/events`
      const params: any = {
        limit: eventsPerPage,
        offset: pageParam,
      }

      // Add email parameter if provided for user-specific flags
      if (userEmail) {
        params.email = userEmail
      }

      // Add search query parameter if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const response = await axios.get(baseUrl, { params })

      let events: Event[] = response.data || []

      // Apply client-side filtering if needed (for registered events)
      if (filterRegistered) {
        events = events.filter((e) => e.isRegistered)
      }

      // Disable prefetching when searching to avoid unnecessary requests
      const shouldPrefetch = prefetchNextPage && !searchQuery.trim()

      // Prefetch next page if enabled and we have a full page
      if (shouldPrefetch && events.length === eventsPerPage) {
        const nextOffset = pageParam + eventsPerPage
        queryClient.prefetchInfiniteQuery({
          queryKey,
          queryFn: async () => {
            const nextParams = { ...params, offset: nextOffset }
            const nextResponse = await axios.get(baseUrl, {
              params: nextParams,
            })
            return {
              events: nextResponse.data || [],
              nextOffset:
                nextResponse.data?.length === eventsPerPage
                  ? nextOffset + eventsPerPage
                  : undefined,
            }
          },
          initialPageParam: 0,
          staleTime: 2 * 60 * 1000,
        })
      }

      return {
        events,
        nextOffset:
          events.length === eventsPerPage
            ? pageParam + eventsPerPage
            : undefined,
      }
    },
    getNextPageParam: (lastPage: EventsResponse) => lastPage.nextOffset,
    enabled,
    staleTime: searchQuery.trim() ? 30 * 1000 : 5 * 60 * 1000, // Shorter cache for search results
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
  })

  // Mutation for event registration
  const registerMutation = useMutation({
    mutationFn: async ({
      eventId,
      userEmail,
    }: {
      eventId: number
      userEmail: string
    }) => {
      return axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/event-register`, {
        eventId,
        userEmail,
      })
    },
    onSuccess: (_, variables) => {
      // Optimistic update for registration
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: EventsResponse) => ({
            ...page,
            events: Array.isArray(page.events)
              ? page.events.map((event: Event) =>
                  event.id === variables.eventId
                    ? {
                        ...event,
                        isRegistered: true,
                        registeredCount: (event.registeredCount || 0) + 1,
                      }
                    : event
                )
              : [],
          })),
        }
      })
    },
  })

  // Mutation for event unregistration
  const unregisterMutation = useMutation({
    mutationFn: async ({
      eventId,
      userEmail,
    }: {
      eventId: number
      userEmail: string
    }) => {
      return axios.delete(
        `${process.env.EXPO_PUBLIC_HOST_URL}/event-register`,
        {
          data: { eventId, userEmail },
        }
      )
    },
    onSuccess: (_, variables) => {
      // Optimistic update for unregistration
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: EventsResponse) => ({
            ...page,
            events: Array.isArray(page.events)
              ? page.events.map((event: Event) =>
                  event.id === variables.eventId
                    ? {
                        ...event,
                        isRegistered: false,
                        registeredCount: Math.max(
                          0,
                          (event.registeredCount || 1) - 1
                        ),
                      }
                    : event
                )
              : [],
          })),
        }
      })
    },
  })

  // Mutation for event interest
  const interestMutation = useMutation({
    mutationFn: async ({
      eventId,
      userEmail,
      isInterested,
    }: {
      eventId: number
      userEmail: string
      isInterested: boolean
    }) => {
      if (isInterested) {
        return axios.delete(
          `${process.env.EXPO_PUBLIC_HOST_URL}/event-interest`,
          {
            data: { eventId, userEmail },
          }
        )
      } else {
        return axios.post(
          `${process.env.EXPO_PUBLIC_HOST_URL}/event-interest`,
          {
            eventId,
            userEmail,
          }
        )
      }
    },
    onSuccess: (_, variables) => {
      // Optimistic update for interest toggle
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: EventsResponse) => ({
            ...page,
            events: Array.isArray(page.events)
              ? page.events.map((event: Event) =>
                  event.id === variables.eventId
                    ? {
                        ...event,
                        isInterested: !variables.isInterested,
                        interestedCount: variables.isInterested
                          ? Math.max(0, (event.interestedCount || 1) - 1)
                          : (event.interestedCount || 0) + 1,
                      }
                    : event
                )
              : [],
          })),
        }
      })
    },
  })

  // Function to invalidate events cache when needed
  const invalidateEvents = () => {
    queryClient.invalidateQueries({ queryKey: ['events'] })
  }

  // Combine all pages into a single array
  const events =
    data?.pages?.flatMap((page: EventsResponse) =>
      Array.isArray(page.events) ? page.events : []
    ) ?? []

  return {
    events,
    error,
    isLoading: status === 'pending',
    isLoadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    fetchNextPage,
    refetch,
    registerMutation,
    unregisterMutation,
    interestMutation,
    invalidateEvents,
  }
}

// Hook for all events with search capability
export function useAllEvents(userEmail?: string, searchQuery?: string) {
  return useEvents({
    userEmail,
    filterRegistered: false,
    enabled: true,
    prefetchNextPage: true,
    searchQuery,
  })
}

// Hook for registered events only with search capability
export function useRegisteredEvents(userEmail?: string, searchQuery?: string) {
  return useEvents({
    userEmail,
    filterRegistered: true,
    enabled: !!userEmail,
    prefetchNextPage: true,
    searchQuery,
  })
}

// Hook for single event details
export function useEventDetails(eventId?: string, userEmail?: string) {
  return useInfiniteQuery<Event, Error>({
    queryKey: ['event-details', eventId, userEmail],
    queryFn: async () => {
      if (!eventId) throw new Error('Event ID is required')

      const url = `${
        process.env.EXPO_PUBLIC_HOST_URL
      }/events?id=${encodeURIComponent(eventId)}`
      const finalUrl = userEmail
        ? `${url}&email=${encodeURIComponent(userEmail)}`
        : url

      const { data } = await axios.get(finalUrl)
      return data
    },
    enabled: !!eventId,
    staleTime: 2 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
    getNextPageParam: () => undefined,
  })
}
