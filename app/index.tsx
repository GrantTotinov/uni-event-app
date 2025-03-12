import { auth } from "@/configs/FirebaseConfig"
import { AuthContext } from "@/context/AuthContext"
import axios from "axios"
import { Redirect } from "expo-router"
import { onAuthStateChanged } from "firebase/auth"
import { useContext } from "react"
import { Text, View } from "react-native"

export default function Index() {
  const { user, setUser } = useContext(AuthContext)
  onAuthStateChanged(auth, async (userData) => {
    //console.log(userData?.email)
    if (userData && userData?.email) {
      const result = await axios.get(
        process.env.EXPO_PUBLIC_HOST_URL + "/user?email=" + userData?.email
      )
      console.log(result.data)
      setUser(result?.data)
    }
  })
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Redirect href={"/landing"} />
    </View>
  )
}
