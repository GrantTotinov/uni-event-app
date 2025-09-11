// File: app/user-page/UserProfilePage.tsx
import React, { useContext, useCallback, useMemo } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
  Platform,
} from 'react-native'
import {
  Surface,
  Text,
  Card,
  Avatar,
  IconButton,
  Chip,
  Divider,
  Button,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

import { AuthContext } from '@/context/AuthContext'
import { useAppTheme } from '@/context/ThemeContext'
import {
  useUserFollowers,
  useFollowStatus,
  useFollowUser,
} from '@/hooks/useUserFollowers'
import { useUser } from '@/hooks/useUser'
import { createDirectChat } from '@/utils/chatUtils'
import { MaterialCommunityIcons } from '@expo/vector-icons'

interface UserProfilePageProps {
  userEmail: string
  userName: string
  userImage: string
  userRole?: string
}

// Utility functions for role display - memoized for performance
const getRoleDisplayText = (userRole: string | null | undefined): string => {
  switch (userRole) {
    case 'systemadmin':
      return 'Системен Админ'
    case 'teacher':
      return 'Преподавател'
    case 'user':
    case 'student':
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
    case 'student':
      return '#9e9e9e'
    default:
      return '#9e9e9e'
  }
}

const getRoleIcon = (userRole: string | null | undefined): string => {
  switch (userRole) {
    case 'systemadmin':
      return 'shield-crown'
    case 'teacher':
      return 'school'
    case 'user':
    case 'student':
      return 'account' // ПОПРАВЕНО: Сменено на 'account'
    default:
      return 'account' // ПОПРАВЕНО: Сменено на 'account'
  }
}

// Memoized animated components following performance guidelines
const AnimatedSurface = Animated.createAnimatedComponent(Surface)
const AnimatedCard = Animated.createAnimatedComponent(Card)

const UserProfilePage = React.memo(function UserProfilePage({
  userEmail,
  userName,
  userImage,
  userRole,
}: UserProfilePageProps) {
  const { user: currentUser } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()
  const router = useRouter()

  const isOwnProfile = currentUser?.email === userEmail

  // Load fresh user data for most up-to-date profile information
  const { data: userDetails } = useUser(userEmail)

  // Use fresh data if available, fallback to props
  const currentUserData = useMemo(
    () => ({
      name: userDetails?.name || userName,
      email: userDetails?.email || userEmail,
      image: userDetails?.image || userImage || 'https://placehold.co/120x120',
      role: userDetails?.role || userRole,
      contact_email: userDetails?.contact_email,
      contact_phone: userDetails?.contact_phone,
    }),
    [userDetails, userName, userEmail, userImage, userRole]
  )

  // Hooks for user interactions
  const { data: followStats, isLoading: statsLoading } =
    useUserFollowers(userEmail)
  const { data: followStatus, isLoading: statusLoading } = useFollowStatus(
    currentUser?.email,
    userEmail
  )
  const followMutation = useFollowUser()

  // Memoized theme colors - performance optimized
  const colors = useMemo(
    () => ({
      surface: theme.colors.surface,
      onSurface: theme.colors.onSurface,
      primary: theme.colors.primary,
      onPrimary: theme.colors.onPrimary,
      secondary: theme.colors.secondary,
      onSecondary: theme.colors.onSecondary,
      surfaceVariant: theme.colors.surfaceVariant,
      onSurfaceVariant: theme.colors.onSurfaceVariant,
      outline: theme.colors.outline,
      primaryContainer: theme.colors.primaryContainer,
      onPrimaryContainer: theme.colors.onPrimaryContainer,
      secondaryContainer: theme.colors.secondaryContainer,
      onSecondaryContainer: theme.colors.onSecondaryContainer,
      errorContainer: theme.colors.errorContainer,
      onErrorContainer: theme.colors.onErrorContainer,
      background: theme.colors.background,
      shadow: isDarkMode ? '#000000' : '#000000',
    }),
    [theme.colors, isDarkMode]
  )

  // Memoized dynamic styles - performance optimized
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.background,
        },
        header: {
          backgroundColor: colors.surface,
          //paddingTop:
          //Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 14,
          paddingBottom: 8,
        },
        backButton: {
          alignSelf: 'flex-start',
          marginLeft: 8,
          marginBottom: 8,
        },
        profileCard: {
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 24,
          backgroundColor: colors.surface,
        },
        profileHeader: {
          alignItems: 'center',
          paddingVertical: 32,
          paddingHorizontal: 24,
        },
        avatarContainer: {
          position: 'relative',
          marginBottom: 20,
        },
        avatar: {
          borderWidth: 4,
          borderColor: colors.primary,
        },
        badgeContainer: {
          position: 'absolute',
          bottom: 8,
          right: 8,
          backgroundColor: colors.primaryContainer,
          borderRadius: 20,
          padding: 8,
        },
        userName: {
          fontWeight: 'bold',
          marginBottom: 8,
          textAlign: 'center',
          color: colors.onSurface,
        },
        userEmail: {
          marginBottom: 12,
          textAlign: 'center',
          color: colors.onSurfaceVariant,
        },
        roleChip: {
          alignSelf: 'center',
        },
        statsCard: {
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 16,
          backgroundColor: colors.surface,
        },
        statsContainer: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 20,
        },
        statItem: {
          alignItems: 'center',
          flex: 1,
        },
        statNumber: {
          fontWeight: 'bold',
          marginBottom: 4,
          color: colors.onSurface,
        },
        statLabel: {
          textAlign: 'center',
          color: colors.onSurfaceVariant,
        },
        statDivider: {
          height: 40,
          width: 1,
          backgroundColor: colors.outline,
          marginHorizontal: 16,
        },
        actionsCard: {
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 16,
          backgroundColor: colors.surface,
        },
        actionButtons: {
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 20,
        },
        followButton: {
          flex: 1,
          borderRadius: 12,
        },
        messageButton: {
          borderRadius: 12,
          borderWidth: 2,
          borderColor: colors.primary,
          backgroundColor: 'transparent',
        },
        messageButtonContent: {
          paddingVertical: 4,
        },
        infoCard: {
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 16,
          backgroundColor: colors.surface,
        },
        infoItem: {
          paddingVertical: 12,
        },
        infoItemContent: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        },
        infoText: {
          flex: 1,
          color: colors.onSurface,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        gradientBackground: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 200,
        },
      }),
    [colors]
  )

  // Event handlers - memoized with useCallback following performance guidelines
  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleFollowToggle = useCallback(async () => {
    if (!currentUser?.email || !followStatus) return

    try {
      await followMutation.mutateAsync({
        followerEmail: currentUser.email,
        followingEmail: userEmail,
        isFollowing: followStatus.isFollowing,
      })
    } catch (error) {
      console.error('Error toggling follow:', error)
      Alert.alert('Грешка', 'Неуспешна операция при последване')
    }
  }, [currentUser?.email, followStatus, followMutation, userEmail])

  const handleSendMessage = useCallback(async () => {
    if (!currentUser?.email || !currentUser?.name) {
      Alert.alert('Грешка', 'Трябва да сте влезли в системата')
      return
    }

    if (currentUser.email === userEmail) {
      Alert.alert('Грешка', 'Не можете да изпратите съобщение на себе си')
      return
    }

    try {
      // ПОДОБРЕНО: Показваме loading състояние
      console.log('💬 Starting chat creation/search...')

      const chatId = await createDirectChat({
        currentUser: {
          email: currentUser.email,
          name: currentUser.name,
          image: currentUser.image || 'https://placehold.co/50x50',
          uid: currentUser.uid,
        },
        targetUser: {
          email: userEmail,
          name: currentUserData.name,
          image: currentUserData.image || 'https://placehold.co/50x50',
          uid: undefined, // Нямаме uid на целевия потребител
        },
      })

      console.log('✅ Chat ready, navigating to:', chatId)
      router.push(`/chat/${chatId}`)
    } catch (error) {
      console.error('❌ Error creating/finding chat:', error)
      Alert.alert('Грешка', 'Неуспешно създаване на чат. Моля опитайте отново.')
    }
  }, [currentUser, userEmail, currentUserData, router])

  return (
    <Surface style={[styles.container, dynamicStyles.container]}>
      <StatusBar
        backgroundColor={colors.surface}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Header with back button */}
      <AnimatedSurface
        style={dynamicStyles.header}
        elevation={2}
        entering={SlideInDown.delay(100)}
      >
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleBack}
          iconColor={colors.onSurface}
          style={dynamicStyles.backButton}
        />
      </AnimatedSurface>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Background Gradient */}
        <LinearGradient
          colors={[
            colors.primaryContainer,
            colors.secondaryContainer,
            colors.background,
          ]}
          style={dynamicStyles.gradientBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Profile Card */}
        <AnimatedCard
          mode="elevated"
          style={dynamicStyles.profileCard}
          entering={FadeIn.delay(200)}
        >
          <Card.Content style={dynamicStyles.profileHeader}>
            <Animated.View
              style={dynamicStyles.avatarContainer}
              entering={ZoomIn.delay(400)}
            >
              <Avatar.Image
                size={120}
                source={{ uri: currentUserData.image }}
                style={dynamicStyles.avatar}
              />
              <View style={dynamicStyles.badgeContainer}>
                <Ionicons
                  name={getRoleIcon(currentUserData.role) as any} // ПОПРАВЕНО: TypeScript fix
                  size={20}
                  color={colors.onPrimaryContainer}
                />
              </View>
            </Animated.View>

            <Text variant="headlineSmall" style={dynamicStyles.userName}>
              {currentUserData.name}
            </Text>

            <Text variant="bodyMedium" style={dynamicStyles.userEmail}>
              {currentUserData.email}
            </Text>

            <Chip
              icon={getRoleIcon(currentUserData.role)}
              mode="outlined"
              style={[
                dynamicStyles.roleChip,
                { borderColor: getRoleColor(currentUserData.role) },
              ]}
              textStyle={{
                color: getRoleColor(currentUserData.role),
                fontWeight: '600',
              }}
            >
              {getRoleDisplayText(currentUserData.role)}
            </Chip>
          </Card.Content>
        </AnimatedCard>

        {/* Stats Card */}
        <AnimatedCard
          mode="elevated"
          style={dynamicStyles.statsCard}
          entering={FadeIn.delay(300)}
        >
          <Card.Content>
            <View style={dynamicStyles.statsContainer}>
              <View style={dynamicStyles.statItem}>
                <Text variant="headlineSmall" style={dynamicStyles.statNumber}>
                  {followStats?.followersCount || 0}
                </Text>
                <Text variant="bodyMedium" style={dynamicStyles.statLabel}>
                  Последователи
                </Text>
              </View>

              <Divider style={dynamicStyles.statDivider} />

              <View style={dynamicStyles.statItem}>
                <Text variant="headlineSmall" style={dynamicStyles.statNumber}>
                  {followStats?.followingCount || 0}
                </Text>
                <Text variant="bodyMedium" style={dynamicStyles.statLabel}>
                  Следва
                </Text>
              </View>
            </View>
          </Card.Content>
        </AnimatedCard>

        {/* Action Buttons */}
        {!isOwnProfile && currentUser?.email && (
          <AnimatedCard
            mode="elevated"
            style={dynamicStyles.actionsCard}
            entering={FadeIn.delay(400)}
          >
            <Card.Content>
              <View style={dynamicStyles.actionButtons}>
                <Button
                  mode={followStatus?.isFollowing ? 'outlined' : 'contained'}
                  onPress={handleFollowToggle}
                  loading={followMutation.isPending || statusLoading}
                  disabled={statusLoading}
                  icon={
                    followStatus?.isFollowing ? 'account-minus' : 'account-plus'
                  }
                  style={dynamicStyles.followButton}
                >
                  {statusLoading
                    ? 'Зареждане...'
                    : followStatus?.isFollowing
                    ? 'Отпоследвай'
                    : 'Последвай'}
                </Button>

                <Button
                  mode="outlined"
                  onPress={handleSendMessage}
                  icon="chat"
                  style={dynamicStyles.messageButton}
                  contentStyle={dynamicStyles.messageButtonContent}
                >
                  Съобщение
                </Button>
              </View>
            </Card.Content>
          </AnimatedCard>
        )}

        {/* Information Card */}
        <AnimatedCard
          mode="elevated"
          style={dynamicStyles.infoCard}
          entering={FadeIn.delay(500)}
        >
          <Card.Title
            title="Информация"
            titleVariant="titleLarge"
            left={(props) => <Avatar.Icon {...props} icon="information" />}
          />
          <Card.Content>
            {/* Основен имейл */}
            <View style={dynamicStyles.infoItem}>
              <View style={dynamicStyles.infoItemContent}>
                <Ionicons
                  name="mail-outline"
                  size={24}
                  color={colors.onSurfaceVariant}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="labelMedium"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    Основен имейл
                  </Text>
                  <Text variant="bodyLarge" style={dynamicStyles.infoText}>
                    {currentUserData.email}
                  </Text>
                </View>
              </View>
            </View>

            <Divider />

            {/* Контактен имейл */}
            <View style={dynamicStyles.infoItem}>
              <View style={dynamicStyles.infoItemContent}>
                <Ionicons
                  name="mail"
                  size={24}
                  color={colors.onSurfaceVariant}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="labelMedium"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    Контактен имейл
                  </Text>
                  <Text variant="bodyLarge" style={dynamicStyles.infoText}>
                    {currentUserData.contact_email || 'не е зададен'}
                  </Text>
                </View>
              </View>
            </View>

            <Divider />

            {/* Контактен телефон */}
            <View style={dynamicStyles.infoItem}>
              <View style={dynamicStyles.infoItemContent}>
                <Ionicons
                  name="call-outline"
                  size={24}
                  color={colors.onSurfaceVariant}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="labelMedium"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    Контактен телефон
                  </Text>
                  <Text variant="bodyLarge" style={dynamicStyles.infoText}>
                    {currentUserData.contact_phone || 'не е зададен'}
                  </Text>
                </View>
              </View>
            </View>

            <Divider />

            {/* Роля в системата */}
            <View style={dynamicStyles.infoItem}>
              <View style={dynamicStyles.infoItemContent}>
                <Ionicons
                  name={getRoleIcon(currentUserData.role) as any} // ПОПРАВЕНО: TypeScript fix
                  size={24}
                  color={getRoleColor(currentUserData.role)}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="labelMedium"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    Роля в системата
                  </Text>
                  <Text
                    variant="bodyLarge"
                    style={[
                      dynamicStyles.infoText,
                      {
                        color: getRoleColor(currentUserData.role),
                        fontWeight: '600',
                      },
                    ]}
                  >
                    {getRoleDisplayText(currentUserData.role)}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </AnimatedCard>
      </ScrollView>
    </Surface>
  )
})

// Static styles - performance optimized
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
})

export default UserProfilePage
