import React, { useContext, useCallback, useMemo } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { MaterialIcons } from '@expo/vector-icons'
import { useRouter, Href } from 'expo-router'

import Colors from '@/data/Colors'
import { AuthContext } from '@/context/AuthContext'
import { useAppTheme } from '@/context/ThemeContext'

// Memoized component following performance guidelines
const Header = React.memo(function Header() {
  const { user } = useContext(AuthContext)
  const { isDarkMode, theme } = useAppTheme()
  const router = useRouter()

  // Memoized safe text utility - performance optimized
  const safeText = useCallback((value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value !== 'string') return String(value)
    return value
  }, [])

  // Memoized user data - prevents unnecessary re-renders
  const userData = useMemo(
    () => ({
      name: safeText(user?.name) || 'Потребител',
      image: safeText(user?.image) || 'https://placehold.co/50x50',
    }),
    [user?.name, user?.image, safeText]
  )

  // Memoized navigation handlers following performance guidelines
  const handleChatPress = useCallback(() => {
    router.push('/chat' as Href)
  }, [router])

  const handleNotificationsPress = useCallback(() => {
    // TODO: Implement notifications logic
    console.log('Notifications pressed')
  }, [])

  const handleAvatarPress = useCallback(() => {
    router.push('/user-page' as Href)
  }, [router])

  // Memoized theme colors - performance optimized
  const colors = useMemo(
    () => ({
      surface: isDarkMode ? '#1a1a1a' : '#ffffff',
      onSurface: isDarkMode ? '#ffffff' : '#000000',
      primary: Colors.PRIMARY,
      onPrimary: '#ffffff',
      surfaceVariant: isDarkMode ? '#2a2a2a' : '#f5f5f5',
      shadow: isDarkMode ? '#000000' : '#000000',
      error: '#ef4444',
      border: isDarkMode ? '#333333' : '#e5e5e5',
    }),
    [isDarkMode]
  )

  // Memoized styles for theme support - performance optimized
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerRow: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        leftSection: {
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
        },
        rightSection: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        avatarContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceVariant,
          borderRadius: 25,
          paddingRight: 16,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        avatar: {
          height: 50,
          width: 50,
          borderRadius: 25,
          marginRight: 12,
          borderWidth: 2,
          borderColor: colors.primary,
        },
        userName: {
          fontSize: 16,
          fontWeight: '600',
          color: colors.onSurface,
          maxWidth: 120, // Prevents overflow on long names
        },
        iconButton: {
          backgroundColor: colors.primary,
          borderRadius: 22,
          padding: 12,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        },
        notificationBadge: {
          position: 'absolute',
          top: 8,
          right: 8,
          backgroundColor: colors.error,
          borderRadius: 6,
          minWidth: 12,
          height: 12,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [colors]
  )

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.headerRow}>
        {/* Left Section - User Avatar and Name */}
        <TouchableOpacity
          style={dynamicStyles.leftSection}
          onPress={handleAvatarPress}
          activeOpacity={0.7}
          accessibilityLabel={`Профил на ${userData.name}`}
          accessibilityRole="button"
        >
          <View style={dynamicStyles.avatarContainer}>
            <Image
              source={{ uri: userData.image }}
              style={dynamicStyles.avatar}
              defaultSource={require('@/assets/images/profile.png')}
              accessibilityLabel={`Снимка на ${userData.name}`}
            />
            <Text
              style={dynamicStyles.userName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {userData.name}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Right Section - Action Buttons */}
        <View style={dynamicStyles.rightSection}>
          {/* Notifications Button */}
          <TouchableOpacity
            onPress={handleNotificationsPress}
            style={dynamicStyles.iconButton}
            activeOpacity={0.8}
            accessibilityLabel="Известия"
            accessibilityRole="button"
            accessibilityHint="Отвори известията"
          >
            <MaterialIcons
              name="notifications-none"
              size={20}
              color={colors.onPrimary}
            />
            {/* Notification Badge - можете да добавите логика за броя */}
            {/* <View style={dynamicStyles.notificationBadge} /> */}
          </TouchableOpacity>

          {/* Chat Button */}
          <TouchableOpacity
            onPress={handleChatPress}
            style={dynamicStyles.iconButton}
            activeOpacity={0.8}
            accessibilityLabel="Съобщения"
            accessibilityRole="button"
            accessibilityHint="Отвори чата"
          >
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color={colors.onPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

export default Header
