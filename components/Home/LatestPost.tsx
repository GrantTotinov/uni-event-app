import { View, Text, Pressable, StyleSheet } from "react-native"
import React, { useEffect, useState } from "react"
import axios from "axios"
import Colors from "@/data/Colors"
import PostList from "../Post/PostList"

interface Post {
  post_id: number
  context: string
  imageurl: string
  createdby: string
  createdon: string
  createdon_local: string
  name: string
  image: string
  role: string
  like_count: number
  comment_count: number
  is_uht_related: boolean
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
    let orderField = selectedTab === 0 ? "post.createdon" : "like_count.count"
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
          } catch (error) {
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
      post.comments?.some((c: any) =>
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
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
    overflow: "hidden",
    fontWeight: "600",
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    textAlign: "center" as const,
  },
})
