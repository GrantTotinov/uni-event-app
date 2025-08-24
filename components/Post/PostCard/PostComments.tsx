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
  Dimensions,
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

const REPLY_INDENT = 20
const SCREEN_WIDTH = Dimensions.get('window').width
const MAX_COMMENT_WIDTH = SCREEN_WIDTH - 40

// Default avatar for users without images
const DEFAULT_AVATAR = 'https://via.placeholder.com/36'

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

  // Get all comment IDs recursively for likes
  const getAllCommentIds = (
    commentsList: Comment[],
    repliesMap: { [key: number]: Comment[] }
  ): number[] => {
    const ids: number[] = []

    const addCommentAndReplies = (comment: Comment) => {
      ids.push(comment.id)
      const commentReplies = repliesMap[comment.id] || []
      commentReplies.forEach((reply) => addCommentAndReplies(reply))
    }

    commentsList.forEach((comment) => addCommentAndReplies(comment))
    return ids
  }

  const allCommentIds = useMemo(() => {
    return getAllCommentIds(comments, replies)
  }, [comments, replies])

  // Use comment likes hook with caching
  const {
    commentLikes,
    isLoading: likesLoading,
    toggleLike,
    isToggling,
  } = useCommentLikes(allCommentIds, user?.email, allCommentIds.length > 0)

  const clearCommentSearch = () => setCommentSearchQuery('')

  const getRoleDisplayText = (userRole: string | null | undefined): string => {
    switch (userRole) {
      case 'admin':
        return 'Админ'
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
      case 'admin':
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

  const handleCommentLike = async (commentId: number) => {
    if (!user?.email || isToggling) return

    const currentLike = commentLikes[commentId]
    if (!currentLike) return

    try {
      await toggleLike({
        commentId,
        isLiked: currentLike.isLiked,
      })
    } catch (error) {
      console.error('Error toggling comment like:', error)
    }
  }

  const getImageSource = (imageUrl: string | null | undefined) => {
    if (!imageUrl || imageUrl.trim() === '') {
      return { uri: DEFAULT_AVATAR }
    }
    return { uri: imageUrl }
  }

  const renderReplies = (
    parentId: number,
    level: number = 1,
    visited: Set<number> = new Set()
  ): React.ReactNode => {
    const childReplies = replies[parentId] || []
    if (!childReplies.length) return null

    return childReplies.map((reply: Comment) => {
      if (visited.has(reply.id)) {
        return null
      }
      const newVisited = new Set(visited)
      newVisited.add(reply.id)

      const replyLike = commentLikes[reply.id]
      const isExpanded = expandedComments.includes(reply.id)
      const replyMaxWidth = MAX_COMMENT_WIDTH - level * REPLY_INDENT

      return (
        <View key={reply.id} style={localStyles.replyContainer}>
          <Image
            source={getImageSource(reply.image)}
            style={localStyles.avatar}
          />
          <View
            style={[
              localStyles.commentContent,
              { maxWidth: replyMaxWidth - 50 },
            ]}
          >
            <View style={localStyles.commentBox}>
              <View style={localStyles.commentHeaderRow}>
                <View style={localStyles.nameAndRole}>
                  <Text style={localStyles.author}>{reply.name}</Text>
                  <Text
                    style={[
                      localStyles.roleText,
                      { color: getRoleColor(reply.user_role) },
                    ]}
                  >
                    {getRoleDisplayText(reply.user_role)}
                  </Text>
                </View>
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
                      size={16}
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
                <Text style={localStyles.commentText}>{reply.comment}</Text>
              )}
            </View>
            <View style={localStyles.actionRow}>
              <Text style={localStyles.dateText}>
                {reply.created_at_local
                  ? moment(reply.created_at_local).fromNow()
                  : moment(reply.created_at).fromNow()}
              </Text>
              <TouchableOpacity
                onPress={() => handleCommentLike(reply.id)}
                style={localStyles.actionButton}
                disabled={!replyLike || isToggling}
              >
                <AntDesign
                  name="like2"
                  size={12}
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
                <MaterialIcons name="reply" size={12} color={Colors.GRAY} />
                <Text style={localStyles.actionText}>Отговори</Text>
              </TouchableOpacity>
            </View>
            <View style={localStyles.likeCountRow}>
              <AntDesign
                name="heart"
                size={10}
                color={replyLike?.isLiked ? Colors.PRIMARY : Colors.GRAY}
              />
              <Text style={localStyles.likeCountText}>
                {replyLike?.count || 0}
              </Text>
            </View>
            {isExpanded && (
              <View style={localStyles.repliesContainer}>
                {renderReplies(reply.id, level + 1, newVisited)}
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
              </View>
            )}
            {selectedReplyMenu === reply.id && (
              <View style={localStyles.menuDropdown}>
                {user?.email === reply.user_email && (
                  <TouchableOpacity
                    onPress={() => {
                      onEditReply(reply.id, reply.comment)
                    }}
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
        {/* Search bar for comments */}
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
          ? displayComments.map((c: Comment) => {
              const commentLike = commentLikes[c.id]

              return (
                <View
                  key={c.id}
                  style={[
                    localStyles.commentContainer,
                    { maxWidth: MAX_COMMENT_WIDTH },
                  ]}
                >
                  <Image
                    source={getImageSource(c.image)}
                    style={localStyles.avatar}
                  />
                  <View
                    style={[
                      localStyles.commentContent,
                      { maxWidth: MAX_COMMENT_WIDTH - 50 },
                    ]}
                  >
                    <View style={localStyles.commentBox}>
                      <View style={localStyles.commentHeaderRow}>
                        <View style={localStyles.nameAndRole}>
                          <Text style={localStyles.author}>{c.name}</Text>
                          <Text
                            style={[
                              localStyles.roleText,
                              { color: getRoleColor(c.user_role) },
                            ]}
                          >
                            {getRoleDisplayText(c.user_role)}
                          </Text>
                        </View>
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
                              size={16}
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
                        <Text style={localStyles.commentText}>{c.comment}</Text>
                      )}
                    </View>
                    <View style={localStyles.actionRow}>
                      <Text style={localStyles.dateText}>
                        {c.created_at_local
                          ? moment(c.created_at_local).fromNow()
                          : moment(c.created_at).fromNow()}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleCommentLike(c.id)}
                        style={localStyles.actionButton}
                        disabled={!commentLike || isToggling}
                      >
                        <AntDesign
                          name="like2"
                          size={12}
                          color={
                            commentLike?.isLiked ? Colors.PRIMARY : Colors.GRAY
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
                          size={12}
                          color={Colors.GRAY}
                        />
                        <Text style={localStyles.actionText}>Отговори</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={localStyles.likeCountRow}>
                      <AntDesign
                        name="heart"
                        size={10}
                        color={
                          commentLike?.isLiked ? Colors.PRIMARY : Colors.GRAY
                        }
                      />
                      <Text style={localStyles.likeCountText}>
                        {commentLike?.count || 0}
                      </Text>
                    </View>
                    {expandedComments.includes(c.id) && (
                      <View style={localStyles.repliesContainer}>
                        {renderReplies(c.id)}
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
                      </View>
                    )}
                    {selectedCommentMenu === c.id && (
                      <View style={localStyles.menuDropdown}>
                        {user?.email === c.user_email && (
                          <TouchableOpacity
                            onPress={() => {
                              onEditComment(c.id, c.comment)
                            }}
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
              )
            })
          : !showLoading && (
              <Text style={baseStyles.noCommentsText}>
                {commentSearchQuery.trim()
                  ? `Няма намерени коментари за "${commentSearchQuery}"`
                  : 'Все още няма коментари.'}
              </Text>
            )}
      </View>
    </ScrollView>
  )
}

const localStyles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: Colors.WHITE,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    width: '100%',
    paddingLeft: REPLY_INDENT,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: Colors.LIGHT_GRAY,
  },
  smallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    backgroundColor: Colors.LIGHT_GRAY,
  },
  commentContent: {
    flex: 1,
    minWidth: 0,
  },
  commentBox: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 12,
    position: 'relative',
  },
  commentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nameAndRole: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  author: {
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.BLACK,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuButton: {
    padding: 4,
    marginLeft: 8,
  },
  commentText: {
    fontSize: 14,
    color: Colors.BLACK,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
    marginLeft: 46,
  },
  dateText: {
    fontSize: 12,
    color: Colors.GRAY,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  actionText: {
    fontSize: 12,
    color: Colors.GRAY,
  },
  likeCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 46,
  },
  likeCountText: {
    fontSize: 11,
    color: Colors.GRAY,
    marginLeft: 4,
  },
  repliesContainer: {
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: Colors.LIGHT_GRAY,
    paddingLeft: 12,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  replyInputWrapper: {
    flex: 1,
    minWidth: 0,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: Colors.BLACK,
    backgroundColor: Colors.WHITE,
    minHeight: 36,
  },
  replySubmitButton: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  replySubmitText: {
    color: Colors.WHITE,
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuDropdown: {
    position: 'absolute',
    top: 32,
    right: 8,
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
    minWidth: 120,
  },
  menuOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  menuOptionText: {
    fontSize: 14,
    color: Colors.BLACK,
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: Colors.BLACK,
    backgroundColor: Colors.WHITE,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: Colors.WHITE,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: Colors.LIGHT_GRAY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: Colors.BLACK,
    fontSize: 14,
  },
})
