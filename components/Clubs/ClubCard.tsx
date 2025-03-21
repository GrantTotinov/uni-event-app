import { View, Text, Image } from "react-native"
import React, { useContext, useState } from "react"
import { CLUB } from "@/app/explore-clubs"
import Colors from "@/data/Colors"
import Button from "../Shared/Button"
import { AuthContext } from "@/context/AuthContext"
import axios from "axios"
import { center } from "@cloudinary/url-gen/qualifiers/textAlignment"

export default function ClubCard(club: CLUB) {
  const { user } = useContext(AuthContext)
  const [loading, setLoading] = useState(false)
  const onFollowBtnClick = async () => {
    setLoading(true)
    if (club.isFollowed) {
      const result = await axios.delete(
        process.env.EXPO_PUBLIC_HOST_URL +
          "/clubfollower?u_email=" +
          user?.email +
          "&club_id=" +
          club.id
      )
    } else {
      const result = await axios.post(
        process.env.EXPO_PUBLIC_HOST_URL + "/clubfollower",
        {
          u_email: user?.email,
          clubId: club?.id,
        }
      )
    }
    club.refreshData()
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
        text={club.isFollowed ? "Отпоследвай" : "Последвай"}
        onPress={() => onFollowBtnClick()}
        outline={club.isFollowed}
        loading={loading}
      />
    </View>
  )
}
