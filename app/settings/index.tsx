import React, { useState, useContext } from "react"
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native"
import { AuthContext } from "@/context/AuthContext"
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

  const updatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Грешка", "Моля, попълнете всички полета.")
      return
    }
    try {
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_HOST_URL}/user/password`,
        {
          email: user?.email,
          currentPassword,
          newPassword,
        }
      )
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
          onPress={updatePassword}
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
