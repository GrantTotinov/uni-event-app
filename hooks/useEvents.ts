import {
  InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import axios from 'axios'

const API = process.env.EXPO_PUBLIC_HOST_URL

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

/** Server-side list filters, see app/(api)/events+api.tsx */
export type EventFilter = 'upcoming' | 'registered' | 'mine' | 'popular'

export interface EventsResponse {
  events: Event[]
  nextOffset?: number
}

export function useEvents({
  userEmail,
  filter = 'upcoming',
  searchQuery = '',
  enabled = true,
  eventsPerPage = 10,
}: {
  userEmail?: string
  filter?: EventFilter
  searchQuery?: string
  enabled?: boolean
  eventsPerPage?: number
} = {}) {
  const queryClient = useQueryClient()
  const search = searchQuery.trim()
  const needsUser = filter === 'registered' || filter === 'mine'

  const query = useInfiniteQuery<EventsResponse, Error>({
    queryKey: ['events', filter, userEmail, search],
    queryFn: async ({ pageParam }) => {
      const offset = typeof pageParam === 'number' ? pageParam : 0
      const { data } = await axios.get<Event[]>(`${API}/events`, {
        params: {
          filter,
          limit: eventsPerPage,
          offset,
          email: userEmail || undefined,
          search: search || undefined,
        },
      })
      const events = Array.isArray(data) ? data : []
      return {
        events,
        nextOffset:
          events.length === eventsPerPage ? offset + eventsPerPage : undefined,
      }
    },
    getNextPageParam: (last) => last.nextOffset,
    initialPageParam: 0,
    enabled: enabled && (!needsUser || !!userEmail),
    staleTime: search ? 30 * 1000 : 2 * 60 * 1000,
  })

  const events = query.data?.pages.flatMap((p) => p.events) ?? []

  return {
    events,
    error: query.error,
    isLoading: query.status === 'pending' && query.fetchStatus !== 'idle',
    isRefetching: query.isRefetching && !query.isFetchingNextPage,
    isLoadingMore: query.isFetchingNextPage,
    hasMore: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    invalidateEvents: () =>
      queryClient.invalidateQueries({ queryKey: ['events'] }),
  }
}

/**
 * Register / interest mutations. Kept apart from useEvents so cards and the
 * details page don't each subscribe to a list query just to get mutations.
 * On success every cached list + the details entry is patched in place.
 */
export function useEventMutations() {
  const queryClient = useQueryClient()

  const patch = (eventId: number, fn: (e: Event) => Event) => {
    queryClient.setQueriesData<InfiniteData<EventsResponse>>(
      { queryKey: ['events'] },
      (old) =>
        old && {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            events: p.events.map((e) => (e.id === eventId ? fn(e) : e)),
          })),
        }
    )
    queryClient.setQueriesData<Event | null>(
      { queryKey: ['event-details', String(eventId)] },
      (old) => (old ? fn(old) : old)
    )
    // home hero + notifications reminders depend on registrations
    queryClient.invalidateQueries({ queryKey: ['next-event'] })
  }

  type Vars = { eventId: number; userEmail: string }

  const registerMutation = useMutation({
    mutationFn: ({ eventId, userEmail }: Vars) =>
      axios.post(`${API}/event-register`, { eventId, userEmail }),
    onSuccess: (_, { eventId }) =>
      patch(eventId, (e) =>
        e.isRegistered
          ? e
          : { ...e, isRegistered: true, registeredCount: (e.registeredCount ?? 0) + 1 }
      ),
  })

  const unregisterMutation = useMutation({
    mutationFn: ({ eventId, userEmail }: Vars) =>
      axios.delete(`${API}/event-register`, { data: { eventId, userEmail } }),
    onSuccess: (_, { eventId }) =>
      patch(eventId, (e) =>
        e.isRegistered
          ? {
              ...e,
              isRegistered: false,
              registeredCount: Math.max(0, (e.registeredCount ?? 1) - 1),
            }
          : e
      ),
  })

  const interestMutation = useMutation({
    mutationFn: ({ eventId, userEmail, isInterested }: Vars & { isInterested: boolean }) =>
      isInterested
        ? axios.delete(`${API}/event-interest`, { data: { eventId, userEmail } })
        : axios.post(`${API}/event-interest`, { eventId, userEmail }),
    onSuccess: (_, { eventId, isInterested }) =>
      patch(eventId, (e) =>
        !!e.isInterested !== isInterested
          ? e
          : {
              ...e,
              isInterested: !isInterested,
              interestedCount: Math.max(
                0,
                (e.interestedCount ?? 0) + (isInterested ? -1 : 1)
              ),
            }
      ),
  })

  return { registerMutation, unregisterMutation, interestMutation }
}

export function useEventDetails(eventId?: string, userEmail?: string) {
  return useQuery<Event | null, Error>({
    queryKey: ['event-details', eventId, userEmail],
    queryFn: async () => {
      const { data } = await axios.get(`${API}/events`, {
        params: { id: eventId, email: userEmail || undefined },
      })
      return data ?? null
    },
    enabled: !!eventId,
    staleTime: 60 * 1000,
  })
}

/** Closest upcoming event the user is registered for (home hero). */
export function useNextRegisteredEvent(userEmail?: string) {
  return useQuery<Event | null, Error>({
    queryKey: ['next-event', userEmail],
    queryFn: async () => {
      const { data } = await axios.get<Event[]>(`${API}/events`, {
        params: { filter: 'registered', upcomingOnly: 1, limit: 1, email: userEmail },
      })
      return data?.[0] ?? null
    },
    enabled: !!userEmail,
    staleTime: 60 * 1000,
  })
}
