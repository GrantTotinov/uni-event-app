import { View, Text, FlatList } from "react-native"
import React, { useEffect, useState } from "react"
import Button from "@/components/Shared/Button"
import { useRouter } from "expo-router"
import axios from "axios"
import EventCard from "@/components/Events/EventCard"

export default function Event() {
  const router = useRouter()
  const [eventList, setEventList] = useState()
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    GetAllEvents()
  }, [])
  const GetAllEvents = async () => {
    setLoading(true)
    const result = await axios.get(process.env.EXPO_PUBLIC_HOST_URL + "/events")
    console.log(result.data)
    setEventList(result.data)
    setLoading(false)
  }
  return (
    <View>
      <View
        style={{
          padding: 20,
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
      <FlatList
        data={eventList}
        onRefresh={GetAllEvents}
        refreshing={loading}
        renderItem={({ item, index }) => <EventCard {...item} key={index} />}
      />
    </View>
  )
}
