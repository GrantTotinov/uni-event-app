import { View, Text, Image } from "react-native"
import React from "react"
import Colors from "@/data/Colors"
import Ionicons from "@expo/vector-icons/Ionicons"
import moment from "moment-timezone"
import "moment/locale/bg"

moment.locale("bg")

type USER_AVATAR = {
  name: string
  image: string
  date: string
}

export default function UserAvatar({ name, image, date }: USER_AVATAR) {
  //console.log("Received date:", date)

  const sanitizedDate = date === "Now" ? moment().toISOString() : date.trim()

  const localDate = moment(sanitizedDate).tz("Europe/Sofia", true)
  const isValidDate = localDate.isValid()

  const formattedDate = isValidDate ? localDate.fromNow() : "Невалидна дата"

  return (
    <View
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
        }}
      >
        <Image
          source={{ uri: image }}
          style={{
            width: 50,
            height: 50,
            borderRadius: 99,
          }}
        />
        <View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              color: Colors.GRAY,
            }}
          >
            {formattedDate}
          </Text>
        </View>
      </View>
      <Ionicons name="ellipsis-vertical" size={24} color="black" />
    </View>
  )
}
