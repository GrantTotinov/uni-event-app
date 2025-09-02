import React, { useContext } from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Colors from '@/data/Colors'
import { AuthContext } from '@/context/AuthContext'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter, Href } from 'expo-router'

export default function Header() {
  const { user } = useContext(AuthContext)
  const router = useRouter()

  const safeText = (value: any) => {
    if (value === null || value === undefined) return ''
    if (typeof value !== 'string') return String(value)
    return value
  }

  // Handler for navigating to the chat page
  const handleChatPress = () => {
    router.push('/chat' as Href)
  }

  // Handler for notifications (може да добавите логика по-късно)
  const handleNotificationsPress = () => {
    console.log('Notifications pressed')
  }

  return (
    <View style={{ paddingBottom: 10 }}>
      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingTop: 10,
          paddingBottom: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleChatPress}
          style={{
            backgroundColor: Colors.PRIMARY,
            borderRadius: 25,
            padding: 10,
            marginLeft: 10,
          }}
          accessibilityLabel="Чат"
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNotificationsPress}
          style={{
            backgroundColor: Colors.PRIMARY,
            borderRadius: 25,
            padding: 10,
            marginLeft: 10,
          }}
          accessibilityLabel="Известия"
        >
          <MaterialIcons name="notifications-none" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Старият header-контент */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: Colors.PRIMARY,
              marginBottom: 4,
            }}
          >
            Здравейте!
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{
                uri: safeText(user?.image) || 'https://placehold.co/50x50',
              }}
              style={{
                height: 50,
                width: 50,
                borderRadius: 25,
                marginRight: 12,
              }}
            />
            <Text
              style={{
                fontSize: 16,
                color: Colors.GRAY,
              }}
            >
              {safeText(user?.name)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
