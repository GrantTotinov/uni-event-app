import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  QueryFunctionContext,
} from '@tanstack/react-query'
import axios from 'axios'

export interface Post {
  post_id: number
  context: string
  imageurl?: string
  club?: number
  createdby: string
  createdon: string
  createdon_local: string
  name: string
  image: string
  role: string
  like_count: number
  comment_count: number
  is_liked: boolean
  is_uht_related?: boolean
}

export interface UsePostsOptions {
  selectedTab: number
  userEmail?: string
  followedOnly?: boolean
  enabled?: boolean
  postsPerPage?: number
  prefetchNextPage?: boolean
  searchQuery?: string
}

export interface PostsResponse {
  posts: Post[]
  nextOffset?: number
}

export function usePosts({
  selectedTab,
  userEmail,
  followedOnly = false,
  enabled = true,
  postsPerPage = 10,
  prefetchNextPage = true,
  searchQuery = '',
}: UsePostsOptions) {
  const queryClient = useQueryClient()
  const queryKey = ['posts', selectedTab, userEmail, followedOnly, searchQuery]

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery<PostsResponse, Error>({
    queryKey,
    queryFn: async (context: QueryFunctionContext) => {
      const pageParam =
        typeof context.pageParam === 'number' ? context.pageParam : 0

      const baseUrl = `${process.env.EXPO_PUBLIC_HOST_URL}/post`
      const params: any = {
        limit: postsPerPage,
        offset: pageParam,
        orderField: selectedTab === 0 ? 'createdon' : 'like_count',
        orderDir: 'DESC',
      }

      // Add email parameter if provided for user-specific flags
      if (userEmail) {
        params.u_email = userEmail
      }

      // Add followed only filter if enabled
      if (followedOnly) {
        params.followedOnly = 'true'
      }

      // Add search query parameter if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const response = await axios.get(baseUrl, { params })

      let posts: Post[] = response.data || []

      // Disable prefetching when searching to avoid unnecessary requests
      const shouldPrefetch = prefetchNextPage && !searchQuery.trim()

      // Prefetch next page if enabled and we have a full page
      if (shouldPrefetch && posts.length === postsPerPage) {
        const nextOffset = pageParam + postsPerPage
        queryClient.prefetchInfiniteQuery({
          queryKey,
          queryFn: async () => {
            const nextParams = { ...params, offset: nextOffset }
            const nextResponse = await axios.get(baseUrl, {
              params: nextParams,
            })
            return {
              posts: nextResponse.data || [],
              nextOffset:
                nextResponse.data?.length === postsPerPage
                  ? nextOffset + postsPerPage
                  : undefined,
            }
          },
          initialPageParam: 0,
          staleTime: 2 * 60 * 1000,
        })
      }

      return {
        posts,
        nextOffset:
          posts.length === postsPerPage ? pageParam + postsPerPage : undefined,
      }
    },
    getNextPageParam: (lastPage: PostsResponse) => lastPage.nextOffset,
    enabled,
    staleTime: searchQuery.trim() ? 30 * 1000 : 5 * 60 * 1000, // Shorter cache for search results
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
  })

  // Mutation for like/unlike posts with optimistic updates
  const likeMutation = useMutation({
    mutationFn: async ({
      postId,
      userEmail,
      isLiked,
    }: {
      postId: number
      userEmail: string
      isLiked: boolean
    }) => {
      if (isLiked) {
        return axios.delete(`${process.env.EXPO_PUBLIC_HOST_URL}/post-like`, {
          data: { postId, userEmail },
        })
      } else {
        return axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/post-like`, {
          postId,
          userEmail,
        })
      }
    },
    onSuccess: (_, variables) => {
      // Optimistic update for like toggle
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: PostsResponse) => ({
            ...page,
            posts: Array.isArray(page.posts)
              ? page.posts.map((post: Post) =>
                  post.post_id === variables.postId
                    ? {
                        ...post,
                        is_liked: !variables.isLiked,
                        like_count: variables.isLiked
                          ? Math.max(0, post.like_count - 1)
                          : post.like_count + 1,
                      }
                    : post
                )
              : [],
          })),
        }
      })
    },
  })

  // Mutation for adding comments with optimistic updates
  const commentMutation = useMutation({
    mutationFn: async ({
      postId,
      userEmail,
      comment,
    }: {
      postId: number
      userEmail: string
      comment: string
    }) => {
      return axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/comment`, {
        postId,
        userEmail,
        comment,
      })
    },
    onSuccess: (_, variables) => {
      // Optimistic update for comment count
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: PostsResponse) => ({
            ...page,
            posts: Array.isArray(page.posts)
              ? page.posts.map((post: Post) =>
                  post.post_id === variables.postId
                    ? { ...post, comment_count: post.comment_count + 1 }
                    : post
                )
              : [],
          })),
        }
      })
    },
  })

  // Function to invalidate cache when needed
  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

  // Combine all pages into a single array
  const posts =
    data?.pages?.flatMap((page: PostsResponse) =>
      Array.isArray(page.posts) ? page.posts : []
    ) ?? []

  return {
    posts,
    error,
    isLoading: status === 'pending',
    isLoadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    fetchNextPage,
    refetch,
    likeMutation,
    commentMutation,
    invalidatePosts,
  }
}

// Hook for all posts with search capability
export function useAllPosts(
  userEmail?: string,
  followedOnly: boolean = false,
  searchQuery?: string
) {
  return usePosts({
    selectedTab: 0,
    userEmail,
    followedOnly,
    enabled: true,
    prefetchNextPage: true,
    searchQuery,
  })
}

// Hook for popular posts with search capability
export function usePopularPosts(
  userEmail?: string,
  followedOnly: boolean = false,
  searchQuery?: string
) {
  return usePosts({
    selectedTab: 1,
    userEmail,
    followedOnly,
    enabled: true,
    prefetchNextPage: true,
    searchQuery,
  })
}

// Hook for followed posts only
export function useFollowedPosts(userEmail?: string, searchQuery?: string) {
  return usePosts({
    selectedTab: 0,
    userEmail,
    followedOnly: true,
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
