import React, { useContext, useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native"
import axios from "axios"
import Colors from "@/data/Colors"
import Button from "@/components/Shared/Button"
import EventCard from "@/components/Events/EventCard"
import { AuthContext } from "@/context/AuthContext"

interface EventItem {
  id: number
  name: string
  bannerurl: string
  location: string
  link: string | null
  details?: string | null
  event_date: string
  event_time: string
  createdby: string
  username: string
  isRegistered?: boolean
  isInterested?: boolean
  registeredCount?: number
  interestedCount?: number
}

export default function Event() {
  const { user } = useContext(AuthContext)
  const [eventList, setEventList] = useState<EventItem[] | undefined>()
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<number>(0)

  // Унифицирано извличане на събития (с флагове) – винаги ползваме /events
  const fetchEvents = useCallback(
    async (filterRegistered: boolean) => {
      setLoading(true)
      try {
        const baseUrl = `${process.env.EXPO_PUBLIC_HOST_URL}/events`
        const url = user?.email
          ? `${baseUrl}?email=${encodeURIComponent(user.email)}`
          : baseUrl
        const { data } = await axios.get(url)
        let list: EventItem[] = data || []
        if (filterRegistered) {
          list = list.filter((e) => e.isRegistered)
        }
        setEventList(list)
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setLoading(false)
      }
    },
    [user?.email]
  )

  const GetAllEvents = useCallback(() => fetchEvents(false), [fetchEvents])
  const GetUserEvents = useCallback(() => fetchEvents(true), [fetchEvents])

  // Превключване между табове
  useEffect(() => {
    if (selectedTab === 1) {
      GetUserEvents()
    } else {
      GetAllEvents()
    }
  }, [selectedTab, GetAllEvents, GetUserEvents])

  // Презареждане след промяна на потребителя (логин/лог-аут)
  useEffect(() => {
    if (selectedTab === 1) {
      GetUserEvents()
    } else {
      GetAllEvents()
    }
  }, [user, GetAllEvents, GetUserEvents, selectedTab])

  const onRefresh = () => {
    if (selectedTab === 1) {
      GetUserEvents()
    } else {
      GetAllEvents()
    }
  }

  const renderItem = ({ item, index }: { item: EventItem; index: number }) => (
    <EventCard
      key={index}
      {...item}
      onUnregister={() => {
        // След отписване – презареди текущия списък (филтърът остава)
        if (selectedTab === 1) {
          GetUserEvents()
        } else {
          GetAllEvents()
        }
      }}
      onDelete={() => {
        // След изтриване – презареди
        if (selectedTab === 1) {
          GetUserEvents()
        } else {
          GetAllEvents()
        }
      }}
    />
  )

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
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
        <Button
          text="   +   "
          onPress={() =>
            (window as any).expoRouter?.push
              ? (window as any).expoRouter.push("/add-event")
              : null
          }
        />
      </View>

      {/* Tabs */}
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
          }}
        >
          <Text
            style={[
              styles.tabtext,
              {
                backgroundColor:
                  selectedTab === 0 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab === 0 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Предстоящи
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setSelectedTab(1)
          }}
        >
          <Text
            style={[
              styles.tabtext,
              {
                backgroundColor:
                  selectedTab === 1 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab === 1 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Записани
          </Text>
        </Pressable>
      </View>

      {/* List */}
      {loading && !eventList && (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator color={Colors.PRIMARY} />
        </View>
      )}

      <FlatList
        data={eventList}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: 30 }}>
              <Text style={{ textAlign: "center", color: Colors.GRAY }}>
                {selectedTab === 0
                  ? "Няма предстоящи събития."
                  : "Нямате записани събития."}
              </Text>
            </View>
          ) : null
        }
        renderItem={renderItem}
      />
    </View>
  )
}

const styles = {
  tabtext: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 25,
    overflow: "hidden",
    fontWeight: "600",
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    textAlign: "center" as const,
  },
}
