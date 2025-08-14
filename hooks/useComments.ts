import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  QueryFunctionContext,
} from '@tanstack/react-query'
import axios from 'axios'

export interface Comment {
  id: number
  comment: string
  created_at: string
  created_at_local: string
  name: string
  image: string
  user_email: string
  parent_id?: number
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

export function useComments({
  postId,
  parentId,
  searchQuery = '',
  enabled = true,
}: UseCommentsOptions) {
  const queryClient = useQueryClient()
  const queryKey = ['comments', postId, parentId, searchQuery]

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
    staleTime: searchQuery.trim() ? 30 * 1000 : 2 * 60 * 1000, // Shorter cache for search results
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    initialPageParam: 0,
  })

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
    onSuccess: () => {
      // Invalidate all comment queries for this post
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
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
    onSuccess: () => {
      // Invalidate all comment queries for this post
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
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
    onSuccess: () => {
      // Invalidate all comment queries for this post
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  // Function to invalidate cache when needed
  const invalidateComments = () => {
    queryClient.invalidateQueries({ queryKey: ['comments', postId] })
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
