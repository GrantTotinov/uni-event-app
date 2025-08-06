import { auth } from "@/configs/FirebaseConfig"
import { AuthContext } from "@/context/AuthContext"
import axios from "axios"
import { Redirect, useRouter, Href } from "expo-router"
import { onAuthStateChanged } from "firebase/auth"
import { useContext, useEffect, useState } from "react"
import { ActivityIndicator, View } from "react-native"

export default function Index() {
  const { user, setUser } = useContext(AuthContext)
  const [isLoading, setIsLoading] = useState(true)
  const [redirectTo, setRedirectTo] = useState<Href | null>(null)
  useEffect(() => {
    // Създаваме променлива за следене дали компонентът е монтиран
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (userData) => {
      console.log("Auth state changed:", userData)
      console.log("Using API URL:", process.env.EXPO_PUBLIC_HOST_URL)

      try {
        if (userData && userData.email) {
          console.log("Fetching user data for:", userData.email)

          const result = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/user?email=${userData.email}`
          )

          console.log("User data fetched:", result.data)

          // Проверяваме дали компонентът все още е монтиран преди да обновим state
          if (isMounted) {
            if (result.data && result.data.name) {
              setUser(result.data)
              setRedirectTo("/(tabs)/Home")
            } else {
              console.log("No user data found, redirecting to landing.")
              setRedirectTo("/landing")
            }
          }
        } else {
          if (isMounted) {
            console.log("No user logged in, redirecting to landing.")
            setRedirectTo("/landing")
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        if (isMounted) {
          setRedirectTo("/landing")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })

    // Cleanup функция - изпълнява се при размонтиране на компонента
    return () => {
      isMounted = false
      unsubscribe()
    }
  }, []) // празен масив от зависимости означава, че useEffect се изпълнява само веднъж при монтирането

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator />
    </View>
  )
}
