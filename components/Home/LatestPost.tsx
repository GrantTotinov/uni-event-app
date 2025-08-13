import React, { useMemo, useState } from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import Colors from '@/data/Colors'
import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'
import PostList from '@/components/Post/PostList'
import { useAllPosts } from '@/hooks/usePosts'

export default function LatestPost({ search }: { search: string }) {
  const { user } = useContext(AuthContext)
  const [selectedTab, setSelectedTab] = useState<0 | 1>(0)

  // Use React Query hook for posts - handles caching, loading states, and pagination automatically
  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchNextPage,
    refetch,
    likeMutation,
    commentMutation,
  } = useAllPosts(selectedTab, user?.email)

  // Filter posts based on search query
  const filteredPosts = useMemo(() => {
    const query = (search || '').toLowerCase()
    if (!query) return posts

    return posts.filter((post) => post.context?.toLowerCase().includes(query))
  }, [posts, search])

  // Handle infinite scroll pagination
  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      fetchNextPage()
    }
  }

  // Handle like/unlike with optimistic updates
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

  // Handle comment submission with optimistic updates - now always returns boolean
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

  return (
    <View style={{ marginTop: 15 }}>
      {/* Tab buttons for Latest/Popular */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable onPress={() => setSelectedTab(0)}>
          <Text
            style={[
              styles.tabText,
              {
                backgroundColor:
                  selectedTab === 0 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab === 0 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Последни
          </Text>
        </Pressable>
        <Pressable onPress={() => setSelectedTab(1)}>
          <Text
            style={[
              styles.tabText,
              {
                backgroundColor:
                  selectedTab === 1 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab === 1 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Популярни
          </Text>
        </Pressable>
      </View>

      {/* Posts list with all optimizations */}
      <PostList
        posts={filteredPosts}
        loading={isLoading}
        loadingMore={isLoadingMore}
        hasMore={hasMore}
        onRefresh={refetch}
        onLoadMore={handleLoadMore}
        onToggleLike={handleToggleLike}
        onAddComment={handleAddComment}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  tabText: {
    borderColor: Colors.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    fontWeight: '600',
  },
})
