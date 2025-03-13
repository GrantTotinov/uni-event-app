import { View, Text, Image } from "react-native"
import React, { useContext } from "react"
import Colors from "@/data/Colors"
import { AuthContext } from "@/context/AuthContext"

export default function Header() {
  const { user } = useContext(AuthContext)
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: Colors.PRIMARY,
          }}
        >
          Здравейте!
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: Colors.GRAY,
          }}
        >
          Университет по Хранителни Технологии
        </Text>
      </View>
      <Image
        source={{ uri: user?.image }}
        style={{
          height: 50,
          width: 50,
          borderRadius: 99,
        }}
      />
    </View>
  )
}
