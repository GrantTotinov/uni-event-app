import { AuthContext } from "@/context/AuthContext"
import { Stack } from "expo-router"
import { useState } from "react"

interface USER {
  id: number
  name: string
  email: string
  image: string
}
export default function RootLayout() {
  const [user, setUser] = useState<USER | undefined>(undefined)
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <Stack>
        <Stack.Screen
          name="landing"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)/SignUp"
          options={{
            headerTransparent: true,
            headerTitle: "",
          }}
        />

        <Stack.Screen
          name="(auth)/SignIn"
          options={{
            headerTransparent: true,
            headerTitle: "",
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="add-post/index"
          options={{
            headerTitle: "Добавете нова публикация",
          }}
        />
        <Stack.Screen
          name="explore-clubs/index"
          options={{
            headerTitle: "Открии Клубове / Групи",
          }}
        />
      </Stack>
    </AuthContext.Provider>
  )
}
