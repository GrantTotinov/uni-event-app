import React, { memo } from "react"
import { FlatList, RefreshControl, ActivityIndicator, View } from "react-native"
import Colors from "@/data/Colors"
import PostCard from "./PostCard"
import PostCardSkeleton from "./PostCard/PostCardSkeleton"

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
  comments?: any[]
}

interface PostListProps {
  posts: Post[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  showSkeleton?: boolean
  onRefresh: () => void
  onLoadMore?: () => void
  onToggleLike?: (postId: number, isLiked: boolean) => void
  onAddComment?: (postId: number, comment: string) => Promise<boolean>
}

const PostItem = memo(
  ({
    item,
    onUpdate,
    onToggleLike,
    onAddComment,
  }: {
    item: Post
    onUpdate: () => void
    onToggleLike?: (postId: number, isLiked: boolean) => void
    onAddComment?: (postId: number, comment: string) => Promise<boolean>
  }) => {
    // Show skeleton for negative IDs
    if (item.post_id < 0) {
      return <PostCardSkeleton />
    }
    return (
      <PostCard
        post={item}
        onUpdate={onUpdate}
        onToggleLike={onToggleLike}
        onAddComment={onAddComment}
      />
    )
  }
)

const PostList = memo(
  ({
    posts,
    loading,
    loadingMore = false,
    hasMore = true,
    showSkeleton = false,
    onRefresh,
    onLoadMore,
    onToggleLike,
    onAddComment,
  }: PostListProps) => {
    const renderPost = ({ item }: { item: Post }) => (
      <PostItem
        item={item}
        onUpdate={onRefresh}
        onToggleLike={onToggleLike}
        onAddComment={onAddComment}
      />
    )

    const renderFooter = () => {
      if (!loadingMore) return null
      return (
        <View style={{ paddingVertical: 20 }}>
          <ActivityIndicator color={Colors.PRIMARY} />
        </View>
      )
    }

    const keyExtractor = (item: Post) => item.post_id.toString()

    const onEndReached = () => {
      if (onLoadMore && hasMore && !loadingMore && !loading && !showSkeleton) {
        onLoadMore()
      }
    }

    // If showing skeleton, don't show refresh indicator
    const shouldShowRefreshControl = !showSkeleton

    return (
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={5}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
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
        showsVerticalScrollIndicator={false}
      />
    )
  }
)

PostItem.displayName = "PostItem"
PostList.displayName = "PostList"

export default PostList
