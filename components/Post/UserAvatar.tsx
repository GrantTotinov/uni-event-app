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
  // Ако date е "Now" използваме текущата дата, иначе отрязваме излишните интервали.
  const sanitizedDate = date === "Now" ? moment().toISOString() : date.trim()
  const localDate = moment.utc(sanitizedDate).tz("Europe/Sofia")
  const formattedDate = localDate.isValid()
    ? localDate.fromNow()
    : "Невалидна дата"

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Image
          source={{ uri: image }}
          style={{ width: 50, height: 50, borderRadius: 99 }}
        />
        <View>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{name}</Text>
          <Text style={{ color: Colors.GRAY }}>{formattedDate}</Text>
        </View>
      </View>
    </View>
  )
}
