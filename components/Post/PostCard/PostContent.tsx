import React from "react"
import { View, Text, Image } from "react-native"
import { styles } from "./styles"

interface PostContentProps {
  post: any
}

export default function PostContent({ post }: PostContentProps) {
  return (
    <View>
      <Text style={styles.contentText}>{post?.context}</Text>
      {post.imageurl && (
        <Image source={{ uri: post.imageurl }} style={styles.postImage} />
      )}
    </View>
  )
}
