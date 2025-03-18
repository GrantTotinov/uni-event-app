import { View, Text } from "react-native"
import React from "react"
import Button from "@/components/Shared/Button"
import { useRouter } from "expo-router"

export default function Event() {
  const router = useRouter()
  return (
    <View>
      <View
        style={{
          padding: 20,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "bold",
          }}
        >
          Събития
        </Text>
        <Button text="+" onPress={() => router.push("/add-event")} />
      </View>
    </View>
  )
}
