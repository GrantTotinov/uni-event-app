import React, { memo } from 'react'
import {
  FlatList,
  RefreshControl,
  ActivityIndicator,
  View,
  Text,
} from 'react-native'
import Colors from '@/data/Colors'
import PostCard from './PostCard'
import PostCardSkeleton from './PostCard/PostCardSkeleton'
import type { Post as HooksPost } from '@/hooks/usePosts'
import type { Post as PostCardPost } from './PostCard'

interface PostListProps {
  posts: HooksPost[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  showSkeleton?: boolean
  onRefresh: () => void
  onLoadMore?: () => void
  onToggleLike: (postId: number, isLiked: boolean) => Promise<void>
  onAddComment: (postId: number, comment: string) => Promise<boolean>
  searchQuery?: string
}

// Skeleton post interface for loading states
interface SkeletonPost extends HooksPost {
  post_id: number
  context: string
  imageurl: string
  club: string // Changed from number to string
  createdby: string
  createdon: string
  createdon_local: string
  name: string
  image: string
  role: string
  like_count: number
  comment_count: number
  is_liked: boolean
  is_uht_related: boolean
  user_role: string
}

const PostItem = memo(function PostItem({
  item,
  onToggleLike,
  onAddComment,
}: {
  item: HooksPost | SkeletonPost
  onToggleLike: (postId: number, isLiked: boolean) => Promise<void>
  onAddComment: (postId: number, comment: string) => Promise<boolean>
}) {
  // Show skeleton for negative IDs (prefetched placeholders)
  if (item.post_id < 0) {
    return <PostCardSkeleton />
  }

  // Transform hooks Post to PostCard Post with proper defaults
  const postCardItem: PostCardPost = {
    ...item,
    createdon_local: item.createdon_local || item.createdon,
    role: item.role || item.user_role || 'student',
    is_uht_related: item.is_uht_related ?? false,
  }

  return (
    <PostCard
      post={postCardItem}
      onUpdate={() => {
        // Handle post updates if needed
      }}
    />
  )
})

const PostList = memo(function PostList({
  posts,
  loading,
  loadingMore = false,
  hasMore = true,
  showSkeleton = false,
  onRefresh,
  onLoadMore,
  onToggleLike,
  onAddComment,
  searchQuery = '',
}: PostListProps) {
  const renderPost = ({ item }: { item: HooksPost | SkeletonPost }) => (
    <PostItem
      item={item}
      onToggleLike={onToggleLike}
      onAddComment={onAddComment}
    />
  )

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator color={Colors.PRIMARY} size="small" />
      </View>
    )
  }

  const renderEmptyComponent = () => {
    if (loading || showSkeleton) return null

    const isSearching = searchQuery.trim().length > 0

    return (
      <View style={{ padding: 30, alignItems: 'center' }}>
        <Text style={{ textAlign: 'center', color: Colors.GRAY, fontSize: 16 }}>
          {isSearching
            ? `Няма намерени публикации за "${searchQuery}"`
            : 'Няма налични публикации.'}
        </Text>
        {isSearching && (
          <Text
            style={{
              textAlign: 'center',
              color: Colors.GRAY,
              fontSize: 14,
              marginTop: 8,
            }}
          >
            Опитайте с различни ключови думи
          </Text>
        )}
      </View>
    )
  }

  const keyExtractor = (item: HooksPost | SkeletonPost) => String(item.post_id)

  const onEndReached = () => {
    if (onLoadMore && hasMore && !loadingMore && !loading && !showSkeleton) {
      onLoadMore()
    }
  }

  // Add skeleton posts for initial loading
  const postsWithSkeleton: (HooksPost | SkeletonPost)[] = showSkeleton
    ? [
        ...Array.from(
          { length: 3 },
          (_, index): SkeletonPost => ({
            post_id: -(index + 1),
            context: '',
            imageurl: '',
            club: '',
            createdby: '',
            createdon: '',
            createdon_local: '',
            name: '',
            image: '',
            role: '',
            user_role: '',
            like_count: 0,
            comment_count: 0,
            is_liked: false,
            is_uht_related: false,
          })
        ),
        ...posts,
      ]
    : posts

  // Don't show refresh control if showing skeleton
  const shouldShowRefreshControl = !showSkeleton

  return (
    <FlatList
      data={postsWithSkeleton}
      keyExtractor={keyExtractor}
      renderItem={renderPost}
      contentContainerStyle={{
        paddingBottom: 120,
        flexGrow: 1,
      }}
      refreshControl={
        shouldShowRefreshControl ? (
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={Colors.PRIMARY}
            colors={[Colors.PRIMARY]}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyComponent}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={10}
      initialNumToRender={8}
      showsVerticalScrollIndicator={false}
    />
  )
})

export default PostList
