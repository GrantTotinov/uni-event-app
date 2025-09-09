// File: components/Home/Header.tsx
import React, { useMemo, useCallback, useContext } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, Href } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'
import { useAppTheme } from '@/context/ThemeContext'
import { useUser } from '@/hooks/useUser'
import Colors from '@/data/Colors'

// Performance optimized component with React.memo
const Header = React.memo(function Header() {
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const router = useRouter()

  // Зареждаме най-новите данни за потребителя
  const { data: userDetails } = useUser(user?.email)

  // Memoized user data combining AuthContext and fresh data
  const userData = useMemo(() => {
    const currentImage =
      userDetails?.image || user?.image || 'https://placehold.co/50x50'
    const currentName = userDetails?.name || user?.name || 'Потребител'

    return {
      name: currentName,
      image: currentImage,
    }
  }, [userDetails?.image, userDetails?.name, user?.image, user?.name])

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
      surfaceVariant: isDarkMode ? '#2a2a2a' : '#f0f0f0',
      shadow: isDarkMode ? '#000000' : '#000000',
    }),
    [isDarkMode]
  )

  // Memoized dynamic styles - performance optimized
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          paddingHorizontal: 20,
          paddingVertical: 16,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        leftSection: {
          flex: 1,
        },
        rightSection: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
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
              cachePolicy="memory-disk"
              transition={200}
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
          {/* Chat Button */}
          <TouchableOpacity
            onPress={handleChatPress}
            style={dynamicStyles.iconButton}
            activeOpacity={0.8}
            accessibilityLabel="Отвори чат"
            accessibilityRole="button"
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={colors.onPrimary}
            />
          </TouchableOpacity>

          {/* Notifications Button */}
          <TouchableOpacity
            onPress={handleNotificationsPress}
            style={dynamicStyles.iconButton}
            activeOpacity={0.8}
            accessibilityLabel="Известия"
            accessibilityRole="button"
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.onPrimary}
            />
            {/* TODO: Add notification badge when implementing notifications */}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

export default Header
