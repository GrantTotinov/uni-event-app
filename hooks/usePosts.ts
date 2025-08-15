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
  uhtOnly?: boolean
  orderField?: string
  orderDir?: string
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
  uhtOnly = false,
  orderField,
  orderDir,
}: UsePostsOptions) {
  const queryClient = useQueryClient()
  const queryKey = [
    'posts',
    selectedTab,
    userEmail,
    followedOnly,
    searchQuery,
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
  } = useInfiniteQuery<PostsResponse, Error>({
    queryKey,
    queryFn: async (context: QueryFunctionContext) => {
      const pageParam =
        typeof context.pageParam === 'number' ? context.pageParam : 0

      const baseUrl = `${process.env.EXPO_PUBLIC_HOST_URL}/post`
      const params: any = {
        limit: postsPerPage,
        offset: pageParam,
        orderField:
          orderField ?? (selectedTab === 0 ? 'createdon' : 'like_count'),
        orderDir: orderDir ?? 'DESC',
      }

      if (userEmail) {
        params.u_email = userEmail
      }
      if (followedOnly) {
        params.followedOnly = 'true'
      }
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim()
      }
      if (uhtOnly) {
        params.uhtOnly = 'true'
      }

      const response = await axios.get(baseUrl, { params })
      const posts = Array.isArray(response.data) ? response.data : []

      return {
        posts,
        nextOffset:
          posts.length === postsPerPage ? pageParam + postsPerPage : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled,
    staleTime: searchQuery.trim() ? 30 * 1000 : 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
  })

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
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })

      const previousData = queryClient.getQueryData(queryKey)

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

      return { previousData }
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const commentMutation = useMutation({
    mutationFn: async ({
      postId,
      userEmail,
      comment,
      parentId,
    }: {
      postId: number
      userEmail: string
      comment: string
      parentId?: number
    }) => {
      return axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/comment`, {
        postId,
        userEmail,
        comment,
        parentId: parentId || null,
      })
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey })

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

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }

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
    uhtOnly: false,
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
    uhtOnly: false,
  })
}

// Hook for UHT posts only (public and UHT-related), always newest first
export function useUhtPosts(userEmail?: string, searchQuery?: string) {
  return usePosts({
    selectedTab: 2,
    userEmail,
    followedOnly: false,
    enabled: true,
    prefetchNextPage: true,
    searchQuery,
    uhtOnly: true,
    orderField: 'createdon', // Always order by date
    orderDir: 'DESC', // Always newest first
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
    uhtOnly: false,
  })
}
