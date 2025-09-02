import React, { useContext } from 'react'
import { Tabs } from 'expo-router'
import { Image } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { AuthContext } from '@/context/AuthContext'
import Colors from '@/data/Colors'

export default function TabLayout() {
  const { user } = useContext(AuthContext)

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.PRIMARY,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          tabBarLabel: 'Начало',
        }}
      />
      <Tabs.Screen
        name="Event"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
          tabBarLabel: 'Събития',
        }}
      />
      <Tabs.Screen
        name="AddPost"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
          tabBarLabel: 'Добави Публикация',
        }}
      />
      <Tabs.Screen
        name="Club"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
          tabBarLabel: 'Групи',
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Image
              source={{ uri: user?.image }}
              style={{
                width: size,
                height: size,
                borderRadius: 99,
              }}
            />
          ),
          tabBarLabel: 'Профил',
        }}
      />
    </Tabs>
  )
}
