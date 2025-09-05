import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import moment from 'moment'
import 'moment/locale/bg'
import Colors from '@/data/Colors'
import { useUser } from '@/hooks/useUser'

moment.locale('bg')

interface USER_AVATAR {
  name: string
  image: string
  date: string
  localDate?: string
  role?: string
  isUhtRelated?: boolean
  email?: string
  onPress?: () => void
  disabled?: boolean
}

export default function UserAvatar({
  name,
  image,
  date,
  localDate,
  role,
  isUhtRelated,
  email,
  onPress,
  disabled = false,
}: USER_AVATAR) {
  const router = useRouter()

  // Зареждаме най-новите данни за потребителя за актуална снимка
  const { data: userDetails } = useUser(email, { enabled: !!email })

  let formattedDate = 'Невалидна дата'

  if (date === 'Now') {
    formattedDate = 'току-що'
  } else {
    try {
      if (localDate) {
        formattedDate = moment(localDate).fromNow()
      } else {
        formattedDate = moment.utc(date).tz('Europe/Sofia').fromNow()
      }
    } catch (error) {
      console.error('Грешка при форматиране на датата:', error)
    }
  }

  const getRoleDisplayText = (userRole: string | null | undefined): string => {
    switch (userRole) {
      case 'systemadmin':
        return 'Системен Админ'
      case 'teacher':
        return 'Преподавател'
      case 'user':
        return 'Студент'
      default:
        return 'Студент'
    }
  }

  const getRoleColor = (userRole: string | null | undefined): string => {
    switch (userRole) {
      case 'systemadmin':
        return '#dc3545'
      case 'teacher':
        return '#007bff'
      case 'user':
        return Colors.GRAY
      default:
        return Colors.GRAY
    }
  }

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else if (email && !disabled) {
      router.push(`/user-page/${encodeURIComponent(email)}`)
    }
  }

  const ContentComponent = email && !disabled ? TouchableOpacity : View

  // Използваме най-новата снимка от userDetails или fallback към подадената снимка
  const currentImage =
    userDetails?.image || image || 'https://via.placeholder.com/36'

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        gap: 12,
      }}
    >
      <ContentComponent
        onPress={email && !disabled ? handlePress : undefined}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          flex: 1,
        }}
        disabled={disabled}
      >
        <Image
          source={{ uri: currentImage }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
          }}
          defaultSource={require('@/assets/images/profile.png')}
          cachePolicy="memory-disk"
          transition={200}
        />
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 14,
                color: Colors.BLACK,
                maxWidth: 120,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {isUhtRelated && (
              <View
                style={{
                  backgroundColor: '#007bff',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }}
                >
                  УХТ
                </Text>
              </View>
            )}
            <Text
              style={{
                fontSize: 10,
                fontWeight: 'bold',
                color: getRoleColor(role),
                textTransform: 'uppercase',
              }}
            >
              {getRoleDisplayText(role)}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 12,
              color: Colors.GRAY,
              marginTop: 2,
            }}
          >
            {formattedDate}
          </Text>
        </View>
      </ContentComponent>
    </View>
  )
}
