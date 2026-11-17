// File: components/Home/Header.tsx
import React, { useCallback, useContext } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, Href } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'
import { useUser } from '@/hooks/useUser'
import { useUnreadNotificationsCount } from '@/hooks/useNotifications'
import Colors from '@/data/Colors'

export function greeting(hour = new Date().getHours()): string {
  if (hour < 5) return 'Лека нощ'
  if (hour < 12) return 'Добро утро'
  if (hour < 18) return 'Добър ден'
  return 'Добър вечер'
}

const Header = React.memo(function Header() {
  const { user } = useContext(AuthContext)
  const theme = useTheme()
  const router = useRouter()

  // Fresh data (name/avatar may have changed in Settings)
  const { data: userDetails } = useUser(user?.email)
  const name = userDetails?.name || user?.name || 'Потребител'
  const image = userDetails?.image || user?.image
  const firstName = name.split(' ')[0]

  const unread = useUnreadNotificationsCount(user?.email)

  const goProfile = useCallback(() => router.push('/(tabs)/Profile'), [router])
  const goChat = useCallback(() => router.push('/chat' as Href), [router])
  const goNotifications = useCallback(
    () => router.push('/notifications' as Href),
    [router]
  )

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity
        style={styles.left}
        onPress={goProfile}
        activeOpacity={0.7}
        accessibilityLabel={`Профил на ${name}`}
        accessibilityRole="button"
      >
        <Image
          source={image ? { uri: image } : require('@/assets/images/profile.png')}
          style={styles.avatar}
          cachePolicy="memory-disk"
          transition={200}
        />
        <View style={{ flex: 1 }}>
          <Text
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {greeting()},
          </Text>
          <Text
            variant="titleMedium"
            numberOfLines={1}
            style={[styles.name, { color: theme.colors.onSurface }]}
          >
            {firstName} 👋
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.right}>
        <TouchableOpacity
          onPress={goChat}
          style={[styles.iconButton, { backgroundColor: theme.colors.surfaceVariant }]}
          activeOpacity={0.8}
          accessibilityLabel="Отвори чат"
          accessibilityRole="button"
        >
          <Ionicons name="chatbubbles-outline" size={20} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goNotifications}
          style={[styles.iconButton, { backgroundColor: theme.colors.surfaceVariant }]}
          activeOpacity={0.8}
          accessibilityLabel={
            unread ? `Известия, ${unread} нови` : 'Известия'
          }
          accessibilityRole="button"
        >
          <Ionicons
            name={unread ? 'notifications' : 'notifications-outline'}
            size={20}
            color={unread ? Colors.PRIMARY : theme.colors.onSurface}
          />
          {unread > 0 && (
            <View style={[styles.badge, { borderColor: theme.colors.surface }]}>
              <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
  },
  name: { fontWeight: '700' },
  right: { flexDirection: 'row', gap: 10 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: Colors.RED,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
})

export default Header
