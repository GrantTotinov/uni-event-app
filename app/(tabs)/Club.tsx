import React, { useContext } from "react"
import { View, Text } from "react-native"
import { useRouter } from "expo-router"
import { AuthContext } from "@/context/AuthContext"
import Button from "@/components/Shared/Button"
import EmptyState from "@/components/Clubs/EmptyState"
import PostList from "@/components/Post/PostList"
import { useFollowedPosts } from "@/hooks/usePosts"

export default function Club() {
  const { user } = useContext(AuthContext)
  const router = useRouter()

  // Use React Query hook for followed posts - automatic caching and loading states
  const {
    posts: followedPosts,
    isLoading,
    refetch,
  } = useFollowedPosts(user?.email)

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
        {followedPosts?.length === 0 && !isLoading && <EmptyState />}
      </View>
      <PostList posts={followedPosts} loading={isLoading} onRefresh={refetch} />
    </View>
  )
}
