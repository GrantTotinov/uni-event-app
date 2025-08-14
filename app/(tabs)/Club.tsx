import React, { useContext } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'
import Button from '@/components/Shared/Button'
import EmptyState from '@/components/Clubs/EmptyState'
import PostList from '@/components/Post/PostList'
import { useFollowedPosts } from '@/hooks/usePosts'

export default function Club() {
  const { user } = useContext(AuthContext)
  const router = useRouter()

  // Use React Query hook for followed posts - automatic caching and loading states
  const {
    posts: followedPosts,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchNextPage,
    refetch,
    likeMutation,
    commentMutation,
  } = useFollowedPosts(user?.email)

  // Handle like toggle with optimistic updates
  const handleToggleLike = async (postId: number, isLiked: boolean) => {
    if (!user?.email) return

    try {
      await likeMutation.mutateAsync({
        postId,
        userEmail: user.email,
        isLiked,
      })
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  // Handle comment submission with optimistic updates
  const handleAddComment = async (
    postId: number,
    comment: string
  ): Promise<boolean> => {
    if (!user?.email || !comment.trim()) return false

    try {
      await commentMutation.mutateAsync({
        postId,
        userEmail: user.email,
        comment,
      })
      return true
    } catch (error) {
      console.error('Error adding comment:', error)
      return false
    }
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchNextPage()
    }
  }

  // Show skeleton on initial load when we have no data yet
  const showSkeleton = isLoading && followedPosts.length === 0

  return (
    <View>
      <View style={{ padding: 20 }}>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 25, fontWeight: 'bold' }}>
            Студентски групи
          </Text>
          <Button text="ТЪРСИ" onPress={() => router.push('/explore-clubs')} />
        </View>
        {followedPosts?.length === 0 && !isLoading && <EmptyState />}
      </View>
      <PostList
        posts={followedPosts}
        loading={isLoading}
        loadingMore={isLoadingMore}
        hasMore={hasMore}
        showSkeleton={showSkeleton}
        onRefresh={refetch}
        onLoadMore={handleLoadMore}
        onToggleLike={handleToggleLike}
        onAddComment={handleAddComment}
      />
    </View>
  )
}
