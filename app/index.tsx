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
    //console.log(userData?.email)
    if (userData && userData.email) {
      const result = await axios.get(
        process.env.EXPO_PUBLIC_HOST_URL + "/user?email=" + userData.email
      )
      // Ако данните от базата са празни или непълни, може би това е нов акаунт
      if (result.data && result.data.name) {
        setUser(result.data)
        router.replace("/(tabs)/Home")
      } else {
        router.replace("/landing")
      }
    } else {
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
