import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native'
import moment from 'moment-timezone'
import { MaterialIcons, Ionicons, AntDesign } from '@expo/vector-icons'
import Colors from '@/data/Colors'
import { isAdmin } from '@/context/AuthContext'
import { useCommentLikes } from '@/hooks/useComments'
import { styles as baseStyles } from './styles'

interface Comment {
  id: number
  name: string
  comment: string
  image: string
  user_email: string
  created_at: string
  created_at_local?: string
  parent_id?: number | null
  user_role?: string
}

interface PostCommentsProps {
  post: any
  user: any
  comments: Comment[]
  replies: { [key: number]: Comment[] }
  expandedComments: number[]
  replyTexts: { [key: number]: string }
  selectedCommentMenu: number | null
  selectedReplyMenu: number | null
  editingCommentId: number | null
  editingReplyId: number | null
  editedCommentText: string
  editedReplyText: string
  onToggleReplies: (commentId: number) => void
  onSubmitReply: (parentId: number) => void
  onUpdateReplyText: (commentId: number, text: string) => void
  onToggleCommentMenu: (commentId: number | null) => void
  onToggleReplyMenu: (replyId: number | null) => void
  onEditComment: (commentId: number, text: string) => void
  onEditReply: (replyId: number, text: string) => void
  onUpdateEditedCommentText: (text: string) => void
  onUpdateEditedReplyText: (text: string) => void
  onSaveEditedComment: () => void
  onSaveEditedReply: () => void
  onDeleteComment: (commentId: number) => void
  onDeleteReply: (replyId: number) => void
}

export default function PostComments({
  post,
  user,
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
  onToggleReplies,
  onSubmitReply,
  onUpdateReplyText,
  onToggleCommentMenu,
  onToggleReplyMenu,
  onEditComment,
  onEditReply,
  onUpdateEditedCommentText,
  onUpdateEditedReplyText,
  onSaveEditedComment,
  onSaveEditedReply,
  onDeleteComment,
  onDeleteReply,
}: PostCommentsProps) {
  const [commentSearchQuery, setCommentSearchQuery] = useState<string>('')

  // --- Likes logic ---
  const getAllCommentIds = (
    commentsList: Comment[],
    repliesMap: { [key: number]: Comment[] }
  ): number[] => {
    const ids: number[] = []
    const addCommentAndReplies = (comment: Comment) => {
      ids.push(comment.id)
      const commentReplies = repliesMap[comment.id] || []
      commentReplies.forEach(addCommentAndReplies)
    }
    commentsList.forEach(addCommentAndReplies)
    return ids
  }

  const allCommentIds = useMemo(
    () => getAllCommentIds(comments, replies),
    [comments, replies]
  )
  const {
    commentLikes,
    isLoading: likesLoading,
    toggleLike,
    isToggling,
  } = useCommentLikes(allCommentIds, user?.email, allCommentIds.length > 0)

  // --- Helpers ---
  const clearCommentSearch = () => setCommentSearchQuery('')
  const getRoleDisplayText = (userRole?: string | null) => {
    switch (userRole) {
      case 'admin':
        return 'Админ'
      case 'teacher':
        return 'Преподавател'
      case 'user':
      case 'student':
      default:
        return 'Студент'
    }
  }
  const getRoleColor = (userRole?: string | null) => {
    switch (userRole) {
      case 'admin':
        return '#dc3545'
      case 'teacher':
        return '#007bff'
      case 'user':
      case 'student':
      default:
        return Colors.GRAY
    }
  }
  const handleCommentLike = async (commentId: number) => {
    if (!user?.email || isToggling) return
    const currentLike = commentLikes[commentId]
    if (!currentLike) return
    try {
      await toggleLike({ commentId, isLiked: currentLike.isLiked })
    } catch (error) {
      console.error('Error toggling comment like:', error)
    }
  }
  const getImageSource = (imageUrl?: string | null) => {
    if (!imageUrl || imageUrl.trim() === '')
      return { uri: 'https://via.placeholder.com/36' }
    return { uri: imageUrl }
  }

  // --- Render all replies under a comment (flattened, not recursive) ---
  const renderAllReplies = (parentId: number): React.ReactNode => {
    const allReplies = replies[parentId] || []
    if (!allReplies.length) return null

    // Collect all nested replies in a flat array
    const collectAllReplies = (
      commentId: number,
      collected: Comment[] = []
    ): Comment[] => {
      const directReplies = replies[commentId] || []
      directReplies.forEach((reply) => {
        collected.push(reply)
        // Recursively collect replies to this reply
        collectAllReplies(reply.id, collected)
      })
      return collected
    }

    const flattenedReplies = collectAllReplies(parentId)

    return flattenedReplies.map((reply) => {
      const replyLike = commentLikes[reply.id]
      const isExpanded = expandedComments.includes(reply.id)

      return (
        <View key={reply.id} style={localStyles.replyItem}>
          <Image
            source={getImageSource(reply.image)}
            style={localStyles.replyAvatar}
          />
          <View style={localStyles.replyMain}>
            <View style={localStyles.headerRow}>
              <Text style={localStyles.replyAuthor}>{reply.name}</Text>
              <Text
                style={[
                  localStyles.replyRole,
                  { color: getRoleColor(reply.user_role) },
                ]}
              >
                {getRoleDisplayText(reply.user_role)}
              </Text>
              {(user?.email === reply.user_email ||
                isAdmin(user?.role) ||
                user?.email === post.createdby) && (
                <TouchableOpacity
                  onPress={() =>
                    onToggleReplyMenu(
                      selectedReplyMenu === reply.id ? null : reply.id
                    )
                  }
                  style={localStyles.menuButton}
                >
                  <MaterialIcons
                    name="more-vert"
                    size={18}
                    color={Colors.GRAY}
                  />
                </TouchableOpacity>
              )}
            </View>

            {editingReplyId === reply.id ? (
              <View style={localStyles.editContainer}>
                <TextInput
                  style={localStyles.editInput}
                  value={editedReplyText}
                  onChangeText={onUpdateEditedReplyText}
                  placeholder="Редактирайте отговора..."
                  multiline
                  autoFocus
                />
                <View style={localStyles.editButtons}>
                  <TouchableOpacity
                    onPress={onSaveEditedReply}
                    style={localStyles.saveButton}
                  >
                    <Text style={localStyles.saveButtonText}>Запази</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      onUpdateEditedReplyText('')
                      onToggleReplyMenu(null)
                    }}
                    style={localStyles.cancelButton}
                  >
                    <Text style={localStyles.cancelButtonText}>Откажи</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <Text style={localStyles.replyText}>{reply.comment}</Text>
                <Text style={localStyles.timeBelow}>
                  {reply.created_at_local
                    ? moment(reply.created_at_local).fromNow()
                    : moment(reply.created_at).fromNow()}
                </Text>
              </>
            )}

            <View style={localStyles.actionRow}>
              <TouchableOpacity
                onPress={() => handleCommentLike(reply.id)}
                style={localStyles.actionButton}
                disabled={!replyLike || isToggling}
              >
                <AntDesign
                  name="like2"
                  size={13}
                  color={replyLike?.isLiked ? Colors.PRIMARY : Colors.GRAY}
                />
                <Text
                  style={[
                    localStyles.actionText,
                    {
                      color: replyLike?.isLiked ? Colors.PRIMARY : Colors.GRAY,
                    },
                  ]}
                >
                  {replyLike?.isLiked ? 'Харесано' : 'Харесай'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onToggleReplies(reply.id)}
                style={localStyles.actionButton}
              >
                <MaterialIcons name="reply" size={13} color={Colors.GRAY} />
                <Text style={localStyles.actionText}>Отговори</Text>
              </TouchableOpacity>
              <AntDesign
                name="heart"
                size={11}
                color={replyLike?.isLiked ? Colors.PRIMARY : Colors.GRAY}
                style={{ marginLeft: 10 }}
              />
              <Text style={localStyles.likeCountText}>
                {replyLike?.count || 0}
              </Text>
            </View>

            {isExpanded && (
              <View style={localStyles.replyInputContainer}>
                <Image
                  source={getImageSource(user?.image)}
                  style={localStyles.smallAvatar}
                />
                <View style={localStyles.replyInputWrapper}>
                  <TextInput
                    style={localStyles.replyInput}
                    value={replyTexts[reply.id] || ''}
                    onChangeText={(text) => onUpdateReplyText(reply.id, text)}
                    placeholder="Отговорете на този коментар..."
                    placeholderTextColor={Colors.GRAY}
                  />
                  <TouchableOpacity
                    onPress={() => onSubmitReply(reply.id)}
                    style={localStyles.replySubmitButton}
                  >
                    <Text style={localStyles.replySubmitText}>Отговори</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {selectedReplyMenu === reply.id && (
              <View style={localStyles.menuDropdown}>
                {user?.email === reply.user_email && (
                  <TouchableOpacity
                    onPress={() => onEditReply(reply.id, reply.comment)}
                    style={localStyles.menuOption}
                  >
                    <Text style={localStyles.menuOptionText}>Редактирай</Text>
                  </TouchableOpacity>
                )}
                {(isAdmin(user?.role) ||
                  user?.email === reply.user_email ||
                  user?.email === post.createdby) && (
                  <TouchableOpacity
                    onPress={() => {
                      onDeleteReply(reply.id)
                      onToggleReplyMenu(null)
                    }}
                    style={localStyles.menuOption}
                  >
                    <Text
                      style={[localStyles.menuOptionText, { color: 'red' }]}
                    >
                      Изтрий
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      )
    })
  }

  const displayComments = comments
  const showLoading = likesLoading

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={localStyles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View>
        {/* Search Bar */}
        <View style={baseStyles.searchContainer}>
          <Ionicons
            name="search"
            size={16}
            color={Colors.GRAY}
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Търси в коментарите..."
            value={commentSearchQuery}
            onChangeText={setCommentSearchQuery}
            style={baseStyles.searchInput}
            placeholderTextColor={Colors.GRAY}
          />
          {commentSearchQuery.length > 0 && (
            <TouchableOpacity onPress={clearCommentSearch}>
              <Ionicons name="close" size={16} color={Colors.GRAY} />
            </TouchableOpacity>
          )}
        </View>

        {commentSearchQuery.trim() && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ color: Colors.GRAY, fontSize: 14 }}>
              {showLoading
                ? 'Търсене в коментарите...'
                : `Намерени ${displayComments.length} коментар(а) за "${commentSearchQuery}"`}
            </Text>
          </View>
        )}

        {showLoading && (
          <View style={baseStyles.loadingContainer}>
            <ActivityIndicator color={Colors.PRIMARY} size="small" />
            <Text
              style={{ marginTop: 8, color: Colors.GRAY, textAlign: 'center' }}
            >
              {commentSearchQuery.trim()
                ? 'Търсене в коментарите...'
                : 'Зареждане...'}
            </Text>
          </View>
        )}

        {displayComments.length > 0
          ? displayComments.map((c) => {
              const commentLike = commentLikes[c.id]
              const isExpanded = expandedComments.includes(c.id)
              const hasReplies = replies[c.id] && replies[c.id].length > 0

              return (
                <View key={c.id} style={localStyles.parentCommentContainer}>
                  {/* Parent Comment */}
                  <View style={localStyles.commentRow}>
                    <Image
                      source={getImageSource(c.image)}
                      style={localStyles.avatar}
                    />
                    <View style={localStyles.commentMain}>
                      <View style={localStyles.headerRow}>
                        <Text style={localStyles.author}>{c.name}</Text>
                        <Text
                          style={[
                            localStyles.role,
                            { color: getRoleColor(c.user_role) },
                          ]}
                        >
                          {getRoleDisplayText(c.user_role)}
                        </Text>
                        {(user?.email === c.user_email ||
                          isAdmin(user?.role) ||
                          user?.email === post.createdby) && (
                          <TouchableOpacity
                            onPress={() =>
                              onToggleCommentMenu(
                                selectedCommentMenu === c.id ? null : c.id
                              )
                            }
                            style={localStyles.menuButton}
                          >
                            <MaterialIcons
                              name="more-vert"
                              size={18}
                              color={Colors.GRAY}
                            />
                          </TouchableOpacity>
                        )}
                      </View>

                      {editingCommentId === c.id ? (
                        <View style={localStyles.editContainer}>
                          <TextInput
                            style={localStyles.editInput}
                            value={editedCommentText}
                            onChangeText={onUpdateEditedCommentText}
                            placeholder="Редактирайте коментара..."
                            multiline
                            autoFocus
                          />
                          <View style={localStyles.editButtons}>
                            <TouchableOpacity
                              onPress={onSaveEditedComment}
                              style={localStyles.saveButton}
                            >
                              <Text style={localStyles.saveButtonText}>
                                Запази
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                onUpdateEditedCommentText('')
                                onToggleCommentMenu(null)
                              }}
                              style={localStyles.cancelButton}
                            >
                              <Text style={localStyles.cancelButtonText}>
                                Откажи
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          <Text style={localStyles.commentText}>
                            {c.comment}
                          </Text>
                          <Text style={localStyles.timeBelow}>
                            {c.created_at_local
                              ? moment(c.created_at_local).fromNow()
                              : moment(c.created_at).fromNow()}
                          </Text>
                        </>
                      )}

                      <View style={localStyles.actionRow}>
                        <TouchableOpacity
                          onPress={() => handleCommentLike(c.id)}
                          style={localStyles.actionButton}
                          disabled={!commentLike || isToggling}
                        >
                          <AntDesign
                            name="like2"
                            size={13}
                            color={
                              commentLike?.isLiked
                                ? Colors.PRIMARY
                                : Colors.GRAY
                            }
                          />
                          <Text
                            style={[
                              localStyles.actionText,
                              {
                                color: commentLike?.isLiked
                                  ? Colors.PRIMARY
                                  : Colors.GRAY,
                              },
                            ]}
                          >
                            {commentLike?.isLiked ? 'Харесано' : 'Харесай'}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => onToggleReplies(c.id)}
                          style={localStyles.actionButton}
                        >
                          <MaterialIcons
                            name="reply"
                            size={13}
                            color={Colors.GRAY}
                          />
                          <Text style={localStyles.actionText}>Отговори</Text>
                        </TouchableOpacity>
                        <AntDesign
                          name="heart"
                          size={11}
                          color={
                            commentLike?.isLiked ? Colors.PRIMARY : Colors.GRAY
                          }
                          style={{ marginLeft: 10 }}
                        />
                        <Text style={localStyles.likeCountText}>
                          {commentLike?.count || 0}
                        </Text>
                      </View>

                      {isExpanded && (
                        <View style={localStyles.replyInputContainer}>
                          <Image
                            source={getImageSource(user?.image)}
                            style={localStyles.smallAvatar}
                          />
                          <View style={localStyles.replyInputWrapper}>
                            <TextInput
                              style={localStyles.replyInput}
                              value={replyTexts[c.id] || ''}
                              onChangeText={(text) =>
                                onUpdateReplyText(c.id, text)
                              }
                              placeholder="Отговорете на този коментар..."
                              placeholderTextColor={Colors.GRAY}
                            />
                            <TouchableOpacity
                              onPress={() => onSubmitReply(c.id)}
                              style={localStyles.replySubmitButton}
                            >
                              <Text style={localStyles.replySubmitText}>
                                Отговори
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {selectedCommentMenu === c.id && (
                        <View style={localStyles.menuDropdown}>
                          {user?.email === c.user_email && (
                            <TouchableOpacity
                              onPress={() => onEditComment(c.id, c.comment)}
                              style={localStyles.menuOption}
                            >
                              <Text style={localStyles.menuOptionText}>
                                Редактирай
                              </Text>
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
                              style={localStyles.menuOption}
                            >
                              <Text
                                style={[
                                  localStyles.menuOptionText,
                                  { color: 'red' },
                                ]}
                              >
                                Изтрий
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  </View>

                  {/* All Replies Container - Only if there are replies */}
                  {hasReplies && (
                    <View style={localStyles.repliesContainer}>
                      {renderAllReplies(c.id)}
                    </View>
                  )}
                </View>
              )
            })
          : !showLoading && (
              <View style={baseStyles.emptyContainer}>
                <Text style={{ color: Colors.GRAY }}>
                  Все още няма коментари
                </Text>
              </View>
            )}
      </View>
    </ScrollView>
  )
}

const localStyles = StyleSheet.create({
  scrollContent: { paddingBottom: 20 },

  // Parent comment container
  parentCommentContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
    paddingBottom: 16,
  },

  // Parent comment styles
  commentRow: {
    flexDirection: 'row',
    padding: 10,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentMain: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  author: { fontWeight: 'bold', fontSize: 14, marginRight: 4 },
  role: { fontSize: 12, marginRight: 4 },
  menuButton: { padding: 4 },
  commentText: { fontSize: 14, marginBottom: 2 },
  timeBelow: { fontSize: 11, color: Colors.GRAY },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  actionText: { fontSize: 12, marginLeft: 2 },
  likeCountText: { fontSize: 11, marginLeft: 4, color: Colors.GRAY },

  // Replies container - indented from parent
  repliesContainer: {
    marginLeft: 46, // Indent all replies
    borderLeftWidth: 2,
    borderLeftColor: Colors.LIGHT_GRAY,
    paddingLeft: 10,
    marginTop: 8,
  },

  // Individual reply styles
  replyItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 8,
  },
  replyAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  replyMain: { flex: 1 },
  replyAuthor: { fontWeight: 'bold', fontSize: 13, marginRight: 4 },
  replyRole: { fontSize: 11, marginRight: 4 },
  replyText: { fontSize: 13, marginBottom: 2 },

  // Reply input
  replyInputContainer: { flexDirection: 'row', marginTop: 8 },
  replyInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  replySubmitButton: {
    marginLeft: 8,
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  replySubmitText: { color: Colors.WHITE, fontSize: 12 },
  smallAvatar: { width: 24, height: 24, borderRadius: 12, marginRight: 8 },

  // Edit styles
  editContainer: { marginVertical: 4 },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 4,
    padding: 6,
    fontSize: 12,
    minHeight: 36,
  },
  editButtons: { flexDirection: 'row', marginTop: 4 },
  saveButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 4,
    marginRight: 4,
  },
  saveButtonText: { color: Colors.WHITE, fontSize: 12 },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 4,
  },
  cancelButtonText: { color: Colors.GRAY, fontSize: 12 },

  // Menu styles
  menuDropdown: {
    position: 'absolute',
    top: 20,
    right: 0,
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 4,
    zIndex: 10,
  },
  menuOption: { paddingHorizontal: 8, paddingVertical: 6 },
  menuOptionText: { fontSize: 12 },
})
