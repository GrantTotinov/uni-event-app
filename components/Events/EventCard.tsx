import { View, Text, Image, StyleSheet } from "react-native"
import React from "react"
import Colors from "@/data/Colors"
import Entypo from "@expo/vector-icons/Entypo"
import Ionicons from "@expo/vector-icons/Ionicons"
import Button from "../Shared/Button"

type EVENT = {
  id: number
  name: string
  bannerurl: string
  location: string
  link: string
  event_date: string
  event_time: string
  createdby: string
  username: string
}

export default function EventCard(event: EVENT) {
  return (
    <View
      style={{
        padding: 20,
        backgroundColor: Colors.WHITE,
        marginBottom: 3,
      }}
    >
      <Image
        source={{ uri: event.bannerurl }}
        style={{
          height: 250,
          borderRadius: 15,
        }}
      />
      <Text
        style={{
          fontSize: 23,
          fontWeight: "bold",
          marginTop: 7,
        }}
      >
        {event.name}
      </Text>
      <Text
        style={{
          color: Colors.GRAY,
          fontSize: 16,
        }}
      >
        Създадено от: {event.username}
      </Text>
      <View style={styles.subContainer}>
        <Entypo name="location" size={24} color={Colors.GRAY} />
        <Text
          style={{
            color: Colors.GRAY,
            fontSize: 16,
          }}
        >
          {event.location}
        </Text>
      </View>

      <View style={styles.subContainer}>
        <Ionicons name="calendar-number" size={24} color={Colors.GRAY} />
        <Text
          style={{
            color: Colors.GRAY,
            fontSize: 16,
          }}
        >
          {event.event_date} от {event.event_time}
        </Text>
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Button text="Сподели" outline={true} onPress={() => console.log()} />
        <Button text="Регистрирай се" onPress={() => console.log()} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  subContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 5,
  },
})
