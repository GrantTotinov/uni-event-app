import React from "react"
import { View, Text } from "react-native"
import { Image } from "expo-image"
import { styles } from "./styles"

interface PostContentProps {
  post: any
}

export default function PostContent({ post }: PostContentProps) {
  return (
    <View>
      <Text style={styles.contentText}>{post?.context}</Text>
      {post.imageurl && (
        <Image
          source={{ uri: post.imageurl }}
          style={styles.postImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      )}
    </View>
  )
}
