import React from "react"
import { View, TouchableOpacity, Text, TextInput } from "react-native"
import AntDesign from "@expo/vector-icons/AntDesign"
import FontAwesome from "@expo/vector-icons/FontAwesome"
import Colors from "@/data/Colors"
import { styles } from "./styles"

interface PostActionsProps {
  isLiked: boolean
  likeCount: number
  commentCount: number
  commentsVisible: boolean
  onToggleLike: () => void
  onToggleComments: () => void
  commentText: string
  onCommentTextChange: (text: string) => void
  onSubmitComment: () => void
  user: any
}

export default function PostActions({
  isLiked,
  likeCount,
  commentCount,
  commentsVisible,
  onToggleLike,
  onToggleComments,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  user,
}: PostActionsProps) {
  return (
    <>
      {!commentsVisible && (
        <>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              onPress={onToggleLike}
              style={styles.subContainer}
            >
              <AntDesign
                name="like2"
                size={24}
                color={isLiked ? Colors.PRIMARY : "black"}
              />
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onToggleComments}
              style={styles.subContainer}
            >
              <FontAwesome name="commenting-o" size={24} color="black" />
              <Text style={styles.actionText}>{commentCount}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={onToggleComments}>
            <Text style={styles.commentsLink}>Виж всички коментари</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          value={commentText}
          onChangeText={onCommentTextChange}
          placeholder="Добавете коментар..."
          placeholderTextColor={Colors.GRAY}
        />
        <TouchableOpacity onPress={onSubmitComment} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Изпрати</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
