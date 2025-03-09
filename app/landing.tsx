import { View, Text, Image, Pressable } from "react-native"
import React from "react"
import Colors from "@/data/Colors"
import Button from "@/components/Shared/Button"
import { useRouter } from "expo-router"

export default function LandingScreen() {
  const router = useRouter()
  return (
    <View>
      <Image
        source={require("./../assets/images/login.jpg")}
        style={{
          width: "100%",
          height: 400,
        }}
      />

      <View
        style={{
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          Добре дошли в AcademiX
        </Text>

        <Text
          style={{
            fontSize: 17,
            textAlign: "center",
            marginTop: 10,
            color: Colors.GRAY,
          }}
        >
          Всички новини и събития на едно място. Присъединете се към нас и се
          регистрирайте
        </Text>

        <Button
          text="Започни сега"
          onPress={() => router.push("/(auth)/SignUp")}
        />

        <Pressable onPress={() => router.push("/(auth)/SignIn")}>
          <Text
            style={{
              fontSize: 16,
              textAlign: "center",
              marginTop: 7,
              color: Colors.GRAY,
            }}
          >
            Вече имате акаунт? Влезте тук!
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
