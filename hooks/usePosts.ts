import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
} from '@tanstack/react-query'
import axios from 'axios'
import { CACHE_KEYS, CACHE_TIMES, GC_TIMES } from '@/configs/CacheConfig'

export interface Post {
  post_id: number
  context: string
  imageurl?: string
  createdby: string
  club?: string
  is_uht_related: boolean
  createdon: string
  createdon_local: string
  name: string
  image: string
  user_role?: string
  role: string
  like_count: number
  comment_count: number
  is_liked?: boolean
}

export interface PostLike {
  postId: number
  isLiked: boolean
  count: number
}

export interface UsePostsOptions {
  club?: string
  userEmail?: string
  followedOnly?: boolean
  search?: string
  uhtOnly?: boolean
  orderField?: string
  orderDir?: string
  limit?: number
  enabled?: boolean
}

// Hook for post likes with caching
export function usePostLikes(
  postIds: number[],
  userEmail?: string,
  enabled: boolean = true
) {
  const queryClient = useQueryClient()

  // Query for checking which posts user has liked
  const likedPostsQuery = useQuery({
    queryKey: [
      CACHE_KEYS.POST_LIKES,
      CACHE_KEYS.USER,
      userEmail,
      postIds.sort(),
    ],
    queryFn: async () => {
      if (!userEmail || postIds.length === 0) return []

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/post-like`,
        {
          params: {
            userEmail,
            postIds: postIds.join(','),
          },
        }
      )
      return response.data.likedPostIds || []
    },
    enabled: enabled && !!userEmail && postIds.length > 0,
    staleTime: CACHE_TIMES.POSTS,
    gcTime: GC_TIMES.MEDIUM,
  })

  // Mutation for toggling post likes
  const toggleLikeMutation = useMutation({
    mutationFn: async ({
      postId,
      isLiked,
    }: {
      postId: number
      isLiked: boolean
    }) => {
      if (!userEmail) throw new Error('User email required')

      // ДОБАВЕНО: Artificial delay за да предотвратим spam
      await new Promise((resolve) => setTimeout(resolve, 100))

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
    // ДОБАВЕНО: Retry configuration
    retry: (failureCount, error) => {
      // Не retry при validation грешки
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        return false
      }
      return failureCount < 2
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [CACHE_KEYS.POST_LIKES, CACHE_KEYS.USER, userEmail],
      })

      // Snapshot previous value
      const previousLikedPosts =
        (queryClient.getQueryData([
          CACHE_KEYS.POST_LIKES,
          CACHE_KEYS.USER,
          userEmail,
          postIds.sort(),
        ]) as number[]) || []

      // Optimistically update liked posts
      const newLikedPosts = isLiked
        ? previousLikedPosts.filter((id) => id !== postId)
        : [...previousLikedPosts, postId]

      queryClient.setQueryData(
        [CACHE_KEYS.POST_LIKES, CACHE_KEYS.USER, userEmail, postIds.sort()],
        newLikedPosts
      )

      return { previousLikedPosts }
    },
    onError: (err, variables, context) => {
      // Revert optimistic update
      if (context?.previousLikedPosts) {
        queryClient.setQueryData(
          [CACHE_KEYS.POST_LIKES, CACHE_KEYS.USER, userEmail, postIds.sort()],
          context.previousLikedPosts
        )
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.POST_LIKES, CACHE_KEYS.USER, userEmail],
      })
      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.POSTS],
      })
    },
  })

  const likedPostIds = likedPostsQuery.data || []

  return {
    likedPostIds,
    isLoading: likedPostsQuery.isLoading,
    error: likedPostsQuery.error,
    toggleLike: toggleLikeMutation.mutate,
    isToggling: toggleLikeMutation.isPending,
  }
}

// Hook for posts with caching and infinite scroll
export function usePosts(options: UsePostsOptions = {}) {
  const queryClient = useQueryClient()
  const {
    club,
    userEmail,
    followedOnly,
    search,
    uhtOnly,
    orderField = 'createdon',
    orderDir = 'DESC',
    limit = 20,
    enabled = true,
  } = options

  const queryKey = [
    CACHE_KEYS.POSTS,
    club,
    userEmail,
    followedOnly,
    search,
    uhtOnly,
    orderField,
    orderDir,
  ]

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery<Post[], Error>({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const params: any = {
        limit,
        offset: pageParam,
        orderField,
        orderDir,
      }

      if (club) params.club = club
      if (userEmail) params.u_email = userEmail
      if (followedOnly) params.followedOnly = 'true'
      if (search?.trim()) params.search = search.trim()
      if (uhtOnly) params.uhtOnly = 'true'

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/post`,
        { params }
      )
      return response.data || []
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < limit) {
        return undefined
      }
      return allPages.length * limit
    },
    enabled,
    staleTime: search?.trim() ? CACHE_TIMES.POSTS_SEARCH : CACHE_TIMES.POSTS,
    gcTime: GC_TIMES.MEDIUM,
    retry: 2,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
  })

  // Mutation for creating posts
  const createPostMutation = useMutation({
    mutationFn: async (postData: {
      content: string
      imageUrl?: string
      visibleIn?: number
      email: string
      isUhtRelated?: boolean
    }) => {
      return axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/post`, postData)
    },
    onSuccess: () => {
      // Invalidate and refetch posts
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.POSTS] })
    },
  })

  // Mutation for editing posts
  const editPostMutation = useMutation({
    mutationFn: async ({
      postId,
      userEmail,
      content,
      imageUrl,
      isUhtRelated,
    }: {
      postId: number
      userEmail: string
      content?: string
      imageUrl?: string
      isUhtRelated?: boolean
    }) => {
      return axios.put(`${process.env.EXPO_PUBLIC_HOST_URL}/post`, {
        postId,
        userEmail,
        content,
        imageUrl,
        isUhtRelated,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.POSTS] })
    },
  })

  // Mutation for deleting posts
  const deletePostMutation = useMutation({
    mutationFn: async ({
      postId,
      userEmail,
    }: {
      postId: number
      userEmail: string
    }) => {
      return axios.delete(`${process.env.EXPO_PUBLIC_HOST_URL}/post`, {
        data: { postId, userEmail },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.POSTS] })
    },
  })

  // Like mutation for this specific hook
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.POSTS] })
    },
  })

  // Comment mutation for this specific hook
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
        parentId: null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.POSTS] })
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.COMMENTS] })
    },
  })

  // Combine all pages into a single array
  const posts = data?.pages?.flatMap((page: Post[]) => page) ?? []

  return {
    posts,
    error,
    isLoading: status === 'pending',
    isLoadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    fetchNextPage,
    refetch,
    createPostMutation,
    editPostMutation,
    deletePostMutation,
    likeMutation,
    commentMutation,
  }
}

// Hook for all posts (latest) with search capability
export function useAllPosts(
  userEmail?: string,
  followedOnly: boolean = false,
  searchQuery?: string
) {
  return usePosts({
    userEmail,
    followedOnly,
    search: searchQuery,
    orderField: 'createdon',
    orderDir: 'DESC',
    enabled: true,
  })
}

// Hook for popular posts (ordered by like count) with search capability
export function usePopularPosts(
  userEmail?: string,
  followedOnly: boolean = false,
  searchQuery?: string
) {
  return usePosts({
    userEmail,
    followedOnly,
    search: searchQuery,
    orderField: 'like_count',
    orderDir: 'DESC',
    enabled: true,
  })
}

// Hook for UHT posts with search capability
export function useUhtPosts(userEmail?: string, searchQuery?: string) {
  return usePosts({
    userEmail,
    search: searchQuery,
    uhtOnly: true,
    orderField: 'createdon',
    orderDir: 'DESC',
    enabled: true,
  })
}

// Hook for followed posts (posts from clubs user follows)
// Hook for followed posts (posts from clubs user follows)
export function useFollowedPosts(
  userEmail?: string,
  searchQuery?: string,
  clubId?: number | null
) {
  return usePosts({
    userEmail,
    followedOnly: true,
    search: searchQuery,
    club: clubId ? String(clubId) : undefined,
    orderField: 'createdon',
    orderDir: 'DESC',
    enabled: !!userEmail,
  })
}
