import { View, Text, FlatList } from "react-native"
import React, { useEffect } from "react"
import PostCard from "./PostCard"

export default function PostList({ posts = [], onRefresh, loading }: any) {
  useEffect(() => {
    console.log("Posts data:", posts)
    posts.forEach((post: any) => {
      console.log("Post ID:", post.post_id)
    })
  }, [posts])

  return (
    <View>
      <FlatList
        data={posts}
        onRefresh={onRefresh}
        refreshing={loading}
        keyExtractor={(item) => item.post_id.toString()}
        initialNumToRender={10} // Рендерира първоначално 10 елемента
        maxToRenderPerBatch={10} // Рендерира по 10 елемента на "batch"
        windowSize={5} // Оптимизира размера на прозореца за виртуализация
        renderItem={({ item }) => <PostCard post={item} />}
      />
    </View>
  )
}
