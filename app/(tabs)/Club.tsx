// app/(tabs)/Club.tsx
import React, { useContext, useState, useCallback, useMemo } from 'react'
import { View, ScrollView, StatusBar, StyleSheet } from 'react-native'
import {
  Surface,
  Text,
  Button,
  Chip,
  useTheme,
  Searchbar,
  FAB,
  Card,
  ActivityIndicator,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'
import { useAppTheme } from '@/context/ThemeContext'
import EmptyState from '@/components/Clubs/EmptyState'
import PostList from '@/components/Post/PostList'
import { useFollowedPosts } from '@/hooks/usePosts'
import { useFollowedClubs } from '@/hooks/useClubs'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function Club() {
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()
  const router = useRouter()
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Memoized data fetching
  const { data: followedClubs = [], isLoading: clubsLoading } =
    useFollowedClubs(user?.email)

  // Filter out invalid clubs with undefined/null ids and apply search
  const validClubs = useMemo(() => {
    const filtered = followedClubs.filter((club) => club?.id != null)
    if (!searchQuery) return filtered
    return filtered.filter((club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [followedClubs, searchQuery])

  // Use React Query hook for followed posts - filtered by selected club
  const {
    posts: followedPosts,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchNextPage,
    refetch,
    likeMutation,
    commentMutation,
  } = useFollowedPosts(user?.email, undefined, selectedClubId)

  // Memoized handlers for performance
  const handleToggleLike = useCallback(
    async (postId: number, isLiked: boolean) => {
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
    },
    [user?.email, likeMutation]
  )

  const handleAddComment = useCallback(
    async (postId: number, comment: string): Promise<boolean> => {
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
    },
    [user?.email, commentMutation]
  )

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchNextPage()
    }
  }, [hasMore, isLoadingMore, isLoading, fetchNextPage])

  const handleClubSelect = useCallback(
    (clubId: number | null) => {
      setSelectedClubId(clubId)
      refetch()
    },
    [refetch]
  )

  const handleExploreClubs = useCallback(() => {
    router.push('/explore-clubs')
  }, [router])

  const showSkeleton = isLoading && followedPosts.length === 0

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        backgroundColor={theme.colors.surface}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <Surface
        style={[styles.header, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        <View style={styles.headerContent}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Студентски групи
          </Text>
          <Button
            mode="contained"
            onPress={handleExploreClubs}
            icon="magnify"
            compact
          >
            ТЪРСИ
          </Button>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Търси в групите..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            elevation={1}
          />
        </View>

        {/* Horizontal Club Filter */}
        {validClubs.length > 0 && (
          <View style={styles.clubFilterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipContainer}
            >
              {/* All Clubs Chip */}
              <Chip
                icon="apps"
                selected={selectedClubId === null}
                onPress={() => handleClubSelect(null)}
                style={styles.chip}
                showSelectedOverlay
              >
                Всички
              </Chip>

              {/* Individual Club Chips */}
              {validClubs.map((club, index) => (
                <Chip
                  key={`club-${club.id}-${index}`}
                  selected={selectedClubId === club.id}
                  onPress={() => handleClubSelect(club.id)}
                  style={styles.chip}
                  showSelectedOverlay
                >
                  {club.name || 'Неименован клуб'}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Loading indicator for clubs */}
        {clubsLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" />
            <Text variant="bodySmall" style={styles.loadingText}>
              Зареждане на групи...
            </Text>
          </View>
        )}

        {/* Empty state for no followed clubs */}
        {!clubsLoading && followedPosts?.length === 0 && !isLoading && (
          <EmptyState />
        )}
      </Surface>

      {/* Posts List */}
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

      {/* Floating Action Button for creating new club */}
      <FAB
        icon="plus"
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
          },
        ]}
        onPress={handleExploreClubs}
        label="Нова група"
      />
    </Surface>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchbar: {
    elevation: 1,
  },
  clubFilterContainer: {
    paddingBottom: 8,
  },
  chipContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
})
