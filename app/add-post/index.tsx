import { View, Text } from 'react-native'
import React, { useContext } from 'react'
import UserAvatar from '@/components/Post/UserAvatar'
import { AuthContext } from '@/context/AuthContext'
import WritePost from '@/components/Post/WritePost'

export default function AddPost() {
  const { user } = useContext(AuthContext)

  // Ensure user exists and has required properties
  if (!user?.name || !user?.image) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <View
      style={{
        padding: 20,
      }}
    >
      <UserAvatar
        name={user.name}
        image={user.image}
        date="Now"
        role={user.role}
      />
      <WritePost />
    </View>
  )
}
