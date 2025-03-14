import { View, Text, FlatList } from "react-native"
import React from "react"
import PostCard from "./PostCard"

export default function PostList({ posts }: any) {
  return (
    <View>
      <FlatList
        data={posts}
        renderItem={({ item, index }) => <PostCard post={item} />}
      />
    </View>
  )
}
