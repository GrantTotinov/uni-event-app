import { View, Text } from "react-native"
import React, { useContext, useCallback, useState } from "react"
import EmptyState from "@/components/Clubs/EmptyState"
import axios from "axios"
import PostList from "@/components/Post/PostList"
import Button from "@/components/Shared/Button"
import { useRouter, useFocusEffect } from "expo-router"
import { AuthContext } from "@/context/AuthContext"

export default function Club() {
  const [followedClubs, setFollowedClubs] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useContext(AuthContext)
  const router = useRouter()

  const GetPosts = async () => {
    setLoading(true)
    try {
      const result = await axios.get(
        process.env.EXPO_PUBLIC_HOST_URL + "/post?u_email=" + user.email
      )
      setFollowedClubs(result.data)
    } catch (error) {
      console.error("Error fetching posts:", error)
    }
    setLoading(false)
  }

  // Използвай useFocusEffect за презареждане на данните когато екранът получи фокус
  useFocusEffect(
    useCallback(() => {
      GetPosts()
    }, [])
  )

  return (
    <View>
      <View style={{ padding: 20 }}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 25, fontWeight: "bold" }}>
            Студентски групи
          </Text>
          <Button text="ТЪРСИ" onPress={() => router.push("/explore-clubs")} />
        </View>
        {followedClubs?.length === 0 && <EmptyState />}
      </View>
      <PostList posts={followedClubs} loading={loading} onRefresh={GetPosts} />
    </View>
  )
}
