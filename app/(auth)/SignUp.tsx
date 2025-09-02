import React, { useContext, useState } from 'react'
import {
  View,
  Text,
  Image,
  Pressable,
  ToastAndroid,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native'
import TextInputField from '@/components/Shared/TextInputField'
import Button from '@/components/Shared/Button'
import Colors from '@/data/Colors'
import { useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/configs/FirebaseConfig'
import axios from 'axios'
import { AuthContext } from '@/context/AuthContext'

const { width } = Dimensions.get('window')

export default function SignUp() {
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useContext(AuthContext)

  // Create user in your database with retry logic
  const createUserInDatabase = async (
    userData: {
      name: string
      email: string
      uid: string
      role?: string
    },
    retries = 3
  ): Promise<any> => {
    try {
      const result = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST_URL}/user`,
        {
          name: userData.name,
          email: userData.email,
          uid: userData.uid,
          role: userData.role || 'user', // Default role
          image: '', // Optional default image
          contact_email: userData.email, // Use same email as contact
          contact_phone: '', // Empty initially
        }
      )

      if (result.data) {
        return result.data
      } else {
        throw new Error('Неуспешно създаване на профил')
      }
    } catch (error) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        return createUserInDatabase(userData, retries - 1)
      } else {
        throw error
      }
    }
  }

  const validateInputs = (): boolean => {
    if (!name.trim()) {
      ToastAndroid.show('Моля въведете име', ToastAndroid.BOTTOM)
      return false
    }

    if (!email.trim()) {
      ToastAndroid.show('Моля въведете имейл', ToastAndroid.BOTTOM)
      return false
    }

    if (!password) {
      ToastAndroid.show('Моля въведете парола', ToastAndroid.BOTTOM)
      return false
    }

    if (password !== confirmPassword) {
      ToastAndroid.show('Паролите не съвпадат', ToastAndroid.BOTTOM)
      return false
    }

    if (password.length < 6) {
      ToastAndroid.show(
        'Паролата трябва да е поне 6 символа',
        ToastAndroid.BOTTOM
      )
      return false
    }

    return true
  }

  const onSignUpBtnClick = async () => {
    if (!validateInputs()) {
      return
    }

    setLoading(true)

    try {
      // Create Firebase user
      const resp = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      if (!resp.user.uid) {
        throw new Error('Грешка при създаване на акаунт')
      }

      // Create user in your database
      const userData = {
        name: name.trim(),
        email: email.trim(),
        uid: resp.user.uid,
        role: 'student',
      }

      try {
        const dbUser = await createUserInDatabase(userData)
        setUser(dbUser)

        ToastAndroid.show('Акаунтът е създаден успешно!', ToastAndroid.BOTTOM)
        router.replace('/(tabs)/Home')
      } catch (dbError) {
        console.error('Database creation error:', dbError)
        ToastAndroid.show(
          'Акаунтът е създаден, но има проблем с профила. Опитайте да влезете отново.',
          ToastAndroid.LONG
        )
        // Redirect to sign in since Firebase account exists
        router.replace('/(auth)/SignIn')
      }
    } catch (firebaseError) {
      console.error('Firebase creation error:', firebaseError)

      // Handle specific Firebase errors
      const errorMessage =
        firebaseError instanceof Error
          ? firebaseError.message
          : 'Неизвестна грешка'

      if (errorMessage.includes('email-already-in-use')) {
        ToastAndroid.show('Този имейл вече се използва', ToastAndroid.BOTTOM)
      } else if (errorMessage.includes('invalid-email')) {
        ToastAndroid.show('Невалиден имейл адрес', ToastAndroid.BOTTOM)
      } else if (errorMessage.includes('weak-password')) {
        ToastAndroid.show('Паролата е твърде слаба', ToastAndroid.BOTTOM)
      } else {
        ToastAndroid.show('Грешка при създаване на акаунт', ToastAndroid.BOTTOM)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require('./../../assets/images/logo.png')}
                style={styles.logo}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Регистрация в AcademiX</Text>

              <View style={styles.inputsWrapper}>
                <TextInputField
                  label="Име и фамилия"
                  onChangeText={setName}
                  value={name}
                  inputStyle={styles.input}
                  containerStyle={styles.inputContainer}
                />

                <TextInputField
                  label="Студентски имейл"
                  onChangeText={setEmail}
                  value={email}
                  inputStyle={styles.input}
                  containerStyle={styles.inputContainer}
                  //keyboardType="email-address"
                  //autoCapitalize="none"
                />

                <TextInputField
                  label="Парола"
                  password={true}
                  onChangeText={setPassword}
                  value={password}
                  inputStyle={styles.input}
                  containerStyle={styles.inputContainer}
                />

                <TextInputField
                  label="Потвърдете паролата"
                  password={true}
                  onChangeText={setConfirmPassword}
                  value={confirmPassword}
                  inputStyle={styles.input}
                  containerStyle={styles.inputContainer}
                />
              </View>

              <Button
                text="Създайте акаунт"
                onPress={onSignUpBtnClick}
                loading={loading}
              />

              <Pressable onPress={() => router.push('/(auth)/SignIn')}>
                <Text style={styles.signInText}>
                  Вече имате акаунт?{' '}
                  <Text style={styles.signInLink}>Влезте тук!</Text>
                </Text>
              </Pressable>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 12,
    elevation: 7,
    alignItems: 'center',
    marginBottom: 24,
  },
  inputsWrapper: {
    width: '100%',
    gap: 12,
    marginBottom: 10,
  },
  inputContainer: {
    width: '100%',
    marginTop: 0,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    padding: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 18,
    textAlign: 'center',
  },
  signInText: {
    fontSize: 15,
    textAlign: 'center',
    color: Colors.GRAY,
    marginTop: 10,
  },
  signInLink: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
})
