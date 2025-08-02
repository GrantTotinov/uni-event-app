import React, { useState, useContext } from "react"
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native"
import { AuthContext } from "@/context/AuthContext"
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth"
import { auth } from "@/configs/FirebaseConfig"
import Colors from "@/data/Colors"
import axios from "axios"

export default function Settings() {
  const { user, setUser } = useContext(AuthContext)
  const [newName, setNewName] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  const updateName = async () => {
    if (!newName.trim()) {
      Alert.alert("Грешка", "Моля, въведете ново име.")
      return
    }
    try {
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_HOST_URL}/user`,
        {
          email: user?.email,
          name: newName,
        }
      )
      setUser({ ...user, name: newName })
      Alert.alert("Успех", "Името е успешно променено.")
    } catch (error) {
      console.error("Грешка при промяна на името:", error)
      Alert.alert("Грешка", "Неуспешна промяна на името.")
    }
  }

  const updatePasswordHandler = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Грешка", "Моля, попълнете всички полета.")
      return
    }

    if (!auth.currentUser) {
      Alert.alert("Грешка", "Не сте влезли в профила си.")
      return
    }

    try {
      // Реавтентикация на потребителя
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      )
      await reauthenticateWithCredential(auth.currentUser, credential)

      // Смяна на паролата
      await updatePassword(auth.currentUser, newPassword)
      Alert.alert("Успех", "Паролата е успешно променена.")
    } catch (error) {
      console.error("Грешка при промяна на паролата:", error)
      Alert.alert("Грешка", "Неуспешна промяна на паролата.")
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 25, fontWeight: "bold", marginBottom: 20 }}>
        Настройки
      </Text>

      {/* Секция за промяна на име */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 18 }}>Смяна на потребителско име</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: Colors.GRAY,
            borderRadius: 8,
            padding: 10,
            marginTop: 10,
          }}
          placeholder="Ново име"
          value={newName}
          onChangeText={setNewName}
        />
        <TouchableOpacity
          onPress={updateName}
          style={{
            backgroundColor: Colors.PRIMARY,
            padding: 10,
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>Запази</Text>
        </TouchableOpacity>
      </View>

      {/* Секция за промяна на парола */}
      <View>
        <Text style={{ fontSize: 18 }}>Смяна на парола</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: Colors.GRAY,
            borderRadius: 8,
            padding: 10,
            marginTop: 10,
          }}
          placeholder="Текуща парола"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: Colors.GRAY,
            borderRadius: 8,
            padding: 10,
            marginTop: 10,
          }}
          placeholder="Нова парола"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity
          onPress={updatePasswordHandler}
          style={{
            backgroundColor: Colors.PRIMARY,
            padding: 10,
            borderRadius: 8,
            marginTop: 10,
          }}
        >
          <Text style={{ color: "white", textAlign: "center" }}>Запази</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
