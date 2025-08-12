import React, { memo } from "react"
import { FlatList, RefreshControl } from "react-native"
import Colors from "@/data/Colors"
import PostCard from "./PostCard"

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
  comments?: any[]
}

interface PostListProps {
  posts: Post[]
  loading: boolean
  onRefresh: () => void
}

const PostItem = memo(
  ({ item, onUpdate }: { item: Post; onUpdate: () => void }) => {
    return <PostCard post={item} onUpdate={onUpdate} />
  }
)

const PostList = memo(({ posts, loading, onRefresh }: PostListProps) => {
  const renderPost = ({ item }: { item: Post }) => (
    <PostItem item={item} onUpdate={onRefresh} />
  )

  const getItemLayout = (_: any, index: number) => ({
    length: 400, // Приблизителна височина на PostCard
    offset: 400 * index,
    index,
  })

  const keyExtractor = (item: Post) => item.post_id.toString()

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={10}
      initialNumToRender={3}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor={Colors.PRIMARY}
          colors={[Colors.PRIMARY]}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  )
})

PostItem.displayName = "PostItem"
PostList.displayName = "PostList"

export default PostList
