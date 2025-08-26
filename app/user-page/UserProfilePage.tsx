import React, { useContext } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AuthContext } from '@/context/AuthContext'
import {
  useUserFollowers,
  useFollowStatus,
  useFollowUser,
} from '@/hooks/useUserFollowers'
import Button from '@/components/Shared/Button'
import Colors from '@/data/Colors'

interface UserProfilePageProps {
  userEmail: string
  userName: string
  userImage: string
  userRole?: string
}

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

const getRoleColor = (userRole?: string): string => {
  switch (userRole) {
    case 'systemadmin':
      return '#dc3545'
    case 'teacher':
      return '#007bff'
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
  const isOwnProfile = currentUser?.email === userEmail

  const { data: followStats, isLoading: statsLoading } =
    useUserFollowers(userEmail)
  const { data: followStatus, isLoading: statusLoading } = useFollowStatus(
    currentUser?.email,
    userEmail
  )
  const followMutation = useFollowUser()

  const handleFollowToggle = async () => {
    if (!currentUser?.email || !followStatus) return

    try {
      await followMutation.mutateAsync({
        followerEmail: currentUser.email,
        followingEmail: userEmail,
        isFollowing: followStatus.isFollowing,
      })
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

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

      {/* Follow Button */}
      {!isOwnProfile && currentUser?.email && (
        <View style={styles.actionContainer}>
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
