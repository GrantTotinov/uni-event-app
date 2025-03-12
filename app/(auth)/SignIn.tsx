import { View, Text, Image, Pressable, ToastAndroid } from "react-native"
import React, { useContext, useState } from "react"
import TextInputField from "@/components/Shared/TextInputField"
import Button from "@/components/Shared/Button"
import Colors from "@/data/Colors"
import { useRouter } from "expo-router"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/configs/FirebaseConfig"
import axios from "axios"
import { AuthContext } from "@/context/AuthContext"

export default function SignIn() {
  const [email, setEmail] = useState<string | undefined>("")
  const [password, setPassword] = useState<string | undefined>("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { user, setUser } = useContext(AuthContext)
  const onSignInBtnClick = () => {
    if (!email || !password) {
      ToastAndroid.show("Моля попълнете всички полета", ToastAndroid.BOTTOM)
      return
    }
    setLoading(true)
    signInWithEmailAndPassword(auth, email, password)
      .then(async (resp) => {
        if (resp.user) {
          console.log(resp.user?.email)
          // Api call to feth users data
          const result = await axios.get(
            process.env.EXPO_PUBLIC_HOST_URL + "/user?email=" + resp.user?.email
          )
          console.log(result.data)
          setUser(result?.data)
          // Save to context to share across the app
        }
        setLoading(false)
      })
      .catch((e) => {
        setLoading(false)
        ToastAndroid.show("Грешен имейл или парола", ToastAndroid.BOTTOM)
      })
  }
  return (
    <View
      style={{
        padding: 20,
        paddingTop: 50,
      }}
    >
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

        <Text
          style={{
            fontSize: 25,
            fontWeight: "bold",
          }}
        >
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
        onPress={() => onSignInBtnClick()}
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
