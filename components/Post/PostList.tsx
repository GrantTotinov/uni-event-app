import { View, Text, FlatList } from "react-native"
import React, { useEffect } from "react"
import PostCard from "./PostCard"

export default function PostList({ posts, OnRefresh, loading }: any) {
  useEffect(() => {
    console.log("Posts data:", posts)
  }, [posts])
  return (
    <View>
      <FlatList
        data={posts}
        onRefresh={OnRefresh}
        refreshing={loading}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <PostCard post={item} />}
      />
    </View>
  )
}
