import { View, Text, Image, FlatList, TouchableOpacity } from "react-native"
import React, { useContext } from "react"
import { AuthContext } from "@/context/AuthContext"
import Colors from "@/data/Colors"
import Ionicons from "@expo/vector-icons/Ionicons"
import { useRouter } from "expo-router"
import { signOut } from "firebase/auth"
import { auth } from "@/configs/FirebaseConfig"

const profileOptions = [
  {
    name: "Добави публикация",
    path: "/add-post",
    icon: "add-circle-outline",
  },
  {
    name: "Моите събития",
    path: "/Event",
    icon: "calendar-outline",
  },
  {
    name: "Изход",
    path: "logout",
    icon: "log-out-outline",
  },
]

export default function Profile() {
  const { user, setUser } = useContext(AuthContext)
  const router = useRouter()
  const onPressOption = (item: any) => {
    if (item.path == "logout") {
      signOut(auth)
        .then(() => {
          setUser(null)
          router.replace("/landing")
          return
        })
        .catch((error) => {})
    } else {
      router.push(item.path)
    }
  }
  return (
    <View
      style={{
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 30,
          fontWeight: "bold",
        }}
      >
        Профил
      </Text>
      <View
        style={{
          display: "flex",
          alignItems: "center",
          marginTop: 30,
        }}
      >
        <Image
          source={{ uri: user?.image }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 99,
          }}
        />
        <Text
          style={{
            marginTop: 7,
            fontSize: 25,
            fontWeight: "bold",
          }}
        >
          {user?.name}
        </Text>
        <Text
          style={{
            color: Colors.GRAY,
            marginTop: 7,
            fontSize: 16,
          }}
        >
          {user?.email}
        </Text>
      </View>
      <FlatList
        style={{
          marginTop: 25,
        }}
        data={profileOptions}
        renderItem={({ item, index }: any) => (
          <TouchableOpacity
            onPress={() => onPressOption(item)}
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 8,
              padding: 10,
              margin: 6,
              borderWidth: 1,
              borderRadius: 8,
            }}
          >
            <Ionicons name={item.icon} size={34} color={Colors.PRIMARY} />
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}
