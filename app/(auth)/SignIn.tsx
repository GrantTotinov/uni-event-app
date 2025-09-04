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
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/configs/FirebaseConfig'
import axios from 'axios'
import { AuthContext } from '@/context/AuthContext'

const { width, height } = Dimensions.get('window')

// Memoized component following performance guidelines
const SignIn = React.memo(function SignIn() {
  // Form state - performance optimized
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { setUser } = useContext(AuthContext)

  // Memoized handlers following performance guidelines
  const handleEmailChange = useCallback((text: string) => {
    setEmail(text)
  }, [])

  const handlePasswordChange = useCallback((text: string) => {
    setPassword(text)
  }, [])

  // Optimized keyboard dismissal
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss()
  }, [])

  // Memoized navigation handlers
  const navigateToSignUp = useCallback(() => {
    router.push('/(auth)/SignUp')
  }, [router])

  const navigateBack = useCallback(() => {
    router.back()
  }, [router])

  // Optimized user fetch with retry logic
  const fetchUserFromDatabase = useCallback(
    async (uid: string, retries = 3): Promise<any> => {
      try {
        const result = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/user?uid=${uid}`
        )
        if (result.data) {
          return result.data
        } else {
          throw new Error('Потребителят не е намерен в базата данни')
        }
      } catch (error) {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          return fetchUserFromDatabase(uid, retries - 1)
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

    return {
      isValid: errors.length === 0,
      errors,
    }
  }, [email, password])

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

  // Optimized sign in handler following performance guidelines
  const onSignInBtnClick = useCallback(async () => {
    if (!validationResult.isValid) {
      showError(validationResult.errors[0])
      return
    }

    setLoading(true)

    try {
      // Sign in with Firebase
      const resp = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      if (!resp.user.uid) {
        throw new Error('Грешка при влизане в акаунта')
      }

      // Fetch user from database
      try {
        const dbUser = await fetchUserFromDatabase(resp.user.uid)
        setUser(dbUser)

        showSuccess('Успешно влизане!')
        router.replace('/(tabs)/Home')
      } catch (dbError) {
        console.error('Database fetch error:', dbError)
        showError(
          'Акаунтът е намерен, но има проблем с профила. Моля опитайте отново.'
        )
      }
    } catch (firebaseError) {
      console.error('Firebase sign in error:', firebaseError)

      const errorMessage =
        firebaseError instanceof Error
          ? firebaseError.message
          : 'Неизвестна грешка'

      if (errorMessage.includes('user-not-found')) {
        showError('Потребителят не е намерен')
      } else if (errorMessage.includes('wrong-password')) {
        showError('Грешна парола')
      } else if (errorMessage.includes('invalid-email')) {
        showError('Невалиден имейл адрес')
      } else if (errorMessage.includes('too-many-requests')) {
        showError('Твърде много опити. Моля опитайте по-късно.')
      } else {
        showError('Грешка при влизане в акаунта')
      }
    } finally {
      setLoading(false)
    }
  }, [
    validationResult,
    email,
    password,
    fetchUserFromDatabase,
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
              <Text style={styles.title}>Влизане в AcademiX</Text>

              {/* Form Fields */}
              <View style={styles.inputsWrapper}>
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
                    placeholder="Въведете вашата парола"
                    secureTextEntry={true}
                    autoComplete="current-password"
                    returnKeyType="done"
                    onSubmitEditing={onSignInBtnClick}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <Button
                text="Влезте в акаунта"
                onPress={onSignInBtnClick}
                loading={loading}
                disabled={!validationResult.isValid || loading}
              />

              {/* Sign Up Link */}
              <Pressable onPress={navigateToSignUp} disabled={loading}>
                <Text style={styles.signUpText}>
                  Нямате акаунт?{' '}
                  <Text style={styles.signUpLink}>Регистрирайте се!</Text>
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
    marginTop: height * 0.05,
  },
  logo: {
    width: Math.min(width * 0.3, 120),
    height: Math.min(width * 0.3, 120),
    marginBottom: 12,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  inputsWrapper: {
    width: '100%',
    gap: 20,
    marginBottom: 24,
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
    height: 52, // Fixed height - no auto-expansion
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.LIGHT_GRAY,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    textAlignVertical: 'center', // Prevents multiline expansion
  },
  signUpText: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.GRAY,
    marginTop: 20,
    lineHeight: 24,
  },
  signUpLink: {
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

export default SignIn
