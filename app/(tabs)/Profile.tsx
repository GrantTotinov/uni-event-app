// app/(tabs)/Profile.tsx
import React, { useContext, useEffect, useState, useCallback } from 'react'
import { View, ScrollView, StyleSheet, Platform, StatusBar } from 'react-native'
import {
  Text,
  Card,
  Avatar,
  IconButton,
  Chip,
  Divider,
  List,
  ActivityIndicator,
  Surface,
  useTheme,
  Switch,
} from 'react-native-paper'
import { AuthContext } from '@/context/AuthContext'
import { useAppTheme } from '@/context/ThemeContext'
import { useRouter } from 'expo-router'
import { signOut } from 'firebase/auth'
import { auth } from '@/configs/FirebaseConfig'
import { useUserFollowers } from '@/hooks/useUserFollowers'
import axios from 'axios'

const getRoleDisplayText = (userRole?: string): string => {
  switch (userRole) {
    case 'systemadmin':
      return 'Системен Админ'
    case 'teacher':
      return 'Преподавател'
    case 'user':
    case 'student':
    default:
      return 'Студент'
  }
}

const getRoleColor = (theme: any, userRole?: string): string => {
  switch (userRole) {
    case 'systemadmin':
      return '#dc3545'
    case 'teacher':
      return '#007bff'
    default:
      return theme.colors.onSurfaceVariant
  }
}

const getRoleIcon = (userRole?: string): string => {
  switch (userRole) {
    case 'systemadmin':
      return 'shield-crown'
    case 'teacher':
      return 'school'
    case 'user':
    case 'student':
    default:
      return 'account'
  }
}

export default function Profile() {
  const { user, setUser } = useContext(AuthContext)
  const { isDarkMode, toggleTheme } = useAppTheme()
  const theme = useTheme()
  const router = useRouter()
  const [userDetails, setUserDetails] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const handleSettingsPress = useCallback(() => {
    router.push('/settings')
  }, [router])

  const handleLogoutPress = useCallback(() => {
    signOut(auth)
      .then(() => {
        setUser(null)
        router.replace('/landing')
      })
      .catch(() => {})
  }, [setUser, router])

  const { data: followStats } = useUserFollowers(user?.email)

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.email) return
      setLoading(true)
      try {
        const res = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/user?email=${encodeURIComponent(
            user.email
          )}`
        )
        setUserDetails(res.data)
      } catch (error) {
        console.error('Error fetching user details:', error)
        setUserDetails(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUserDetails()
  }, [user?.email])

  if (loading) {
    return (
      <Surface style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Зареждане на профил...</Text>
      </Surface>
    )
  }

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        backgroundColor={theme.colors.surface}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with title and action buttons */}
        <Surface
          style={[
            styles.headerSurface,
            { backgroundColor: theme.colors.surface },
          ]}
          elevation={2}
        >
          <View style={styles.headerRow}>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              Профил
            </Text>
            <View style={styles.headerActions}>
              <IconButton
                icon="theme-light-dark"
                size={28}
                onPress={toggleTheme}
                iconColor={theme.colors.primary}
              />
              <IconButton
                icon="cog"
                size={28}
                onPress={handleSettingsPress}
                iconColor={theme.colors.primary}
              />
              <IconButton
                icon="logout"
                size={28}
                onPress={handleLogoutPress}
                iconColor={theme.colors.primary}
              />
            </View>
          </View>
        </Surface>

        {/* Profile Card */}
        <Card style={styles.profileCard} mode="elevated">
          <Card.Content style={styles.profileContent}>
            <Avatar.Image
              size={120}
              source={{
                uri: userDetails?.image || 'https://placehold.co/120x120',
              }}
              style={styles.avatar}
            />

            <Text variant="headlineSmall" style={styles.userName}>
              {userDetails?.name || 'Потребител'}
            </Text>

            <Chip
              icon={getRoleIcon(userDetails?.role)}
              mode="outlined"
              style={[
                styles.roleChip,
                { borderColor: getRoleColor(theme, userDetails?.role) },
              ]}
              textStyle={{
                color: getRoleColor(theme, userDetails?.role),
                fontWeight: '600',
              }}
            >
              {getRoleDisplayText(userDetails?.role)}
            </Chip>
          </Card.Content>
        </Card>

        {/* Stats Card */}
        <Card style={styles.statsCard} mode="elevated">
          <Card.Content>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {followStats?.followersCount || 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Последователи
                </Text>
              </View>

              <Divider style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {followStats?.followingCount || 0}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Следва
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Information Card */}
        <Card style={styles.infoCard} mode="elevated">
          <Card.Title
            title="Информация"
            titleVariant="titleLarge"
            left={(props) => <Avatar.Icon {...props} icon="information" />}
          />
          <Card.Content>
            <List.Item
              title="Основен имейл"
              description={userDetails?.email || 'не е зададен'}
              left={(props) => <List.Icon {...props} icon="email" />}
              style={styles.listItem}
            />

            <Divider />

            <List.Item
              title="Контактен имейл"
              description={userDetails?.contact_email || 'не е зададен'}
              left={(props) => <List.Icon {...props} icon="email-outline" />}
              style={styles.listItem}
            />

            <Divider />

            <List.Item
              title="Телефон"
              description={userDetails?.contact_phone || 'не е зададен'}
              left={(props) => <List.Icon {...props} icon="phone" />}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>

        {/* Settings Card */}
        <Card style={styles.settingsCard} mode="elevated">
          <Card.Title
            title="Настройки"
            titleVariant="titleLarge"
            left={(props) => <Avatar.Icon {...props} icon="cog" />}
          />
          <Card.Content>
            <List.Item
              title="Тъмна тема"
              description={isDarkMode ? 'Включена' : 'Изключена'}
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={() => (
                <Switch value={isDarkMode} onValueChange={toggleTheme} />
              )}
              onPress={toggleTheme}
              style={styles.listItem}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </Surface>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerSurface: {
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCard: {
    margin: 16,
    marginTop: 8,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 16,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  roleChip: {
    marginTop: 4,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    textAlign: 'center',
  },
  statDivider: {
    height: 40,
    width: 1,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listItem: {
    paddingVertical: 4,
  },
})
