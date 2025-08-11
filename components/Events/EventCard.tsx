import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  Modal,
  TouchableOpacity,
} from "react-native"
import React, { useContext, useEffect, useState } from "react"
import Colors from "@/data/Colors"
import Entypo from "@expo/vector-icons/Entypo"
import Ionicons from "@expo/vector-icons/Ionicons"
import Button from "../Shared/Button"
import axios from "axios"
import { AuthContext, isAdmin } from "@/context/AuthContext"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"

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
  isInterested?: boolean
  registeredCount: number
  interestedCount?: number
  onUnregister?: () => void
  onDelete?: () => void
}

export default function EventCard({ onUnregister, onDelete, ...event }: EVENT) {
  const { user } = useContext(AuthContext)
  const [isRegistered, setIsRegistered] = useState(event.isRegistered)
  const [isInterested, setIsInterested] = useState(event.isInterested || false)
  const [registeredCount, setRegisteredCount] = useState(
    event.registeredCount || 0
  )
  const [interestedCount, setInterestedCount] = useState(
    event.interestedCount || 0
  )
  const canManage = isAdmin(user?.role) || user?.email === event.createdby
  const [menuVisible, setMenuVisible] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsRegistered(event.isRegistered)
    setIsInterested(event.isInterested || false)
    setRegisteredCount(event.registeredCount || 0)
    setInterestedCount(event.interestedCount || 0)
  }, [
    event.isRegistered,
    event.isInterested,
    event.registeredCount,
    event.interestedCount,
  ])

  const handleRegister = () => {
    Alert.alert("Регистрация за събитие!", "Потвърди регистрацията!", [
      {
        text: "Потвърдете",
        onPress: async () => {
          try {
            await axios.post(
              `${process.env.EXPO_PUBLIC_HOST_URL}/event-register`,
              { eventId: event.id, userEmail: user?.email }
            )
            setIsRegistered(true)
            setRegisteredCount((prev) => prev + 1)
            Alert.alert("Чудесно!", "Успешно се регистрирахте за събитието!")
          } catch (error) {
            console.error(error)
            Alert.alert("Грешка!", "Неуспешна регистрация.")
          }
        },
      },
      { text: "Отказ", style: "cancel" },
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
              setRegisteredCount((prev) => Math.max(0, prev - 1))
              Alert.alert("Готово!", "Вече не сте записани за събитието.")
              if (onUnregister) onUnregister()
            } catch (error) {
              console.error(error)
              Alert.alert("Грешка!", "Неуспешно отписване.")
            }
          },
        },
        { text: "Отказ", style: "cancel" },
      ]
    )
  }

  const handleInterest = async () => {
    try {
      if (!isInterested) {
        await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/event-interest`, {
          eventId: event.id,
          userEmail: user?.email,
        })
        setIsInterested(true)
        setInterestedCount((prev) => prev + 1)
        Alert.alert("Чудесно!", "Проявихте интерес към събитието!")
      } else {
        await axios.delete(
          `${process.env.EXPO_PUBLIC_HOST_URL}/event-interest`,
          {
            data: { eventId: event.id, userEmail: user?.email },
          }
        )
        setIsInterested(false)
        setInterestedCount((prev) => Math.max(0, prev - 1))
        Alert.alert("Готово!", "Вече не проявявате интерес към събитието.")
      }
    } catch (error) {
      console.error(error)
      Alert.alert("Грешка!", "Неуспешна операция.")
    }
  }

  const shareImage = async () => {
    try {
      const fileUri = `${FileSystem.documentDirectory}shared-image.jpg`
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

  const deleteEvent = () => {
    Alert.alert(
      "Изтриване на събитие",
      "Сигурни ли сте, че искате да изтриете това събитие?",
      [
        { text: "Отказ", style: "cancel" },
        {
          text: "Изтрий",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${process.env.EXPO_PUBLIC_HOST_URL}/events`,
                {
                  data: { eventId: event.id, userEmail: user?.email },
                }
              )
              console.log("Събитието е изтрито:", response.data)
              Alert.alert("Успешно", "Събитието е изтрито.")
              if (onDelete) onDelete()
            } catch (error) {
              console.error("Грешка при изтриване на събитието", error)
              Alert.alert("Грешка", "Неуспешно изтриване на събитието.")
            }
          },
        },
      ]
    )
  }

  return (
    <View
      style={{
        padding: 20,
        backgroundColor: Colors.WHITE,
        marginBottom: 3,
        position: "relative",
      }}
    >
      {canManage && (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            padding: 6,
            zIndex: 10,
          }}
        >
          <MaterialIcons name="more-vert" size={22} color={Colors.GRAY} />
        </TouchableOpacity>
      )}

      <Image
        source={{ uri: event.bannerurl }}
        style={{ height: 250, borderRadius: 15, width: "100%" }}
      />

      <Text style={{ fontSize: 23, fontWeight: "bold", marginTop: 7 }}>
        {event.name}
      </Text>
      <Text style={{ color: Colors.GRAY, fontSize: 16 }}>
        Създадено от: {event.username}
      </Text>

      <View style={styles.subContainer}>
        <Entypo name="location" size={24} color={Colors.GRAY} />
        <Text style={{ color: Colors.GRAY, fontSize: 16 }}>
          {event.location}
        </Text>
      </View>

      <View style={styles.subContainer}>
        <Ionicons name="calendar-number" size={24} color={Colors.GRAY} />
        <Text style={{ color: Colors.GRAY, fontSize: 16 }}>
          {event.event_date} от {event.event_time}
        </Text>
      </View>

      <View style={styles.subContainer}>
        <Ionicons name="people" size={24} color={Colors.PRIMARY} />
        <Text
          style={{ color: Colors.PRIMARY, fontSize: 16, fontWeight: "600" }}
        >
          {registeredCount}{" "}
          {registeredCount === 1 ? "регистриран" : "регистрирани"}
        </Text>
      </View>

      <View style={styles.subContainer}>
        <Ionicons name="heart" size={24} color="#e74c3c" />
        <Text style={{ color: "#e74c3c", fontSize: 16, fontWeight: "600" }}>
          {interestedCount}{" "}
          {interestedCount === 1 ? "заинтересован" : "заинтересовани"}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button text="Сподели" outline={true} onPress={shareImage} />

        <TouchableOpacity
          onPress={handleInterest}
          style={styles.interestButton}
        >
          <Ionicons
            name={isInterested ? "heart" : "heart-outline"}
            size={20}
            color={isInterested ? "#e74c3c" : Colors.PRIMARY}
          />
          <Text
            style={[
              styles.interestButtonText,
              { color: isInterested ? "#e74c3c" : Colors.PRIMARY },
            ]}
          >
            {isInterested ? "Имам интерес" : "Интерес"}
          </Text>
        </TouchableOpacity>

        {!isRegistered ? (
          <Button text="Регистрирай се" onPress={handleRegister} />
        ) : (
          <Button text="Отпиши се" onPress={handleUnregister} outline={true} />
        )}
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View
            style={{
              backgroundColor: Colors.WHITE,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false)
                router.push({
                  pathname: "/add-event",
                  params: {
                    edit: "1",
                    id: String(event.id),
                    name: event.name,
                    bannerurl: event.bannerurl,
                    location: event.location,
                    link: event.link ?? "",
                    event_date: event.event_date,
                    event_time: event.event_time,
                  },
                })
              }}
              style={{ paddingVertical: 16 }}
            >
              <Text
                style={{
                  color: Colors.PRIMARY,
                  fontWeight: "bold",
                  fontSize: 18,
                  textAlign: "center",
                }}
              >
                Редактирай
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false)
                deleteEvent()
              }}
              style={{ paddingVertical: 16 }}
            >
              <Text
                style={{
                  color: "red",
                  fontWeight: "bold",
                  fontSize: 18,
                  textAlign: "center",
                }}
              >
                Изтрий
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  subContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
    gap: 10,
  },
  interestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    gap: 6,
  },
  interestButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
})
