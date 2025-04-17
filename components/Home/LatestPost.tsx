import React, { useEffect, useState } from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import Colors from "@/data/Colors"
import axios from "axios"
import PostList from "../Post/PostList"

export default function LatestPost() {
  const [selectedTab, setSelectedTab] = useState(0)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getPosts()
  }, [selectedTab])

  const getPosts = async () => {
    setLoading(true)

    // Определяме orderField според избрания таб
    let orderField = selectedTab === 0 ? "post.createdon" : "likes_count"
    // club може да остане същото или да бъде адаптирано спрямо логиката на вашето приложение
    const url = `${process.env.EXPO_PUBLIC_HOST_URL}/post?club=0&orderField=${orderField}`

    try {
      const result = await axios.get(url)
      setPosts(result.data)
    } catch (error) {
      console.error("Грешка при извличане на постовете", error)
    }
    setLoading(false)
  }

  return (
    <View style={{ marginTop: 15 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Pressable onPress={() => setSelectedTab(0)}>
          <Text
            style={[
              styles.tabtext,
              {
                backgroundColor:
                  selectedTab === 0 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab === 0 ? Colors.WHITE : Colors.PRIMARY,
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
                  selectedTab === 1 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab === 1 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Трендинг
          </Text>
        </Pressable>
      </View>
      <PostList posts={posts} loading={loading} onRefresh={getPosts} />
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
