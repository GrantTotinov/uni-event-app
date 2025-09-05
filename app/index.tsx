import { useContext, useEffect, useState } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/configs/FirebaseConfig'
import { AuthContext } from '@/context/AuthContext'
import { Redirect } from 'expo-router'
import type { Href } from 'expo-router'
import axios from 'axios'

export default function Index() {
  const { user, setUser } = useContext(AuthContext)
  const [isLoading, setIsLoading] = useState(true)
  const [redirectTo, setRedirectTo] = useState<Href | null>(null)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (userData) => {
      console.log('Auth state changed:', userData)
      console.log('Using API URL:', process.env.EXPO_PUBLIC_HOST_URL)

      try {
        if (userData && userData.email) {
          console.log('Fetching user data for:', userData.email)

          // ПОПРАВЕНО: Агресивно cache busting
          const now = Date.now()
          const result = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/user?email=${
              userData.email
            }&bust=${now}&r=${Math.random()}`,
            {
              headers: {
                'Cache-Control':
                  'no-cache, no-store, must-revalidate, max-age=0',
                Pragma: 'no-cache',
                Expires: '0',
                'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT',
                'If-None-Match': '*',
              },
              // ПОПРАВЕНО: Disable axios caching completely
              transformRequest: [
                (data, headers) => {
                  delete headers['If-Modified-Since']
                  delete headers['If-None-Match']
                  return data
                },
              ],
            }
          )

          console.log('Fresh user data fetched:', result.data)

          if (isMounted) {
            if (result.data && result.data.name) {
              // ПОПРАВЕНО: Форсирано обновяване на данни
              const freshUserData = {
                ...result.data,
                uid: userData.uid,
                email: userData.email,
                // ПОПРАВЕНО: Добавяме timestamp за tracking
                _lastFetched: now,
              }

              console.log('Setting fresh user data:', freshUserData)
              setUser(freshUserData)
              setRedirectTo('/(tabs)/Home')
            } else {
              console.log('No user data found, redirecting to landing.')
              setRedirectTo('/landing')
            }
          }
        } else {
          if (isMounted) {
            console.log('No user logged in, redirecting to landing.')
            setUser(null)
            setRedirectTo('/landing')
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        if (isMounted) {
          setRedirectTo('/landing')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [setUser])

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (redirectTo) {
    return <Redirect href={redirectTo} />
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActivityIndicator />
    </View>
  )
}
