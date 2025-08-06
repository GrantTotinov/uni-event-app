import { View, Text, Image } from "react-native"
import React from "react"
import Colors from "@/data/Colors"
import Ionicons from "@expo/vector-icons/Ionicons"
import moment from "moment"
import "moment/locale/bg"

moment.locale("bg")

type USER_AVATAR = {
  name: string
  image: string
  date: string
  localDate?: string // Добавяме новото поле
}

export default function UserAvatar({
  name,
  image,
  date,
  localDate,
}: USER_AVATAR) {
  // Форматиране на датата, използвайки localDate когато е налично
  // В UserAvatar функцията:

  // Добавете логване за дебъгиране
  console.log("UserAvatar props:", { name, image, date, localDate })

  // Променете логиката:
  let formattedDate = "Невалидна дата"

  if (date === "Now") {
    formattedDate = "току-що"
  } else {
    try {
      // Използваме localDate ако е налично
      if (localDate) {
        console.log("Using localDate:", localDate)
        formattedDate = moment(localDate).fromNow()
      } else {
        console.log("Using date with UTC conversion:", date)
        formattedDate = moment.utc(date).tz("Europe/Sofia").fromNow()
      }
    } catch (error) {
      console.error("Грешка при форматиране на датата:", error)
    }
  }

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
