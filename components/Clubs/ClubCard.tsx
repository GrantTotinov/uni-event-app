import { View, Text, Image } from "react-native"
import React, { useContext, useState } from "react"
import { CLUB } from "@/app/explore-clubs"
import Colors from "@/data/Colors"
import Button from "../Shared/Button"
import { AuthContext } from "@/context/AuthContext"
import axios from "axios"

import { useEffect } from "react"

export default function ClubCard(club: CLUB) {
  const { user } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)
  const [isFollowed, setIsFollowed] = useState(club.isFollowed)

  // Синхронизиране на локалното state с пропса
  useEffect(() => {
    setIsFollowed(club.isFollowed)
  }, [club.isFollowed])

  const onFollowBtnClick = async () => {
    setLoading(true)
    try {
      if (isFollowed) {
        await axios.delete(
          process.env.EXPO_PUBLIC_HOST_URL +
            "/clubfollower?u_email=" +
            user?.email +
            "&club_id=" +
            club.id
        )
      } else {
        await axios.post(process.env.EXPO_PUBLIC_HOST_URL + "/clubfollower", {
          u_email: user?.email,
          clubId: club?.id,
        })
      }
      setIsFollowed(!isFollowed) // Обновява локалното състояние
      club.refreshData() // Обновява данните от родителския компонент
    } catch (error) {
      console.error("Error updating follow status:", error)
    }
    setLoading(false)
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 15,
        backgroundColor: Colors.WHITE,
        margin: 10,
        display: "flex",
        alignItems: "center",
        borderRadius: 15,
      }}
    >
      <Image
        source={{ uri: club.club_logo }}
        style={{
          width: 80,
          height: 80,
          borderRadius: 99,
        }}
      />
      <Text
        numberOfLines={2}
        style={{
          fontSize: 15,
          fontWeight: "bold",
          minHeight: 40,
          textAlign: "center",
          minWidth: 180,
        }}
      >
        {club.name}
      </Text>
      <Text
        numberOfLines={2}
        style={{
          color: Colors.GRAY,
          minHeight: 40,
        }}
      >
        {club.about}
      </Text>

      <Button
        text={isFollowed ? "Отпоследвай" : "Последвай"}
        onPress={onFollowBtnClick}
        outline={isFollowed}
        loading={loading}
      />
    </View>
  )
}
