import React, { useContext, useState } from 'react'
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import {
  Surface,
  Text,
  TextInput,
  Button,
  IconButton,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth'
import { auth } from '@/configs/FirebaseConfig'
import { AuthContext } from '@/context/AuthContext'
import { ThemePreference, useAppTheme } from '@/context/ThemeContext'

const AUTH_ERRORS: Record<string, string> = {
  'auth/wrong-password': 'Текущата парола е грешна.',
  'auth/invalid-credential': 'Текущата парола е грешна.',
  'auth/weak-password': 'Новата парола е твърде слаба (мин. 6 символа).',
  'auth/too-many-requests': 'Твърде много опити. Опитайте по-късно.',
  'auth/requires-recent-login': 'Моля, влезте отново и опитайте пак.',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme()
  return (
    <Surface style={[styles.section, { backgroundColor: theme.colors.surface }]} elevation={1}>
      <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        {title}
      </Text>
      {children}
    </Surface>
  )
}

export default function Settings() {
  const { user, setUser } = useContext(AuthContext)
  const { preference, setPreference } = useAppTheme()
  const theme = useTheme()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [name, setName] = useState(user?.name ?? '')
  const [contactEmail, setContactEmail] = useState(user?.contact_email ?? '')
  const [contactPhone, setContactPhone] = useState(user?.contact_phone ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const updateProfile = async () => {
    if (!user?.email) return
    if (!name.trim()) {
      Alert.alert('Грешка', 'Името не може да е празно.')
      return
    }
    setSavingProfile(true)
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_HOST_URL}/user`, {
        email: user.email,
        name: name.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
      })
      setUser({
        ...user,
        name: name.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
      })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      Alert.alert('Готово', 'Профилът е обновен.')
    } catch (error) {
      console.error('Грешка при обновяване на профила:', error)
      Alert.alert('Грешка', 'Неуспешно обновяване на профила.')
    } finally {
      setSavingProfile(false)
    }
  }

  // Passwords live in Firebase Auth, not in our DB
  const changePassword = async () => {
    const fbUser = auth.currentUser
    if (!fbUser?.email) {
      Alert.alert('Грешка', 'Моля, влезте отново.')
      return
    }
    if (newPassword.length < 6) {
      Alert.alert('Грешка', 'Новата парола трябва да е поне 6 символа.')
      return
    }
    setSavingPassword(true)
    try {
      await reauthenticateWithCredential(
        fbUser,
        EmailAuthProvider.credential(fbUser.email, currentPassword)
      )
      await updatePassword(fbUser, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      Alert.alert('Готово', 'Паролата е сменена успешно.')
    } catch (error: any) {
      Alert.alert('Грешка', AUTH_ERRORS[error?.code] ?? 'Неуспешна смяна на паролата.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Настройки
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Section title="Външен вид">
          <SegmentedButtons
            value={preference}
            onValueChange={(v) => setPreference(v as ThemePreference)}
            buttons={[
              { value: 'system', label: 'Система', icon: 'cellphone' },
              { value: 'light', label: 'Светла', icon: 'white-balance-sunny' },
              { value: 'dark', label: 'Тъмна', icon: 'weather-night' },
            ]}
          />
        </Section>

        <Section title="Профил">
          <TextInput
            mode="outlined"
            label="Име"
            value={name}
            onChangeText={setName}
            left={<TextInput.Icon icon="account" />}
          />
          <TextInput
            mode="outlined"
            label="Имейл за контакт"
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email-outline" />}
          />
          <TextInput
            mode="outlined"
            label="Телефон за контакт"
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
            left={<TextInput.Icon icon="phone" />}
          />
          <Button
            mode="contained"
            icon="content-save"
            onPress={updateProfile}
            loading={savingProfile}
            disabled={savingProfile}
            style={styles.button}
          >
            Запази промените
          </Button>
        </Section>

        <Section title="Сигурност">
          <TextInput
            mode="outlined"
            label="Текуща парола"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showPasswords}
            autoComplete="current-password"
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPasswords ? 'eye-off' : 'eye'}
                onPress={() => setShowPasswords((s) => !s)}
              />
            }
          />
          <TextInput
            mode="outlined"
            label="Нова парола"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPasswords}
            autoComplete="new-password"
            left={<TextInput.Icon icon="lock-reset" />}
          />
          <Button
            mode="contained-tonal"
            icon="shield-check"
            onPress={changePassword}
            loading={savingPassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            style={styles.button}
          >
            Смени паролата
          </Button>
        </Section>

        <Text style={[styles.footer, { color: theme.colors.onSurfaceVariant }]}>
          AcademiX · {user?.email}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  headerTitle: { fontWeight: '700' },
  container: { padding: 16, paddingBottom: 48, gap: 16 },
  section: { borderRadius: 20, padding: 16, gap: 12 },
  sectionTitle: { fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  button: { marginTop: 4, borderRadius: 14 },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 8 },
})
