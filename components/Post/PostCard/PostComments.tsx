import React from "react"
import { View, Text, TouchableOpacity, TextInput } from "react-native"
import moment from "moment-timezone"
import { MaterialIcons } from "@expo/vector-icons"
import Colors from "@/data/Colors"
import { isAdmin } from "@/context/AuthContext"
import { styles } from "./styles"

interface PostCommentsProps {
  comments: any[]
  replies: { [key: number]: any[] }
  expandedComments: number[]
  replyTexts: { [key: number]: string }
  selectedCommentMenu: number | null
  selectedReplyMenu: number | null
  editingCommentId: number | null
  editingReplyId: number | null
  editedCommentText: string
  editedReplyText: string
  user: any
  post: any
  onToggleReplies: (commentId: number) => void
  onSubmitReply: (parentId: number) => void
  onUpdateReplyText: (commentId: number, text: string) => void
  onToggleCommentMenu: (commentId: number | null) => void
  onToggleReplyMenu: (replyId: number | null) => void
  onEditComment: (commentId: number, text: string) => void
  onEditReply: (replyId: number, text: string) => void
  onSaveEditedComment: () => void
  onSaveEditedReply: () => void
  onDeleteComment: (commentId: number) => void
  onDeleteReply: (replyId: number, parentId: number) => void
}

export default function PostComments({
  comments,
  replies,
  expandedComments,
  replyTexts,
  selectedCommentMenu,
  selectedReplyMenu,
  editingCommentId,
  editingReplyId,
  editedCommentText,
  editedReplyText,
  user,
  post,
  onToggleReplies,
  onSubmitReply,
  onUpdateReplyText,
  onToggleCommentMenu,
  onToggleReplyMenu,
  onEditComment,
  onEditReply,
  onSaveEditedComment,
  onSaveEditedReply,
  onDeleteComment,
  onDeleteReply,
}: PostCommentsProps) {
  return (
    <View style={styles.commentsContainer}>
      {(selectedCommentMenu !== null || selectedReplyMenu !== null) && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => {
            onToggleCommentMenu(null)
            onToggleReplyMenu(null)
          }}
        />
      )}
      {comments.length > 0 ? (
        comments.map((c) => (
          <View key={c.id} style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{c.name}</Text>
              {(user?.email === c.user_email ||
                isAdmin(user?.role) ||
                user?.email === post.createdby) && (
                <TouchableOpacity
                  onPress={() => onToggleCommentMenu(c.id)}
                  style={styles.commentMenuIcon}
                >
                  <MaterialIcons
                    name="more-vert"
                    size={20}
                    color={Colors.GRAY}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Comment menu */}
            {selectedCommentMenu === c.id && (
              <View style={styles.commentMenu}>
                {user?.email === c.user_email && (
                  <TouchableOpacity
                    onPress={() => {
                      onEditComment(c.id, c.comment)
                      onToggleCommentMenu(null)
                    }}
                    style={styles.menuOption}
                  >
                    <Text style={styles.menuOptionText}>Редактирай</Text>
                  </TouchableOpacity>
                )}
                {(isAdmin(user?.role) ||
                  user?.email === c.user_email ||
                  user?.email === post.createdby) && (
                  <TouchableOpacity
                    onPress={() => {
                      onDeleteComment(c.id)
                      onToggleCommentMenu(null)
                    }}
                    style={styles.menuOption}
                  >
                    <Text style={[styles.menuOptionText, { color: "red" }]}>
                      Изтрий
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {editingCommentId === c.id ? (
              <>
                <TextInput
                  style={styles.commentInput}
                  value={editedCommentText}
                  onChangeText={(text) => onEditComment(c.id, text)}
                  placeholder="Редактирайте коментара..."
                />
                <View style={styles.editButtons}>
                  <TouchableOpacity onPress={onSaveEditedComment}>
                    <Text style={{ color: Colors.PRIMARY, fontWeight: "bold" }}>
                      Запази
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onEditComment(0, "")}>
                    <Text style={{ color: "red", fontWeight: "bold" }}>
                      Откажи
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.commentText}>{c.comment}</Text>
                <Text style={styles.commentDate}>
                  {c.created_at_local
                    ? moment(c.created_at_local).fromNow()
                    : moment(c.created_at).fromNow()}
                </Text>

                {/* Show/hide replies button */}
                <TouchableOpacity onPress={() => onToggleReplies(c.id)}>
                  <Text style={styles.replyButton}>
                    {expandedComments.includes(c.id)
                      ? "Скрий отговорите"
                      : "Покажи отговорите"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Replies section */}
            {expandedComments.includes(c.id) && (
              <View style={styles.repliesContainer}>
                {/* Show existing replies */}
                {replies[c.id]?.map((reply) => (
                  <View key={reply.id} style={styles.replyItem}>
                    {/* Reply content and actions */}
                    <Text style={styles.replyText}>{reply.comment}</Text>
                    <Text style={styles.commentDate}>
                      {reply.created_at_local
                        ? moment(reply.created_at_local).fromNow()
                        : moment(reply.created_at).fromNow()}
                    </Text>
                  </View>
                ))}

                {/* Reply input */}
                <View style={styles.replyInputContainer}>
                  <TextInput
                    style={styles.replyInput}
                    value={replyTexts[c.id] || ""}
                    onChangeText={(text) => onUpdateReplyText(c.id, text)}
                    placeholder="Отговорете на този коментар..."
                    placeholderTextColor={Colors.GRAY}
                  />
                  <TouchableOpacity
                    onPress={() => onSubmitReply(c.id)}
                    style={styles.replySubmitButton}
                  >
                    <Text style={styles.replySubmitButtonText}>Отговори</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noCommentsText}>Все още няма коментари.</Text>
      )}
    </View>
  )
}
