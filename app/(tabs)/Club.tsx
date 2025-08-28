// app/(tabs)/Club.tsx
import React, { useContext, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'
import Button from '@/components/Shared/Button'
import EmptyState from '@/components/Clubs/EmptyState'
import PostList from '@/components/Post/PostList'
import { useFollowedPosts } from '@/hooks/usePosts'
import { useFollowedClubs } from '@/hooks/useClubs'
import Colors from '@/data/Colors'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function Club() {
  const { user } = useContext(AuthContext)
  const router = useRouter()
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null)

  // Fetch followed clubs
  const { data: followedClubs = [], isLoading: clubsLoading } =
    useFollowedClubs(user?.email)

  // Filter out invalid clubs with undefined/null ids
  const validClubs = React.useMemo(
    () => followedClubs.filter((club) => club?.id != null),
    [followedClubs]
  )

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

  const showSkeleton = isLoading && followedPosts.length === 0

  const handleClubSelect = (clubId: number | null) => {
    setSelectedClubId(clubId)
    // Refresh posts when club changes
    refetch()
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.LIGHT_GRAY }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Студентски групи</Text>
          <Button text="ТЪРСИ" onPress={() => router.push('/explore-clubs')} />
        </View>

        {/* Horizontal Club Filter */}
        {validClubs.length > 0 && (
          <View style={styles.clubFilterContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.clubFilterContent}
            >
              {/* All Clubs Option */}
              <TouchableOpacity
                key="all-clubs"
                style={[
                  styles.clubFilterItem,
                  selectedClubId === null && styles.clubFilterItemActive,
                ]}
                onPress={() => handleClubSelect(null)}
              >
                <Ionicons
                  name="apps-outline"
                  size={20}
                  color={
                    selectedClubId === null ? Colors.WHITE : Colors.PRIMARY
                  }
                />
                <Text
                  style={[
                    styles.clubFilterText,
                    selectedClubId === null && styles.clubFilterTextActive,
                  ]}
                >
                  Всички
                </Text>
              </TouchableOpacity>

              {/* Individual Clubs - Filter valid clubs only */}
              {validClubs.map((club, index) => (
                <TouchableOpacity
                  key={`club-${club.id}-${index}`} // Use both id and index for uniqueness
                  style={[
                    styles.clubFilterItem,
                    selectedClubId === club.id && styles.clubFilterItemActive,
                  ]}
                  onPress={() => handleClubSelect(club.id)}
                >
                  <Text
                    style={[
                      styles.clubFilterText,
                      selectedClubId === club.id && styles.clubFilterTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {club.name || 'Неименован клуб'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {followedPosts?.length === 0 && !isLoading && <EmptyState />}
      </View>

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
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.WHITE,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerContent: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  clubFilterContainer: {
    paddingBottom: 15,
  },
  clubFilterContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  clubFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.LIGHT_GRAY,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    gap: 6,
    minWidth: 80,
  },
  clubFilterItemActive: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  clubFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.PRIMARY,
  },
  clubFilterTextActive: {
    color: Colors.WHITE,
  },
})
