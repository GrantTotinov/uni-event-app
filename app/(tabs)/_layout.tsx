import React, { useContext } from 'react'
import { Tabs } from 'expo-router'
import { View, StyleSheet } from 'react-native'
import { useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Haptics from 'expo-haptics'
import { AuthContext } from '@/context/AuthContext'
import Colors from '@/data/Colors'

type IconName = keyof typeof Ionicons.glyphMap

const icon =
  (active: IconName, inactive: IconName) =>
  ({ color, size, focused }: { color: string; size: number; focused: boolean }) =>
    <Ionicons name={focused ? active : inactive} size={size} color={color} />

export default function TabLayout() {
  const { user } = useContext(AuthContext)
  const theme = useTheme()
  const { bottom } = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [
          styles.bar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.outlineVariant,
            // room for icon + label, plus the home-indicator inset on iOS
            height: 68 + bottom,
            paddingBottom: bottom + 8,
          },
        ],
        sceneStyle: { backgroundColor: theme.colors.background },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.selectionAsync().catch(() => {})
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{ tabBarLabel: 'Начало', tabBarIcon: icon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="Event"
        options={{
          tabBarLabel: 'Събития',
          tabBarIcon: icon('calendar', 'calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="AddPost"
        options={{
          tabBarLabel: () => null,
          tabBarAccessibilityLabel: 'Нова публикация',
          tabBarIcon: ({ focused }) => (
            <View
              style={[
                styles.fab,
                { backgroundColor: focused ? Colors.DARK_GRAY : Colors.PRIMARY },
              ]}
            >
              <Ionicons name="add" size={30} color="#fff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Club"
        options={{
          tabBarLabel: 'Групи',
          tabBarIcon: icon('people', 'people-outline'),
        }}
      />
      <Tabs.Screen
        name="Profile"
        options={{
          tabBarLabel: 'Профил',
          tabBarIcon: ({ size, focused, color }) =>
            user?.image ? (
              <Image
                source={{ uri: user.image }}
                style={{
                  width: size + 2,
                  height: size + 2,
                  borderRadius: 99,
                  borderWidth: 2,
                  borderColor: focused ? theme.colors.primary : 'transparent',
                }}
                cachePolicy="memory-disk"
              />
            ) : (
              <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
            ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  bar: {
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
  },
  label: { fontSize: 11, fontWeight: '600' },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 18,
    marginTop: -18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
})
