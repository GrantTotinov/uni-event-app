import { Stack } from "expo-router"

export default function RootLayout() {
  return (
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
    </Stack>
  )
}
