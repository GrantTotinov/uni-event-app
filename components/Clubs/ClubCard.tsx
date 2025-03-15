import { View, Text, Image } from "react-native"
import React from "react"
import { CLUB } from "@/app/explore-clubs"
import Colors from "@/data/Colors"
import Button from "../Shared/Button"

export default function ClubCard(club: CLUB) {
  const onFollowBtnClick = () => {}
  return (
    <View
      style={{
        flex: 1,
        padding: 10,
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
        style={{
          fontSize: 15,
          fontWeight: "bold",
        }}
      >
        {club.name}
      </Text>
      <Text
        numberOfLines={2}
        style={{
          color: Colors.GRAY,
        }}
      >
        {club.about}
      </Text>
      <Button text="Последвай" onPress={() => onFollowBtnClick()} />
    </View>
  )
}
