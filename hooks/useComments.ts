import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  QueryFunctionContext,
  useQuery,
} from '@tanstack/react-query'
import axios from 'axios'
import { CACHE_KEYS, CACHE_TIMES, GC_TIMES } from '@/configs/CacheConfig'

export interface Comment {
  id: number
  comment: string
  created_at: string
  created_at_local: string
  name: string
  image: string
  user_email: string
  parent_id?: number
  user_role?: string
}

export interface CommentLike {
  commentId: number
  isLiked: boolean
  count: number
}

export interface UseCommentsOptions {
  postId: number
  parentId?: number
  searchQuery?: string
  enabled?: boolean
}

export interface CommentsResponse {
  comments: Comment[]
  nextOffset?: number
}

// Hook for comment likes with caching
export function useCommentLikes(
  commentIds: number[],
  userEmail?: string,
  enabled: boolean = true
) {
  const queryClient = useQueryClient()

  // Filter out optimistic IDs (anything > 2147483647 is too big for PostgreSQL integer)
  const validCommentIds = commentIds.filter((id) => id <= 2147483647)

  // Query for checking which comments user has liked
  const likedCommentsQuery = useQuery({
    queryKey: [
      CACHE_KEYS.COMMENT_LIKES,
      CACHE_KEYS.COMMENT_LIKES_USER,
      userEmail,
      validCommentIds.sort(),
    ],
    queryFn: async () => {
      if (!userEmail || validCommentIds.length === 0) return []

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/comment-like`,
        {
          params: {
            userEmail,
            commentIds: validCommentIds.join(','),
          },
        }
      )
      return response.data.likedCommentIds || []
    },
    enabled: enabled && !!userEmail && validCommentIds.length > 0,
    staleTime: CACHE_TIMES.COMMENT_LIKES,
    gcTime: GC_TIMES.MEDIUM,
  })

  // Query for comment like counts
  const likeCountsQuery = useQuery({
    queryKey: [
      CACHE_KEYS.COMMENT_LIKES,
      CACHE_KEYS.COMMENT_LIKES_COUNTS,
      validCommentIds.sort(),
    ],
    queryFn: async () => {
      if (validCommentIds.length === 0) return {}

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/comment-like`,
        {
          params: {
            commentIds: validCommentIds.join(','),
            counts: 'true',
          },
        }
      )
      return response.data.likeCounts || {}
    },
    enabled: enabled && validCommentIds.length > 0,
    staleTime: CACHE_TIMES.COMMENT_LIKES,
    gcTime: GC_TIMES.MEDIUM,
  })

  const likedCommentIds = likedCommentsQuery.data || []
  const likeCounts = likeCountsQuery.data || {}

  // Build the combined data structure
  const commentLikes: { [key: number]: CommentLike } = {}

  commentIds.forEach((commentId) => {
    // For optimistic comments, provide default values
    if (commentId > 2147483647) {
      commentLikes[commentId] = {
        commentId,
        isLiked: false,
        count: 0,
      }
    } else {
      commentLikes[commentId] = {
        commentId,
        isLiked: likedCommentIds.includes(commentId),
        count: likeCounts[commentId] || 0,
      }
    }
  })

  // Toggle like mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({
      commentId,
      isLiked,
    }: {
      commentId: number
      isLiked: boolean
    }) => {
      if (!userEmail) throw new Error('User email required')

      // Skip optimistic comments
      if (commentId > 2147483647) {
        throw new Error('Cannot like optimistic comment')
      }

      if (isLiked) {
        return axios.delete(
          `${process.env.EXPO_PUBLIC_HOST_URL}/comment-like`,
          {
            data: { commentId, userEmail },
          }
        )
      } else {
        return axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/comment-like`, {
          commentId,
          userEmail,
        })
      }
    },
    onMutate: async ({ commentId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [
          CACHE_KEYS.COMMENT_LIKES,
          CACHE_KEYS.COMMENT_LIKES_USER,
          userEmail,
        ],
      })
      await queryClient.cancelQueries({
        queryKey: [CACHE_KEYS.COMMENT_LIKES, CACHE_KEYS.COMMENT_LIKES_COUNTS],
      })

      // Update cache optimistically
      if (!isLiked) {
        // Adding like
        queryClient.setQueryData(
          [
            CACHE_KEYS.COMMENT_LIKES,
            CACHE_KEYS.COMMENT_LIKES_USER,
            userEmail,
            validCommentIds.sort(),
          ],
          (old: number[] = []) => [...old, commentId]
        )
        queryClient.setQueryData(
          [
            CACHE_KEYS.COMMENT_LIKES,
            CACHE_KEYS.COMMENT_LIKES_COUNTS,
            validCommentIds.sort(),
          ],
          (old: { [key: number]: number } = {}) => ({
            ...old,
            [commentId]: (old[commentId] || 0) + 1,
          })
        )
      } else {
        // Removing like
        queryClient.setQueryData(
          [
            CACHE_KEYS.COMMENT_LIKES,
            CACHE_KEYS.COMMENT_LIKES_USER,
            userEmail,
            validCommentIds.sort(),
          ],
          (old: number[] = []) => old.filter((id) => id !== commentId)
        )
        queryClient.setQueryData(
          [
            CACHE_KEYS.COMMENT_LIKES,
            CACHE_KEYS.COMMENT_LIKES_COUNTS,
            validCommentIds.sort(),
          ],
          (old: { [key: number]: number } = {}) => ({
            ...old,
            [commentId]: Math.max(0, (old[commentId] || 0) - 1),
          })
        )
      }
    },
    onError: () => {
      // Revert optimistic updates
      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.COMMENT_LIKES],
      })
    },
    onSuccess: () => {
      // Refresh to ensure consistency
      queryClient.invalidateQueries({
        queryKey: [CACHE_KEYS.COMMENT_LIKES],
      })
    },
  })

  return {
    commentLikes,
    isLoading: likedCommentsQuery.isLoading || likeCountsQuery.isLoading,
    toggleLike: toggleLikeMutation.mutateAsync, // Return the mutateAsync function, not the mutation object
    isToggling: toggleLikeMutation.isPending,
  }
}

export function useComments({
  postId,
  parentId,
  searchQuery = '',
  enabled = true,
}: UseCommentsOptions) {
  const queryClient = useQueryClient()
  const queryKey = [CACHE_KEYS.COMMENTS, postId, parentId, searchQuery]

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery<Comment[], Error>({
    queryKey,
    queryFn: async (context: QueryFunctionContext) => {
      const baseUrl = `${process.env.EXPO_PUBLIC_HOST_URL}/comment`
      const params: any = {
        postId,
      }

      // Add parentId if fetching replies
      if (parentId) {
        params.parentId = parentId
      }

      // Add search query parameter if provided
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      const response = await axios.get(baseUrl, { params })
      return response.data || []
    },
    getNextPageParam: () => undefined, // Comments don't use pagination yet
    enabled: enabled && !!postId,
    staleTime: searchQuery.trim()
      ? CACHE_TIMES.COMMENTS_SEARCH
      : CACHE_TIMES.COMMENTS,
    gcTime: GC_TIMES.MEDIUM,
    retry: 2,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
  })

  // Generate safe optimistic ID that won't conflict with DB
  const generateOptimisticId = () => {
    return Math.floor(Math.random() * 1000000) + (Date.now() % 1000000)
  }

  // Mutation for adding comments with optimistic updates
  const addCommentMutation = useMutation({
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
      // Cancel outgoing refetches for this post's comments
      await queryClient.cancelQueries({
        queryKey: [CACHE_KEYS.COMMENTS, postId],
      })

      // Get user info for optimistic update
      const userInfo = queryClient.getQueryData([
        CACHE_KEYS.USER,
        variables.userEmail,
      ]) as any

      // Create optimistic comment with safe ID
      const optimisticComment: Comment = {
        id: generateOptimisticId(),
        comment: variables.comment,
        created_at: new Date().toISOString(),
        created_at_local: new Date().toISOString(),
        name: userInfo?.name || 'You',
        image: userInfo?.image || 'https://via.placeholder.com/36', // Default image
        user_email: variables.userEmail,
        parent_id: variables.parentId || undefined,
        user_role: userInfo?.role,
      }

      // Update the cache optimistically
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return { pages: [[optimisticComment]], pageParams: [0] }

        return {
          ...oldData,
          pages: oldData.pages.map((page: Comment[], index: number) =>
            index === 0 ? [optimisticComment, ...page] : page
          ),
        }
      })

      return { optimisticComment }
    },
    onError: (err, variables, context) => {
      // Remove optimistic comment on error
      if (context?.optimisticComment) {
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData

          return {
            ...oldData,
            pages: oldData.pages.map((page: Comment[]) =>
              page.filter(
                (comment) => comment.id !== context.optimisticComment.id
              )
            ),
          }
        })
      }
    },
    onSuccess: () => {
      // Invalidate all comment queries for this post to refresh with real data
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.COMMENTS, postId] })

      // Also invalidate post queries to update comment counts
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.POSTS] })
    },
  })

  // Mutation for editing comments
  const editCommentMutation = useMutation({
    mutationFn: async ({
      commentId,
      userEmail,
      newComment,
    }: {
      commentId: number
      userEmail: string
      newComment: string
    }) => {
      return axios.put(`${process.env.EXPO_PUBLIC_HOST_URL}/comment`, {
        commentId,
        userEmail,
        newComment,
      })
    },
    onMutate: async ({ commentId, newComment }) => {
      await queryClient.cancelQueries({ queryKey })

      // Optimistically update the comment
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: Comment[]) =>
            page.map((comment) =>
              comment.id === commentId
                ? { ...comment, comment: newComment }
                : comment
            )
          ),
        }
      })
    },
    onError: () => {
      // Revert on error by refetching
      queryClient.invalidateQueries({ queryKey })
    },
    onSuccess: () => {
      // Ensure consistency
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.COMMENTS, postId] })
    },
  })

  // Mutation for deleting comments
  const deleteCommentMutation = useMutation({
    mutationFn: async ({
      commentId,
      userEmail,
      postAuthorEmail,
    }: {
      commentId: number
      userEmail: string
      postAuthorEmail: string
    }) => {
      return axios.delete(`${process.env.EXPO_PUBLIC_HOST_URL}/comment`, {
        data: {
          commentId,
          userEmail,
          postAuthorEmail,
        },
      })
    },
    onMutate: async ({ commentId }) => {
      await queryClient.cancelQueries({ queryKey })

      // Optimistically remove the comment
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: Comment[]) =>
            page.filter((comment) => comment.id !== commentId)
          ),
        }
      })
    },
    onError: () => {
      // Revert on error by refetching
      queryClient.invalidateQueries({ queryKey })
    },
    onSuccess: () => {
      // Invalidate all comment queries for this post
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.COMMENTS, postId] })

      // Also invalidate post queries to update comment counts
      queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.POSTS] })
    },
  })

  // Function to invalidate cache when needed
  const invalidateComments = () => {
    queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.COMMENTS, postId] })
  }

  // Combine all pages into a single array
  const comments =
    data?.pages?.flatMap((page: Comment[]) =>
      Array.isArray(page) ? page : []
    ) ?? []

  return {
    comments,
    error,
    isLoading: status === 'pending',
    isLoadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    fetchNextPage,
    refetch,
    addCommentMutation,
    editCommentMutation,
    deleteCommentMutation,
    invalidateComments,
  }
}

// Hook for post comments with search capability
export function usePostComments(postId: number, searchQuery?: string) {
  return useComments({
    postId,
    searchQuery,
    enabled: !!postId,
  })
}

// Hook for comment replies with search capability
export function useCommentReplies(
  postId: number,
  parentId: number,
  searchQuery?: string
) {
  return useComments({
    postId,
    parentId,
    searchQuery,
    enabled: !!postId && !!parentId,
  })
}
