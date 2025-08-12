import { View, Text, Image } from "react-native"
import React from "react"
import Colors from "@/data/Colors"
import moment from "moment"
import "moment/locale/bg"

moment.locale("bg")

interface USER_AVATAR {
  name: string
  image: string
  date: string
  localDate?: string
  role?: string
  isUhtRelated?: boolean
}

export default function UserAvatar({
  name,
  image,
  date,
  localDate,
  role,
  isUhtRelated,
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
        return "#dc3545"
      case "teacher":
        return "#007bff"
      case "user":
        return Colors.GRAY
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
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>{name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              style={{
                color: getRoleColor(role),
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              {getRoleDisplayText(role)}
            </Text>
            {isUhtRelated && (
              <View
                style={{
                  backgroundColor: "#e8f4fd",
                  borderColor: "#0066cc",
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    color: "#0066cc",
                    fontSize: 10,
                    fontWeight: "bold",
                  }}
                >
                  УХТ
                </Text>
              </View>
            )}
            <Text style={{ color: Colors.GRAY, fontSize: 12 }}>
              {formattedDate}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
