// app/user-page/UserProfilePage.tsx
import React, { useContext, useCallback } from 'react'
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native'
import { AuthContext } from '@/context/AuthContext'
import {
  useUserFollowers,
  useFollowStatus,
  useFollowUser,
} from '@/hooks/useUserFollowers'
import Colors from '@/data/Colors'
import Button from '@/components/Shared/Button'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { createDirectChat } from '@/utils/chatUtils'

interface UserProfilePageProps {
  userEmail: string
  userName: string
  userImage: string
  userRole?: string
}

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
      return Colors.GRAY
    default:
      return Colors.GRAY
  }
}

export default function UserProfilePage({
  userEmail,
  userName,
  userImage,
  userRole,
}: UserProfilePageProps) {
  const { user: currentUser } = useContext(AuthContext)
  const router = useRouter()
  const isOwnProfile = currentUser?.email === userEmail

  const { data: followStats, isLoading: statsLoading } =
    useUserFollowers(userEmail)
  const { data: followStatus, isLoading: statusLoading } = useFollowStatus(
    currentUser?.email,
    userEmail
  )
  const followMutation = useFollowUser()

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
      const chatId = await createDirectChat({
        currentUser: {
          email: currentUser.email,
          name: currentUser.name,
          image: currentUser.image,
          uid: currentUser.uid,
        },
        targetUser: {
          email: userEmail,
          name: userName,
          image: userImage,
        },
      })

      // Navigate to the chat room
      router.push(`/chat/${chatId}`)
    } catch (error) {
      console.error('Error creating/finding chat:', error)
      Alert.alert('Грешка', 'Неуспешно създаване на чат')
    }
  }, [currentUser, userEmail, userName, userImage, router])

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image source={{ uri: userImage }} style={styles.profileImage} />
        <Text style={styles.userName}>{userName}</Text>
        <Text style={[styles.userRole, { color: getRoleColor(userRole) }]}>
          {getRoleDisplayText(userRole)}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {followStats?.followersCount || 0}
          </Text>
          <Text style={styles.statLabel}>Последователи</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {followStats?.followingCount || 0}
          </Text>
          <Text style={styles.statLabel}>Следва</Text>
        </View>
      </View>

      {/* Action Buttons */}
      {!isOwnProfile && currentUser?.email && (
        <View style={styles.actionContainer}>
          <View style={styles.buttonRow}>
            <View style={styles.buttonFlex}>
              <Button
                text={
                  statusLoading
                    ? 'Зареждане...'
                    : followStatus?.isFollowing
                    ? 'Отпоследвай'
                    : 'Последвай'
                }
                onPress={handleFollowToggle}
                loading={followMutation.isPending}
                outline={followStatus?.isFollowing}
                disabled={statusLoading}
              />
            </View>
            <View style={styles.buttonFlex}>
              <TouchableOpacity
                onPress={handleSendMessage}
                style={styles.messageButton}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="chatbubble-outline"
                  size={20}
                  color={Colors.PRIMARY}
                />
                <Text style={styles.messageButtonText}>Съобщение</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Additional Profile Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Информация</Text>
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color={Colors.GRAY} />
          <Text style={styles.infoText}>{userEmail}</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.BLACK,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.GRAY,
    marginTop: 4,
  },
  actionContainer: {
    padding: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonFlex: {
    flex: 1,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WHITE,
    borderWidth: 1.5,
    borderColor: Colors.PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  messageButtonText: {
    color: Colors.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.BLACK,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoText: {
    fontSize: 16,
    color: Colors.BLACK,
    marginLeft: 12,
  },
})
