import React, { useCallback, useContext, useEffect, useState } from "react"
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native"
import axios from "axios"
import Colors from "@/data/Colors"
import Button from "@/components/Shared/Button"
import { AuthContext, isAdmin } from "@/context/AuthContext"
import Ionicons from "@expo/vector-icons/Ionicons"
import Entypo from "@expo/vector-icons/Entypo"
import { useRouter } from "expo-router"

type EventDetailsPageProps = {
  eventId?: string
}

type EventData = {
  id: number
  name: string
  bannerurl: string
  location: string
  link: string | null
  event_date: string
  event_time: string
  createdby: string
  username: string
  details?: string | null
  isRegistered?: boolean
  isInterested?: boolean
  registeredCount?: number
  interestedCount?: number
}

export default function EventDetailsPage({ eventId }: EventDetailsPageProps) {
  const { user } = useContext(AuthContext)
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [interestedLoading, setInterestedLoading] = useState(false)
  const router = useRouter()

  const loadEvent = useCallback(async () => {
    if (!eventId) return
    setLoading(true)
    try {
      const url =
        `${process.env.EXPO_PUBLIC_HOST_URL}/events?id=${encodeURIComponent(
          eventId
        )}` + (user?.email ? `&email=${encodeURIComponent(user.email)}` : "")
      const { data } = await axios.get(url)
      // API (GET /events?id=...) връща единичен обект
      setEvent(data)
    } catch (error) {
      console.error("Error fetching event details:", error)
      Alert.alert("Грешка", "Неуспешно зареждане на събитие.")
    } finally {
      setLoading(false)
    }
  }, [eventId, user?.email])

  useEffect(() => {
    loadEvent()
  }, [loadEvent])

  const toggleRegister = async () => {
    if (!event) return
    if (!user?.email) {
      Alert.alert("Вход", "Трябва да сте влезли.")
      return
    }
    setRegistering(true)
    try {
      if (!event.isRegistered) {
        await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/event-register`, {
          eventId: event.id,
          userEmail: user.email,
        })
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                isRegistered: true,
                registeredCount: (prev.registeredCount || 0) + 1,
              }
            : prev
        )
        Alert.alert("Успех", "Регистрирахте се.")
      } else {
        await axios.delete(
          `${process.env.EXPO_PUBLIC_HOST_URL}/event-register`,
          {
            data: { eventId: event.id, userEmail: user.email },
          }
        )
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                isRegistered: false,
                registeredCount: Math.max(0, (prev.registeredCount || 1) - 1),
              }
            : prev
        )
        Alert.alert("Готово", "Отписахте се.")
      }
    } catch (e) {
      console.error("Registration toggle error:", e)
      Alert.alert("Грешка", "Операцията не беше успешна.")
    } finally {
      setRegistering(false)
    }
  }

  const toggleInterest = async () => {
    if (!event) return
    if (!user?.email) {
      Alert.alert("Вход", "Трябва да сте влезли.")
      return
    }
    setInterestedLoading(true)
    try {
      if (!event.isInterested) {
        await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/event-interest`, {
          eventId: event.id,
          userEmail: user.email,
        })
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                isInterested: true,
                interestedCount: (prev.interestedCount || 0) + 1,
              }
            : prev
        )
      } else {
        await axios.delete(
          `${process.env.EXPO_PUBLIC_HOST_URL}/event-interest`,
          {
            data: { eventId: event.id, userEmail: user.email },
          }
        )
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                isInterested: false,
                interestedCount: Math.max(0, (prev.interestedCount || 1) - 1),
              }
            : prev
        )
      }
    } catch (e) {
      console.error("Interest toggle error:", e)
      Alert.alert("Грешка", "Операцията не беше успешна.")
    } finally {
      setInterestedLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.PRIMARY} />
      </View>
    )
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.GRAY }}>Събитието не е намерено.</Text>
        <Button text="Назад" onPress={() => router.back()} outline />
      </View>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      style={{ backgroundColor: Colors.WHITE }}
    >
      <Image source={{ uri: event.bannerurl }} style={styles.banner} />

      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.createdBy}>Създадено от: {event.username}</Text>

      <View style={styles.row}>
        <Entypo name="location" size={22} color={Colors.GRAY} />
        <Text style={styles.meta}>{event.location}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="calendar-number" size={22} color={Colors.GRAY} />
        <Text style={styles.meta}>
          {event.event_date} от {event.event_time}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="people" size={22} color={Colors.PRIMARY} />
        <Text style={styles.countPrimary}>
          {event.registeredCount ?? 0}{" "}
          {(event.registeredCount ?? 0) === 1 ? "регистриран" : "регистрирани"}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="heart" size={22} color="#e74c3c" />
        <Text style={styles.countInterested}>
          {event.interestedCount ?? 0}{" "}
          {(event.interestedCount ?? 0) === 1
            ? "заинтересован"
            : "заинтересовани"}
        </Text>
      </View>

      {event.details ? (
        <View style={{ marginTop: 15 }}>
          <Text style={styles.sectionTitle}>Детайли</Text>
          <Text style={styles.details}>{event.details}</Text>
        </View>
      ) : null}

      {event.link ? (
        <TouchableOpacity
          style={{ marginTop: 10 }}
          onPress={() => {
            Alert.alert("Линк", event.link || "")
          }}
        >
          <Text style={styles.linkText}>Виж допълнителен линк</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.actions}>
        <Button
          text={event.isRegistered ? "Отпиши се" : "Регистрирай се"}
          onPress={toggleRegister}
          loading={registering}
          outline={!!event.isRegistered}
          fullWidth
        />
        <TouchableOpacity
          onPress={toggleInterest}
          style={[
            styles.interestBtn,
            event.isInterested && {
              backgroundColor: "#ffe6e6",
              borderColor: "#e74c3c",
            },
          ]}
          disabled={interestedLoading}
        >
          <Ionicons
            name={event.isInterested ? "heart" : "heart-outline"}
            size={20}
            color={event.isInterested ? "#e74c3c" : Colors.PRIMARY}
          />
          <Text
            style={[
              styles.interestText,
              { color: event.isInterested ? "#e74c3c" : Colors.PRIMARY },
            ]}
          >
            {event.isInterested ? "Имам интерес" : "Интерес"}
          </Text>
        </TouchableOpacity>
      </View>

      {(isAdmin(user?.role) || user?.email === event.createdby) && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Админ опции</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Button
              text="Редактирай"
              outline
              onPress={() =>
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
                    details: event.details ?? "",
                  },
                })
              }
            />
          </View>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.WHITE,
    padding: 20,
  },
  banner: {
    width: "100%",
    aspectRatio: 1.6,
    borderRadius: 12,
    marginBottom: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 6,
    color: Colors.BLACK,
  },
  createdBy: {
    color: Colors.GRAY,
    fontSize: 15,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  meta: {
    fontSize: 15,
    color: Colors.GRAY,
  },
  countPrimary: {
    color: Colors.PRIMARY,
    fontSize: 15,
    fontWeight: "600",
  },
  countInterested: {
    color: "#e74c3c",
    fontSize: 15,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 4,
  },
  details: {
    fontSize: 15,
    lineHeight: 20,
    color: Colors.BLACK,
  },
  linkText: {
    color: Colors.PRIMARY,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 25,
    alignItems: "center",
  },
  interestBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  interestText: {
    fontSize: 15,
    fontWeight: "600",
  },
})
