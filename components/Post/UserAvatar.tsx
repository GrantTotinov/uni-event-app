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
  localDate?: string
  role?: string | null
}

export default function UserAvatar({
  name,
  image,
  date,
  localDate,
  role,
}: USER_AVATAR) {
  let formattedDate = "Невалидна дата"

  if (date === "Now") {
    formattedDate = "току-що"
  } else {
    try {
      if (localDate) {
        formattedDate = moment(localDate).fromNow()
      } else {
        formattedDate = moment.utc(date).tz("Europe/Sofia").fromNow()
      }
    } catch (error) {
      console.error("Грешка при форматиране на датата:", error)
    }
  }

  const getRoleDisplayText = (userRole: string | null | undefined): string => {
    switch (userRole) {
      case "admin":
        return "Админ"
      case "teacher":
        return "Преподавател"
      case "user":
        return "Студент"
      default:
        return "Студент"
    }
  }

  const getRoleColor = (userRole: string | null | undefined): string => {
    switch (userRole) {
      case "admin":
        return "#dc3545" // Червен за админ
      case "teacher":
        return "#007bff" // Син за преподавател
      case "user":
        return Colors.GRAY // Сив за студент
      default:
        return Colors.GRAY
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text
              style={{
                color: getRoleColor(role),
                fontSize: 14,
                fontWeight: "600",
              }}
            >
              {getRoleDisplayText(role)}
            </Text>
            <Text style={{ color: Colors.GRAY, fontSize: 14 }}>•</Text>
            <Text style={{ color: Colors.GRAY, fontSize: 14 }}>
              {formattedDate}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
