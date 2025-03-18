import { View, Text } from "react-native"
import React, { useEffect, useState } from "react"
import EmptyState from "@/components/Clubs/EmptyState"
import axios from "axios"
import PostList from "@/components/Post/PostList"
import Button from "@/components/Shared/Button"
import { useRouter } from "expo-router"

export default function Club() {
  const [followedClubs, setFollowedClubs] = useState([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  useEffect(() => {
    GetPosts()
  }, [])
  const GetPosts = async () => {
    // Fetch all post from the database
    setLoading(true)
    const result = await axios.get(
      process.env.EXPO_PUBLIC_HOST_URL + "/post?club=1,2&orderField=post.id"
    )
    setFollowedClubs(result.data)
    console.log(result.data)
    setLoading(false)
  }
  return (
    <View>
      <View
        style={{
          padding: 20,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 25,
              fontWeight: "bold",
            }}
          >
            Студентски групи
          </Text>
          <Button text="ТЪРСИ" onPress={() => router.push("/explore-clubs")} />
        </View>
        {followedClubs?.length == 0 && <EmptyState />}
      </View>
      <PostList posts={followedClubs} loading={loading} onRefresh={GetPosts} />
    </View>
  )
}
