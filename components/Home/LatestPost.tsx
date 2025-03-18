import { View, Text, Pressable, StyleSheet, processColor } from "react-native"
import React, { useEffect, useState } from "react"
import Colors from "@/data/Colors"
import axios from "axios"
import PostList from "../Post/PostList"

export default function LatestPost() {
  const [selectedTab, setSelectedTab] = useState(0)
  const [posts, setPosts] = useState()
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    GetPosts()
  }, [])
  const GetPosts = async () => {
    // Fetch all post from the database
    setLoading(true)
    const result = await axios.get(
      process.env.EXPO_PUBLIC_HOST_URL + "/post?club=0&orderField=post.id"
    )
    setPosts(result.data)
    setLoading(false)
  }

  return (
    <View
      style={{
        marginTop: 15,
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
        }}
      >
        <Pressable onPress={() => setSelectedTab(0)}>
          <Text
            style={[
              styles.tabtext,
              {
                backgroundColor:
                  selectedTab == 0 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab == 0 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Последни
          </Text>
        </Pressable>
        <Pressable onPress={() => setSelectedTab(1)}>
          <Text
            style={[
              styles.tabtext,
              {
                backgroundColor:
                  selectedTab == 1 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab == 1 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Трендинг
          </Text>
        </Pressable>
      </View>
      <PostList posts={posts} loading={loading} onRefresh={GetPosts} />
    </View>
  )
}
const styles = StyleSheet.create({
  tabtext: {
    padding: 4,
    fontSize: 20,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
})
