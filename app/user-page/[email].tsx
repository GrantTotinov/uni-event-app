import React from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import UserProfilePage from '@/app/user-page/UserProfilePage'
import Colors from '@/data/Colors'
import Button from '@/components/Shared/Button'

interface UserData {
  name: string
  email: string
  image: string
  role?: string
}

export default function UserProfile() {
  const { email } = useLocalSearchParams<{ email: string }>()
  const router = useRouter()

  const {
    data: userData,
    isLoading,
    error,
  } = useQuery<UserData>({
    queryKey: ['user-profile', email],
    queryFn: async () => {
      if (!email) throw new Error('Email is required')
      const { data } = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/user?email=${encodeURIComponent(
          email
        )}`
      )
      return data
    },
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.PRIMARY} size="large" />
        <Text style={{ marginTop: 16, color: Colors.GRAY }}>
          Зареждане на профил...
        </Text>
      </View>
    )
  }

  if (error || !userData) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: Colors.GRAY,
            textAlign: 'center',
            marginBottom: 20,
          }}
        >
          {error
            ? 'Грешка при зареждане на профила.'
            : 'Потребителят не е намерен.'}
        </Text>
        <Button text="Назад" onPress={() => router.back()} outline />
      </View>
    )
  }

  return (
    <UserProfilePage
      userEmail={userData.email}
      userName={userData.name}
      userImage={userData.image}
      userRole={userData.role}
    />
  )
}
