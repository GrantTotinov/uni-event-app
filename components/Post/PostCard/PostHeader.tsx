import React from "react"
import { View, TouchableOpacity, Text } from "react-native"
import UserAvatar from "../UserAvatar"
import { isAdmin } from "@/context/AuthContext"

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
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <UserAvatar
        name={post?.name}
        image={post?.image}
        date={post?.createdon}
        localDate={post?.createdon_local}
        role={post?.role}
        isUhtRelated={post?.is_uht_related}
      />
      {(isAdmin(user?.role) || user?.email === post.createdby) && (
        <TouchableOpacity onPress={onShowMenu} style={{ padding: 8 }}>
          <Text style={{ fontSize: 22 }}>⋮</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
