import React, { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native'
import axios from 'axios'
import Colors from '@/data/Colors'
import { AuthContext } from '@/context/AuthContext'

export default function Settings() {
  const { user, setUser } = useContext(AuthContext)
  const [newName, setNewName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setNewName(user.name || '')
      setContactEmail(user.contact_email || '')
      setContactPhone(user.contact_phone || '')
    }
  }, [user])

  const updateProfile = async () => {
    if (!user?.email) {
      Alert.alert('Грешка', 'Потребителят не е намерен.')
      return
    }
    setLoading(true)
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_HOST_URL}/user`, {
        email: user.email,
        name: newName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
      })
      setUser({
        ...user,
        name: newName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
      })
      Alert.alert('Успех', 'Профилът е обновен успешно.')
    } catch (error) {
      console.error('Грешка при обновяване на профила:', error)
      Alert.alert('Грешка', 'Неуспешно обновяване на профила.')
    }
    setLoading(false)
  }

  const updatePasswordHandler = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Грешка', 'Моля, попълнете всички полета.')
      return
    }
    if (!user?.email) {
      Alert.alert('Грешка', 'Потребителят не е намерен.')
      return
    }
    setLoading(true)
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_HOST_URL}/user`, {
        email: user.email,
        currentPassword,
        newPassword,
      })
      Alert.alert('Успех', 'Паролата е успешно променена.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (error) {
      console.error('Грешка при промяна на паролата:', error)
      Alert.alert('Грешка', 'Неуспешна промяна на паролата.')
    }
    setLoading(false)
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Настройки</Text>

      {/* Промяна на име */}
      <View style={styles.section}>
        <Text style={styles.label}>Име</Text>
        <TextInput
          style={styles.input}
          placeholder="Въведете ново име"
          value={newName}
          onChangeText={setNewName}
        />
      </View>

      {/* Промяна на контакт имейл */}
      <View style={styles.section}>
        <Text style={styles.label}>Контакт имейл</Text>
        <TextInput
          style={styles.input}
          placeholder="Въведете контакт имейл"
          value={contactEmail}
          onChangeText={setContactEmail}
        />
      </View>

      {/* Промяна на контакт телефон */}
      <View style={styles.section}>
        <Text style={styles.label}>Контакт телефон</Text>
        <TextInput
          style={styles.input}
          placeholder="Въведете контакт телефон"
          value={contactPhone}
          onChangeText={setContactPhone}
        />
      </View>

      <TouchableOpacity
        onPress={updateProfile}
        style={styles.saveButton}
        disabled={loading}
      >
        <Text style={styles.saveButtonText}>
          {loading ? 'Запазване...' : 'Запази промените'}
        </Text>
      </TouchableOpacity>

      {/* Смяна на парола */}
      <View style={styles.section}>
        <Text style={styles.label}>Смяна на парола</Text>
        <TextInput
          style={styles.input}
          placeholder="Текуща парола"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Нова парола"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity
          onPress={updatePasswordHandler}
          style={styles.saveButton}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Запазване...' : 'Запази паролата'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: Colors.WHITE,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
    color: Colors.PRIMARY,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: Colors.BLACK,
    backgroundColor: Colors.WHITE,
  },
  saveButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
})
