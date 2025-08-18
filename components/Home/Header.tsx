import React, { useContext } from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import Colors from '@/data/Colors'
import { AuthContext } from '@/context/AuthContext'

export default function Header() {
  const { user } = useContext(AuthContext)
  const router = useRouter()

  // Handler for navigating to the chat page
  const handleChatPress = () => {
    try {
      // Use the correct route for Expo Router
      router.push('/chat')
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  return (
    <View style={{ paddingBottom: 10 }}>
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
              source={{ uri: user?.image }}
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
              {user?.name}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleChatPress}
          style={{
            backgroundColor: Colors.PRIMARY,
            borderRadius: 25,
            padding: 10,
            marginLeft: 10,
            marginTop: 2,
          }}
          accessibilityLabel="Чат"
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}
