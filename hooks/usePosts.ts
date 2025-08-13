import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import axios from "axios"

interface Post {
  post_id: number
  context: string
  imageurl: string
  createdby: string
  createdon: string
  createdon_local: string
  name: string
  image: string
  role: string
  like_count: number
  comment_count: number
  is_uht_related: boolean
  is_liked?: boolean
}

interface UsePostsOptions {
  selectedTab: 0 | 1
  userEmail?: string
  followedOnly?: boolean
  enabled?: boolean
  postsPerPage?: number
}

export function usePosts({
  selectedTab,
  userEmail,
  followedOnly = false,
  enabled = true,
  postsPerPage = 10,
}: UsePostsOptions) {
  const queryClient = useQueryClient()
  const orderField = selectedTab === 1 ? "like_count" : "post.createdon"

  const queryKey = ["posts", selectedTab, userEmail, followedOnly]

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 0 }) => {
      const params: any = {
        u_email: userEmail ?? null,
        orderField,
        orderDir: "DESC",
        limit: postsPerPage,
        offset: pageParam,
      }

      if (followedOnly) {
        params.followedOnly = "true"
      }

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/post`,
        { params }
      )

      return {
        posts: response.data || [],
        nextOffset:
          response.data?.length === postsPerPage
            ? pageParam + postsPerPage
            : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    cacheTime: 10 * 60 * 1000, // 10 minutes in memory
    retry: 2,
    refetchOnWindowFocus: false,
  })

  // Mutation for like/unlike with optimistic updates
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
      // Optimistic update to cache - shows immediate UI feedback
      queryClient.setQueryData(queryKey, (oldData: any) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) =>
              post.post_id === variables.postId
                ? {
                    ...post,
                    is_liked: !variables.isLiked,
                    like_count: variables.isLiked
                      ? Math.max(0, post.like_count - 1)
                      : post.like_count + 1,
                  }
                : post
            ),
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
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: Post) =>
              post.post_id === variables.postId
                ? { ...post, comment_count: post.comment_count + 1 }
                : post
            ),
          })),
        }
      })
    },
  })

  // Function to invalidate cache when needed
  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ["posts"] })
  }

  // Combine all pages into a single array
  const posts = data?.pages.flatMap((page) => page.posts) ?? []

  return {
    posts,
    error,
    isLoading: status === "loading",
    isLoadingMore: isFetchingNextPage,
    hasMore: !!hasNextPage,
    fetchNextPage,
    refetch,
    likeMutation,
    commentMutation,
    invalidatePosts,
  }
}

// Hook for followed posts only
export function useFollowedPosts(userEmail?: string) {
  return usePosts({
    selectedTab: 0,
    userEmail,
    followedOnly: true,
    enabled: !!userEmail,
  })
}

// Hook for all posts with tab support
export function useAllPosts(selectedTab: 0 | 1, userEmail?: string) {
  return usePosts({
    selectedTab,
    userEmail,
    followedOnly: false,
  })
}
