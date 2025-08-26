import React, { useContext, useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { AuthContext } from '@/context/AuthContext'
import Colors from '@/data/Colors'
import Ionicons from '@expo/vector-icons/Ionicons'
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

export default function Profile() {
  const { user, setUser } = useContext(AuthContext)
  const router = useRouter()
  const [userDetails, setUserDetails] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const handleSettingsPress = () => {
    router.push('/settings')
  }

  const handleLogoutPress = () => {
    signOut(auth)
      .then(() => {
        setUser(null)
        router.replace('/landing')
      })
      .catch(() => {})
  }

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
        setUserDetails(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUserDetails()
  }, [user?.email])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.PRIMARY} size="large" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header row with settings and logout icons top right */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Профил</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <TouchableOpacity
            onPress={handleSettingsPress}
            style={{ marginRight: 8 }}
          >
            <Ionicons
              name="settings-outline"
              size={32}
              color={Colors.PRIMARY}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogoutPress}>
            <Ionicons name="log-out-outline" size={32} color={Colors.PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: userDetails?.image }}
          style={styles.profileImage}
        />
        <Text style={styles.userName}>{userDetails?.name}</Text>
        <Text
          style={[styles.userRole, { color: getRoleColor(userDetails?.role) }]}
        >
          {getRoleDisplayText(userDetails?.role)}
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

      {/* Additional Profile Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Информация</Text>
        <View style={styles.infoItem}>
          <Ionicons name="mail-outline" size={20} color={Colors.GRAY} />
          <Text style={styles.infoText}>{userDetails?.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="mail" size={20} color={Colors.GRAY} />
          <Text style={styles.infoText}>
            {userDetails?.contact_email || 'не е зададен'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="call-outline" size={20} color={Colors.GRAY} />
          <Text style={styles.infoText}>
            {userDetails?.contact_phone || 'не е зададен'}
          </Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: 'bold',
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
