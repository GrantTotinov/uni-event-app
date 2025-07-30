import { auth } from "@/configs/FirebaseConfig"
import { AuthContext } from "@/context/AuthContext"
import axios from "axios"
import { Redirect, useRouter } from "expo-router"
import { onAuthStateChanged } from "firebase/auth"
import { useContext } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import moment from "moment-timezone"

export default function Index() {
  const { user, setUser } = useContext(AuthContext)
  const router = useRouter()
  onAuthStateChanged(auth, async (userData) => {
    console.log("Auth state changed:", userData)
    console.log("Using API URL:", process.env.EXPO_PUBLIC_HOST_URL)
    try {
      if (userData && userData.email) {
        console.log("Fetching user data for:", userData.email)
        const result = await axios.get(
          process.env.EXPO_PUBLIC_HOST_URL + "/user?email=" + userData.email
        )
        console.log("User data fetched:", result.data)
        if (result.data && result.data.name) {
          setUser(result.data)
          router.replace("/(tabs)/Home")
        } else {
          console.log("No user data found, redirecting to landing.")
          router.replace("/landing")
        }
      } else {
        console.log("No user logged in, redirecting to landing.")
        router.replace("/landing")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      router.replace("/landing")
    }
  })
  //moment.tz.setDefault("Europe/Sofia")
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator />
    </View>
  )
}
