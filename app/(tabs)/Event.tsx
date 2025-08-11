import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native"
import React, { useContext, useEffect, useState } from "react"
import Button from "@/components/Shared/Button"
import { useRouter } from "expo-router"
import axios from "axios"
import EventCard from "@/components/Events/EventCard"
import Colors from "@/data/Colors"
import { AuthContext } from "@/context/AuthContext"

export default function Event() {
  const router = useRouter()
  const [eventList, setEventList] = useState()
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState(0)
  const { user } = useContext(AuthContext)
  useEffect(() => {
    if (selectedTab === 1) {
      GetUserEvents() // If in "Записани" tab, fetch registered events
    } else {
      GetAllEvents() // If in "Предстоящи" tab, fetch all events
    }
  }, [selectedTab])

  const GetAllEvents = async () => {
    setLoading(true)
    try {
      const url = user?.email
        ? `${
            process.env.EXPO_PUBLIC_HOST_URL
          }/events?email=${encodeURIComponent(user.email)}`
        : `${process.env.EXPO_PUBLIC_HOST_URL}/events`
      const { data } = await axios.get(url)
      setEventList(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const GetUserEvents = async () => {
    setLoading(true)
    try {
      const result = await axios.get(
        process.env.EXPO_PUBLIC_HOST_URL +
          "/event-register?email=" +
          user?.email
      )
      // Добавете isRegistered: true за всички върнати събития
      const eventsWithRegistrationStatus = result.data.map((event: any) => ({
        ...event,
        isRegistered: true,
      }))
      setEventList(eventsWithRegistrationStatus)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  return (
    <View>
      <View
        style={{
          paddingHorizontal: 20,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "bold",
          }}
        >
          Събития
        </Text>
        <Button text="   +   " onPress={() => router.push("/add-event")} />
      </View>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          gap: 10,
          backgroundColor: Colors.WHITE,
          paddingHorizontal: 20,
          padding: 10,
        }}
      >
        <Pressable
          onPress={() => {
            setSelectedTab(0)
            GetAllEvents()
          }}
        >
          <Text
            style={[
              styles.tabtext,
              {
                backgroundColor:
                  selectedTab == 0 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab == 0 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Предстоящи
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setSelectedTab(1)
            GetUserEvents()
          }}
        >
          <Text
            style={[
              styles.tabtext,
              {
                backgroundColor:
                  selectedTab == 1 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab == 1 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Записани
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={eventList}
        contentContainerStyle={{ paddingBottom: 120 }}
        onRefresh={() => {
          if (selectedTab == 1) {
            GetUserEvents()
          } else {
            GetAllEvents()
          }
        }}
        refreshing={loading}
        renderItem={({ item, index }) => (
          <EventCard
            {...item}
            key={index}
            onUnregister={() => {
              if (selectedTab == 1) {
                GetUserEvents()
              } else {
                GetAllEvents()
              }
            }}
            onDelete={() => {
              if (selectedTab == 1) {
                GetUserEvents()
              } else {
                GetAllEvents()
              }
            }}
          />
        )}
      />
    </View>
  )
}
const styles = StyleSheet.create({
  tabtext: {
    padding: 4,
    fontSize: 20,
    paddingHorizontal: 10,
    borderRadius: 99,
  },
})
