import { useContext, useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/configs/FirebaseConfig'
import { AuthContext } from '@/context/AuthContext'
import { Redirect } from 'expo-router'
import type { Href } from 'expo-router'
import axios from 'axios'
import Colors from '@/data/Colors'

export default function Index() {
  const { setUser } = useContext(AuthContext)
  const [redirectTo, setRedirectTo] = useState<Href | null>(null)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      let target: Href = '/landing'
      try {
        if (firebaseUser?.email) {
          // Always fresh: role/name/avatar may have changed on another device
          const { data } = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/user`,
            {
              params: { email: firebaseUser.email, t: Date.now() },
              headers: { 'Cache-Control': 'no-cache' },
            }
          )
          if (data?.name && isMounted) {
            setUser({ ...data, uid: firebaseUser.uid, email: firebaseUser.email })
            target = '/(tabs)/Home'
          }
        } else if (isMounted) {
          setUser(null)
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      }
      if (isMounted) setRedirectTo(target)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [setUser])

  if (redirectTo) return <Redirect href={redirectTo} />

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator color={Colors.PRIMARY} size="large" />
    </View>
  )
}
