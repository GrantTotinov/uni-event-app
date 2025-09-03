import React, { useContext, useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  Image,
  Pressable,
  ToastAndroid,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Alert,
  TextInput,
} from 'react-native'
import TextInputField from '@/components/Shared/TextInputField'
import Button from '@/components/Shared/Button'
import Colors from '@/data/Colors'
import { useRouter } from 'expo-router'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/configs/FirebaseConfig'
import axios from 'axios'
import { AuthContext } from '@/context/AuthContext'

const { width, height } = Dimensions.get('window')

// Memoized component following performance guidelines
const SignUp = React.memo(function SignUp() {
  // Form state - performance optimized
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [confirmPassword, setConfirmPassword] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { setUser } = useContext(AuthContext)

  // Memoized handlers following performance guidelines
  const handleNameChange = useCallback((text: string) => {
    setName(text)
  }, [])

  const handleEmailChange = useCallback((text: string) => {
    setEmail(text)
  }, [])

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text)
  }, [])

  const handleConfirmPasswordChange = useCallback((text: string) => {
    setConfirmPassword(text)
  }, [])

  // Optimized keyboard dismissal
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss()
  }, [])

  // Memoized navigation handlers
  const navigateToSignIn = useCallback(() => {
    router.push('/(auth)/SignIn')
  }, [router])

  const navigateBack = useCallback(() => {
    router.back()
  }, [router])

  // Optimized user creation with retry logic
  const createUserInDatabase = useCallback(
    async (
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
            role: userData.role || 'student',
            image: '',
            contact_email: userData.email,
            contact_phone: '',
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
    },
    []
  )

  // Memoized validation with performance optimization
  const validationResult = useMemo(() => {
    const errors: string[] = []

    if (!name.trim()) {
      errors.push('Моля въведете име')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      errors.push('Моля въведете имейл')
    } else if (!emailRegex.test(email.trim())) {
      errors.push('Невалиден имейл адрес')
    }

    if (!password) {
      errors.push('Моля въведете парола')
    } else if (password.length < 6) {
      errors.push('Паролата трябва да е поне 6 символа')
    }

    if (password !== confirmPassword) {
      errors.push('Паролите не съвпадат')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }, [name, email, password, confirmPassword])

  // Optimized toast/alert handler
  const showError = useCallback((message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.BOTTOM)
    } else {
      Alert.alert('Грешка', message)
    }
  }, [])

  const showSuccess = useCallback((message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.BOTTOM)
    } else {
      Alert.alert('Успех', message)
    }
  }, [])

  // Optimized sign up handler following performance guidelines
  const onSignUpBtnClick = useCallback(async () => {
    if (!validationResult.isValid) {
      showError(validationResult.errors[0])
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

      // Create user in database
      const userData = {
        name: name.trim(),
        email: email.trim(),
        uid: resp.user.uid,
        role: 'student',
      }

      try {
        const dbUser = await createUserInDatabase(userData)
        setUser(dbUser)

        showSuccess('Акаунтът е създаден успешно!')
        router.replace('/(tabs)/Home')
      } catch (dbError) {
        console.error('Database creation error:', dbError)
        showError(
          'Акаунтът е създаден, но има проблем с профила. Опитайте да влезете отново.'
        )
        router.replace('/(auth)/SignIn')
      }
    } catch (firebaseError) {
      console.error('Firebase creation error:', firebaseError)

      const errorMessage =
        firebaseError instanceof Error
          ? firebaseError.message
          : 'Неизвестна грешка'

      if (errorMessage.includes('email-already-in-use')) {
        showError('Този имейл вече се използва')
      } else if (errorMessage.includes('invalid-email')) {
        showError('Невалиден имейл адрес')
      } else if (errorMessage.includes('weak-password')) {
        showError('Паролата е твърде слаба')
      } else {
        showError('Грешка при създаване на акаунт')
      }
    } finally {
      setLoading(false)
    }
  }, [
    validationResult,
    email,
    password,
    name,
    createUserInDatabase,
    setUser,
    showError,
    showSuccess,
    router,
  ])

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard} accessible={false}>
          <View style={styles.content}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <Image
                source={require('./../../assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <Text style={styles.title}>Регистрация в AcademiX</Text>

              {/* Form Fields */}
              <View style={styles.inputsWrapper}>
                {/* Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Име и фамилия</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={handleNameChange}
                    placeholder="Иван Петров"
                    autoCapitalize="words"
                    autoComplete="name"
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Студентски имейл</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={handleEmailChange}
                    placeholder="student@uht.bg"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Парола</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={handlePasswordChange}
                    placeholder="Минимум 6 символа"
                    secureTextEntry={true}
                    autoComplete="new-password"
                    returnKeyType="next"
                    blurOnSubmit={false}
                  />
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Потвърдете паролата</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={handleConfirmPasswordChange}
                    placeholder="Въведете паролата отново"
                    secureTextEntry={true}
                    autoComplete="new-password"
                    returnKeyType="done"
                    onSubmitEditing={onSignUpBtnClick}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <Button
                text="Създайте акаунт"
                onPress={onSignUpBtnClick}
                loading={loading}
                disabled={!validationResult.isValid || loading}
              />

              {/* Sign In Link */}
              <Pressable onPress={navigateToSignIn} disabled={loading}>
                <Text style={styles.signInText}>
                  Вече имате акаунт?{' '}
                  <Text style={styles.signInLink}>Влезте тук!</Text>
                </Text>
              </Pressable>
            </View>

            {/* Back Button */}
            <Pressable onPress={navigateBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Назад</Text>
            </Pressable>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  )
})

// Optimized styles following performance guidelines
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  logo: {
    width: Math.min(width * 0.25, 100),
    height: Math.min(width * 0.25, 100),
    marginBottom: 8,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputsWrapper: {
    width: '100%',
    gap: 16,
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.DARK_GRAY,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    height: 50, // Fixed height - no auto-expansion
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.LIGHT_GRAY,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    textAlignVertical: 'center', // Prevents multiline expansion
  },
  signInText: {
    fontSize: 14,
    textAlign: 'center',
    color: Colors.GRAY,
    marginTop: 16,
    lineHeight: 20,
  },
  signInLink: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
})

export default SignUp
