import { View, Text, Image } from "react-native"
import React from "react"
import UserAvatar from "./UserAvatar"
import Colors from "@/data/Colors"

export default function PostCard({ post }: any) {
  return (
    <View
      style={{
        padding: 15,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        marginTop: 10,
      }}
    >
      <UserAvatar
        name={post?.name}
        image={post?.image}
        date={post?.createdon}
      />
      <Text
        style={{
          fontSize: 18,
          marginTop: 10,
        }}
      >
        {post?.content}
      </Text>

      {post.imageurl && (
        <Image
          source={{ uri: post.imageurl }}
          style={{
            width: "100%",
            height: 300,
            objectFit: "cover",
            borderRadius: 10,
          }}
        />
      )}
    </View>
  )
}
