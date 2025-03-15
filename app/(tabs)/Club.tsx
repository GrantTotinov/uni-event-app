import { View, Text } from "react-native"
import React, { useState } from "react"
import EmptyState from "@/components/Clubs/EmptyState"

export default function Club() {
  const [followedClubs, setFollowedClubs] = useState([])
  return (
    <View>
      <View
        style={{
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 25,
            fontWeight: "bold",
          }}
        >
          Студентски клубове
        </Text>
        {followedClubs?.length == 0 && <EmptyState />}
      </View>
    </View>
  )
}
