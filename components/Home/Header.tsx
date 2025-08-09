import { View, Text, Image, TextInput } from "react-native"
import React, { useContext } from "react"
import Colors from "@/data/Colors"
import { AuthContext } from "@/context/AuthContext"

export default function Header({
  search,
  setSearch,
}: {
  search: string
  setSearch: (v: string) => void
}) {
  const { user } = useContext(AuthContext)
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        //paddingHorizontal: 16,
        //paddingVertical: 8,
      }}
    >
      <View>
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: Colors.PRIMARY,
            marginBottom: 4,
          }}
        >
          Здравейте!
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: Colors.GRAY,
            marginBottom: 6,
          }}
        >
          {user?.name}
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Търси пост или коментар..."
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 10,
            backgroundColor: Colors.WHITE,
            borderWidth: 1,
            borderColor: Colors.GRAY,
            fontSize: 16,
            width: 300,
            maxWidth: 235,
          }}
        />
      </View>
      <Image
        source={{ uri: user?.image }}
        style={{
          height: 50,
          width: 50,
          borderRadius: 25,
          marginLeft: 12,
        }}
      />
    </View>
  )
}
