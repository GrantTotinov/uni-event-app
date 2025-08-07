import React, { useEffect, useState } from "react"
import { View, Text, Pressable, StyleSheet } from "react-native"
import Colors from "@/data/Colors"
import axios from "axios"
import PostList from "../Post/PostList"

type Comment = {
  comment: string
}

type Post = {
  context: string
  post_id: number
  comments?: Comment[]
}

export default function LatestPost({ search }: { search: string }) {
  const [selectedTab, setSelectedTab] = useState(0)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getPosts()
  }, [selectedTab])

  const getPosts = async () => {
    setLoading(true)
    let orderField = selectedTab === 0 ? "post.createdon" : "likes_count"
    const url = `${process.env.EXPO_PUBLIC_HOST_URL}/post?club=0&orderField=${orderField}`

    try {
      const result = await axios.get(url)
      const postsWithComments = await Promise.all(
        result.data.map(async (post: Post) => {
          try {
            const commentsRes = await axios.get(
              `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}`
            )
            return { ...post, comments: commentsRes.data }
          } catch {
            return { ...post, comments: [] }
          }
        })
      )
      setPosts(postsWithComments)
    } catch (error) {
      console.error("Грешка при извличане на постовете", error)
    }
    setLoading(false)
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.context?.toLowerCase().includes(search.toLowerCase()) ||
      post.comments?.some((c) =>
        c.comment?.toLowerCase().includes(search.toLowerCase())
      )
  )

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
            Популарни
          </Text>
        </Pressable>
      </View>
      <PostList posts={filteredPosts} loading={loading} onRefresh={getPosts} />
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
