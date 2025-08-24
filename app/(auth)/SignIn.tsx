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
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/configs/FirebaseConfig'
import axios from 'axios'
import { AuthContext } from '@/context/AuthContext'

const { width } = Dimensions.get('window')

export default function SignIn() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setUser } = useContext(AuthContext)

  // Fetch user data with retry logic
  const fetchUserData = async (
    userEmail: string,
    retries = 3
  ): Promise<any> => {
    try {
      const result = await axios.get(
        process.env.EXPO_PUBLIC_HOST_URL + '/user?email=' + userEmail
      )
      if (result.data && Object.keys(result.data).length > 0) {
        return result.data
      } else {
        throw new Error('Няма данни')
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
      ToastAndroid.show('Моля попълнете всички полета', ToastAndroid.BOTTOM)
      return
    }
    setLoading(true)
    signInWithEmailAndPassword(auth, email, password)
      .then(async (resp) => {
        const userEmail = resp.user.email
        if (!userEmail) {
          setLoading(false)
          ToastAndroid.show(
            'Грешка: липсващ имейл от акаунта',
            ToastAndroid.BOTTOM
          )
          return
        }
        try {
          const userData = await fetchUserData(userEmail)
          setUser(userData)
          router.replace('/(tabs)/Home')
        } catch (error) {
          ToastAndroid.show(
            'Профилът все още не е наличен. Опитайте пак след малко.',
            ToastAndroid.BOTTOM
          )
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
        ToastAndroid.show('Грешен имейл или парола', ToastAndroid.BOTTOM)
      })
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
              <Text style={styles.title}>Влезте в AcademiX</Text>
              <View style={styles.inputsWrapper}>
                <TextInputField
                  label="Студентски имейл"
                  onChangeText={setEmail}
                  value={email}
                  inputStyle={styles.input}
                  containerStyle={styles.inputContainer}
                />
                <TextInputField
                  label="Парола"
                  password={true}
                  onChangeText={setPassword}
                  value={password}
                  inputStyle={styles.input}
                  containerStyle={styles.inputContainer}
                />
              </View>
              <Button
                text="Влезте в акаунта си"
                onPress={onSignInBtnClick}
                loading={loading}
              />
              <Pressable onPress={() => router.push('/(auth)/SignUp')}>
                <Text style={styles.registerText}>
                  Все още нямате регистрация?{' '}
                  <Text style={styles.registerLink}>Регистрирайте се тук!</Text>
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
  button: {
    marginTop: 18,
    marginBottom: 8,
    width: '100%',
  },
  registerText: {
    fontSize: 15,
    textAlign: 'center',
    color: Colors.GRAY,
    marginTop: 10,
  },
  registerLink: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
})
