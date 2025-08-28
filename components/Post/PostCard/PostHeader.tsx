import React from 'react'
import { View, TouchableOpacity, Text } from 'react-native'
import UserAvatar from '../UserAvatar'
import { isSystemAdmin } from '@/context/AuthContext'
import { styles } from './styles'

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
  const canShowMenu =
    isSystemAdmin(user?.role) ||
    user?.email === post.createdby ||
    user?.email === post.group_creator_email

  return (
    <View style={styles.headerContainer}>
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
        <UserAvatar
          name={post?.name}
          image={post?.image}
          date={post?.createdon}
          localDate={post?.createdon_local}
          role={post?.role}
          isUhtRelated={post?.is_uht_related}
          email={post?.createdby}
        />
        {canShowMenu && (
          <TouchableOpacity onPress={onShowMenu} style={{ padding: 8 }}>
            <Text style={{ fontSize: 22 }}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
