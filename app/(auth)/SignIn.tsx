import React, { useContext, useState } from "react"
import { View, Text, Image, Pressable, ToastAndroid } from "react-native"
import TextInputField from "@/components/Shared/TextInputField"
import Button from "@/components/Shared/Button"
import Colors from "@/data/Colors"
import { useRouter } from "expo-router"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/configs/FirebaseConfig"
import axios from "axios"
import { AuthContext } from "@/context/AuthContext"

export default function SignIn() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useContext(AuthContext)

  // Функция, която прави GET заявка с retry логика
  const fetchUserData = async (
    userEmail: string,
    retries = 3
  ): Promise<any> => {
    try {
      const result = await axios.get(
        process.env.EXPO_PUBLIC_HOST_URL + "/user?email=" + userEmail
      )
      if (result.data && Object.keys(result.data).length > 0) {
        return result.data
      } else {
        throw new Error("Няма данни")
      }
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return fetchUserData(userEmail, retries - 1)
      } else {
        throw error
      }
    }
  }

  const onSignInBtnClick = () => {
    if (!email || !password) {
      ToastAndroid.show("Моля попълнете всички полета", ToastAndroid.BOTTOM)
      return
    }
    setLoading(true)
    signInWithEmailAndPassword(auth, email, password)
      .then(async (resp) => {
        // Проверяваме дали email от Firebase не е null
        const userEmail = resp.user.email
        if (!userEmail) {
          setLoading(false)
          ToastAndroid.show(
            "Грешка: липсващ имейл от акаунта",
            ToastAndroid.BOTTOM
          )
          return
        }
        try {
          // Опитваме се да вземем данните на потребителя с retry логика
          const userData = await fetchUserData(userEmail)
          console.log("Данни на потребителя:", userData)
          setUser(userData)
          router.replace("/(tabs)/Home")
        } catch (error) {
          console.log("Грешка при извличането на потребителските данни:", error)
          ToastAndroid.show(
            "Профилът все още не е наличен. Опитайте пак след малко.",
            ToastAndroid.BOTTOM
          )
        }
        setLoading(false)
      })
      .catch((error) => {
        setLoading(false)
        ToastAndroid.show("Грешен имейл или парола", ToastAndroid.BOTTOM)
      })
  }

  return (
    <View style={{ padding: 20, paddingTop: 50 }}>
      <View
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Image
          source={require("./../../assets/images/logo.png")}
          style={{
            width: 300,
            height: 300,
            resizeMode: "contain",
          }}
        />
        <Text style={{ fontSize: 25, fontWeight: "bold" }}>
          Влезте в AcademiX
        </Text>
      </View>
      <TextInputField
        label="Студентски имейл"
        onChangeText={(v) => setEmail(v)}
      />
      <TextInputField
        label="Парола"
        password={true}
        onChangeText={(v) => setPassword(v)}
      />
      <Button
        text="Влезте в акаунта си"
        onPress={onSignInBtnClick}
        loading={loading}
      />
      <Pressable onPress={() => router.push("/(auth)/SignUp")}>
        <Text
          style={{
            fontSize: 16,
            textAlign: "center",
            marginTop: 7,
            color: Colors.GRAY,
          }}
        >
          Все още нямате регистрация? Регистрирайте се тук!
        </Text>
      </Pressable>
    </View>
  )
}
