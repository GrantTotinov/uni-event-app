import { View, Text, FlatList } from "react-native"
import React, { useEffect } from "react"
import PostCard from "./PostCard"

export default function PostList({ posts = [], OnRefresh, loading }: any) {
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
        onRefresh={OnRefresh}
        refreshing={loading}
        keyExtractor={(item) => item.post_id.toString()}
        //keyExtractor={(item) => `${item.id}_${item.createdon}`}
        renderItem={({ item }) => <PostCard post={item} />}
      />
    </View>
  )
}
