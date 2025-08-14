import React, { useState, useContext, useEffect } from 'react'
import { View, Text, Pressable, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AuthContext } from '@/context/AuthContext'
import Colors from '@/data/Colors'
import PostList from '@/components/Post/PostList'
import { useAllPosts, usePopularPosts } from '@/hooks/usePosts'

export default function LatestPost({ search }: { search: string }) {
  const { user } = useContext(AuthContext)
  const [selectedTab, setSelectedTab] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('')

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Use the hooks based on selected tab with search functionality
  const latestPostsQuery = useAllPosts(user?.email, false, debouncedSearchQuery)
  const popularPostsQuery = usePopularPosts(
    user?.email,
    false,
    debouncedSearchQuery
  )

  // Select the appropriate query based on selected tab
  const currentQuery = selectedTab === 0 ? latestPostsQuery : popularPostsQuery
  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchNextPage,
    refetch,
    likeMutation,
    commentMutation,
  } = currentQuery

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchNextPage()
    }
  }

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

  const clearSearch = () => {
    setSearchQuery('')
  }

  // Show skeleton on initial load when we have no data yet
  const showSkeleton = isLoading && posts.length === 0

  return (
    <View style={{ marginTop: 15 }}>
      {/* Search Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: Colors.WHITE,
          borderRadius: 25,
          paddingHorizontal: 15,
          paddingVertical: 10,
          marginHorizontal: 20,
          marginBottom: 15,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
      >
        <Ionicons
          name="search"
          size={20}
          color={Colors.GRAY}
          style={{ marginRight: 10 }}
        />
        <TextInput
          placeholder="Търси в публикации и коментари..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{
            flex: 1,
            fontSize: 16,
            color: Colors.BLACK,
          }}
          placeholderTextColor={Colors.GRAY}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={clearSearch} style={{ padding: 5 }}>
            <Ionicons name="close-circle" size={20} color={Colors.GRAY} />
          </Pressable>
        )}
      </View>

      {/* Tab buttons for Latest/Popular */}
      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          paddingHorizontal: 20,
          marginBottom: 10,
        }}
      >
        <Pressable onPress={() => setSelectedTab(0)}>
          <Text
            style={{
              padding: 10,
              paddingHorizontal: 20,
              borderRadius: 25,
              fontWeight: 'bold',
              fontSize: 14,
              backgroundColor:
                selectedTab === 0 ? Colors.PRIMARY : Colors.WHITE,
              color: selectedTab === 0 ? Colors.WHITE : Colors.PRIMARY,
              elevation: selectedTab === 0 ? 3 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            Последни
          </Text>
        </Pressable>
        <Pressable onPress={() => setSelectedTab(1)}>
          <Text
            style={{
              padding: 10,
              paddingHorizontal: 20,
              borderRadius: 25,
              fontWeight: 'bold',
              fontSize: 14,
              backgroundColor:
                selectedTab === 1 ? Colors.PRIMARY : Colors.WHITE,
              color: selectedTab === 1 ? Colors.WHITE : Colors.PRIMARY,
              elevation: selectedTab === 1 ? 3 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            Популярни
          </Text>
        </Pressable>
      </View>

      {/* Search Results Info */}
      {debouncedSearchQuery.trim() && (
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ color: Colors.GRAY, fontSize: 14 }}>
            {isLoading
              ? 'Търсене в публикации и коментари...'
              : `Намерени ${posts.length} публикации за "${debouncedSearchQuery}"`}
          </Text>
          <Text style={{ color: Colors.GRAY, fontSize: 12, marginTop: 2 }}>
            Търсенето включва съдържание на публикации и коментари
          </Text>
        </View>
      )}

      {/* Posts list with all optimizations */}
      <PostList
        posts={posts}
        loading={isLoading}
        loadingMore={isLoadingMore}
        hasMore={hasMore}
        showSkeleton={showSkeleton}
        onRefresh={refetch}
        onLoadMore={handleLoadMore}
        onToggleLike={handleToggleLike}
        onAddComment={handleAddComment}
        searchQuery={debouncedSearchQuery}
      />
    </View>
  )
}
