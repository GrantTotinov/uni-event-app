import { View, Text, Image, StyleSheet, Alert } from "react-native"
import React, { useContext, useState } from "react"
import Colors from "@/data/Colors"
import Entypo from "@expo/vector-icons/Entypo"
import Ionicons from "@expo/vector-icons/Ionicons"
import Button from "../Shared/Button"
import axios from "axios"
import { AuthContext } from "@/context/AuthContext"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"

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
  isRegistered: boolean
}

export default function EventCard(event: EVENT) {
  const { user } = useContext(AuthContext)
  const [isRegistered, setIsRegistered] = useState(event.isRegistered)

  const handleRegister = () => {
    Alert.alert("Регистрация за събитие!", "Потвърди регистрацията!", [
      {
        text: "Потвърждавам",
        onPress: async () => {
          try {
            await axios.post(
              `${process.env.EXPO_PUBLIC_HOST_URL}/event-register`,
              {
                eventId: event.id,
                userEmail: user?.email,
              }
            )
            setIsRegistered(true)
            Alert.alert("Чудесно!", "Успешно се регистрирахте за събитието!")
          } catch (error) {
            console.error(error)
            Alert.alert("Грешка!", "Неуспешна регистрация.")
          }
        },
      },
      {
        text: "Отказ",
        style: "cancel",
      },
    ])
  }

  const handleUnregister = () => {
    Alert.alert(
      "Отписване от събитие!",
      "Сигурни ли сте, че искате да се отпишете?",
      [
        {
          text: "Да",
          onPress: async () => {
            try {
              await axios.delete(
                `${process.env.EXPO_PUBLIC_HOST_URL}/event-register`,
                {
                  data: { eventId: event.id, userEmail: user?.email },
                }
              )
              setIsRegistered(false)
              Alert.alert("Готово!", "Вече не сте записани за събитието.")
            } catch (error) {
              console.error(error)
              Alert.alert("Грешка!", "Неуспешно отписване.")
            }
          },
        },
        {
          text: "Отказ",
          style: "cancel",
        },
      ]
    )
  }
  const shareImage = async () => {
    try {
      const fileUri = (await FileSystem.documentDirectory) + "shared-image.jpg"

      const { uri } = await FileSystem.downloadAsync(event.bannerurl, fileUri)

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: "Погледни новото интересно събитие",
          mimeType: "image/jpeg",
          UTI: "public.jpeg",
        })
      } else {
        Alert.alert("Споделянето не е позволено на това устройство")
      }
    } catch (error) {
      console.error("Error sharing image", error)
      Alert.alert("Грешка", "Неуспешно споделяне на снимката")
    }
  }
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
      {!event.isRegistered ? (
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Button text="Сподели" outline={true} onPress={() => shareImage()} />
          <Button text="Регистрирай се" onPress={handleRegister} />
        </View>
      ) : (
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Button text="Сподели" outline={true} onPress={() => shareImage()} />
          <Button text="Отпиши се" onPress={handleUnregister} outline={true} />
        </View>
      )}
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
