import { View, Text, Image, TextInput } from "react-native"
import React, { useContext } from "react"
import Colors from "@/data/Colors"
import { AuthContext } from "@/context/AuthContext"
import { scale, verticalScale, moderateScale } from "react-native-size-matters"
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
        //paddingHorizontal: scale(16),
        //paddingVertical: verticalScale(8),
      }}
    >
      <View>
        <Text
          style={{
            fontSize: moderateScale(24),
            fontWeight: "bold",
            color: Colors.PRIMARY,
            marginBottom: verticalScale(4),
          }}
        >
          Здравейте!
        </Text>
        <Text
          style={{
            fontSize: moderateScale(16),
            color: Colors.GRAY,
            marginBottom: verticalScale(6),
          }}
        >
          {user?.name}
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Търси пост или коментар..."
          style={{
            marginTop: verticalScale(8),
            padding: scale(10),
            borderRadius: scale(10),
            backgroundColor: Colors.WHITE,
            borderWidth: scale(1),
            borderColor: Colors.GRAY,
            fontSize: moderateScale(16),
            width: scale(300),
            maxWidth: scale(235),
          }}
        />
      </View>
      <Image
        source={{ uri: user?.image }}
        style={{
          height: scale(50),
          width: scale(50),
          borderRadius: scale(25),
          marginLeft: scale(12),
        }}
      />
    </View>
  )
}
