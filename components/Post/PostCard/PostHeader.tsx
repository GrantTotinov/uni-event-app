import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import UserAvatar from '../UserAvatar'
import { isSystemAdmin } from '@/context/AuthContext'
import { styles } from './styles'
import { Text } from 'react-native-paper'

interface PostHeaderProps {
  post: any
  user: any
  canDelete: boolean
  onShowMenu: () => void
}

export default function PostHeader({
  post,
  user,
  canDelete,
  onShowMenu,
}: PostHeaderProps) {
  // ПОПРАВЕНО: Винаги показваме менюто за потребители с права
  const canShowMenu = Boolean(
    user?.email &&
      (isSystemAdmin(user?.role) || // Системен админ
        user?.email === post.createdby) // Автор на поста
  )

  console.log('PostHeader Debug:', {
    userEmail: user?.email,
    postCreatedBy: post.createdby,
    userRole: user?.role,
    isSystemAdmin: isSystemAdmin(user?.role),
    canShowMenu,
    clubName: post.club_name,
  })

  return (
    <View style={styles.headerContainer}>
      {/* Показваме име на група ако постът е в група */}
      {post.club_name && (
        <Text
          style={{
            fontSize: 13,
            color: '#007bff',
            fontWeight: 'bold',
            marginBottom: 2,
            marginLeft: 2,
          }}
        >
          {post.club_name}
        </Text>
      )}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <UserAvatar
            name={post?.name}
            image={post?.image}
            date={post?.createdon}
            localDate={post?.createdon_local}
            role={post?.role}
            isUhtRelated={post?.is_uht_related}
            email={post?.createdby}
          />
        </View>

        {/* ПОПРАВЕНО: Показваме менюто винаги когато потребителят има права */}
        {canShowMenu && (
          <TouchableOpacity
            onPress={onShowMenu}
            style={{
              padding: 12,
              marginLeft: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.05)', // Лек фон за видимост
              borderRadius: 20,
              minWidth: 40,
              minHeight: 40,
            }}
            accessibilityLabel="Меню за редакция/изтриване"
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="more-vert" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
