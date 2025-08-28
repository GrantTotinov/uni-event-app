import React, { useState, useMemo, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import moment from 'moment-timezone'
import { MaterialIcons, Ionicons } from '@expo/vector-icons'
import Colors from '@/data/Colors'
import { isSystemAdmin } from '@/context/AuthContext'
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
  onSubmitReply: (commentText: string, parentId?: number) => Promise<void>
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

const PostComments: React.FC<PostCommentsProps> = ({
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
}) => {
  const [commentSearchQuery, setCommentSearchQuery] = useState<string>('')
  const [mainCommentText, setMainCommentText] = useState<string>('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(
    null
  )
  const [replyingToName, setReplyingToName] = useState<string>('')

  const submissionTimeoutRef = useRef<NodeJS.Timeout>()

  // Likes logic
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

  // Helpers
  const clearCommentSearch = () => setCommentSearchQuery('')
  const getRoleDisplayText = (userRole?: string | null) => {
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
  const getRoleColor = (userRole?: string | null) => {
    switch (userRole) {
      case 'systemadmin':
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

    try {
      // Ако няма запис за лайка, той е false (не е харесан)
      const isCurrentlyLiked = commentLikes[commentId]?.isLiked ?? false

      await toggleLike({ commentId, isLiked: isCurrentlyLiked })
    } catch (error) {
      console.error('Error toggling comment like:', error)
    }
  }

  const getImageSource = (imageUrl?: string | null) => {
    if (!imageUrl || imageUrl.trim() === '')
      return { uri: 'https://via.placeholder.com/36' }
    return { uri: imageUrl }
  }

  // Handle reply setup
  const handleReplyToComment = (commentId: number, authorName: string) => {
    setReplyingToCommentId(commentId)
    setReplyingToName(authorName)
    setMainCommentText(`@${authorName} `)
  }

  const handleClearReply = () => {
    setReplyingToCommentId(null)
    setReplyingToName('')
    setMainCommentText('')
  }

  // Optimized comment submission with debouncing
  const handleSubmitMainComment = async () => {
    if (!mainCommentText.trim() || !user || isSubmittingComment) return

    if (submissionTimeoutRef.current) {
      clearTimeout(submissionTimeoutRef.current)
    }

    setIsSubmittingComment(true)

    try {
      if (replyingToCommentId) {
        // It's a reply
        await onSubmitReply(mainCommentText, replyingToCommentId)
      } else {
        // It's a main comment - pass undefined for parentId
        await onSubmitReply(mainCommentText, undefined)
      }

      setMainCommentText('')
      handleClearReply()
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      submissionTimeoutRef.current = setTimeout(() => {
        setIsSubmittingComment(false)
      }, 1000)
    }
  }

  // Filter parent comments for display
  const parentComments = useMemo(
    () => comments.filter((c) => !c.parent_id),
    [comments]
  )

  // Count all nested replies for a comment
  const countAllReplies = (commentId: number): number => {
    let count = 0
    const directReplies = replies[commentId] || []
    count += directReplies.length
    directReplies.forEach((reply) => {
      count += countAllReplies(reply.id)
    })
    return count
  }

  // Render all replies under a comment (flattened)
  const renderAllReplies = (parentId: number): React.ReactNode => {
    const allReplies = replies[parentId] || []
    if (!allReplies.length) return null

    const collectAllReplies = (
      commentId: number,
      collected: Comment[] = []
    ): Comment[] => {
      const directReplies = replies[commentId] || []
      directReplies.forEach((reply) => {
        collected.push(reply)
        collectAllReplies(reply.id, collected)
      })
      return collected
    }

    const flattenedReplies = collectAllReplies(parentId)

    return flattenedReplies.map((reply) => {
      const replyLike = commentLikes[reply.id]
      const canDeleteReply =
        isSystemAdmin(user?.role) ||
        user?.email === reply.user_email ||
        user?.email === post.createdby ||
        user?.email === post.group_creator_email

      return (
        <View key={`reply-${reply.id}`} style={localStyles.replyItem}>
          <Image
            source={getImageSource(reply.image)}
            style={localStyles.replyAvatar}
          />
          <View style={localStyles.replyMain}>
            <View style={localStyles.replyHeader}>
              <Text style={localStyles.replyAuthor}>{reply.name}</Text>
              <Text
                style={[
                  localStyles.replyRole,
                  { color: getRoleColor(reply.user_role) },
                ]}
              >
                {getRoleDisplayText(reply.user_role)}
              </Text>
              <Text style={localStyles.replyTime}>
                {reply.created_at_local
                  ? moment(reply.created_at_local).fromNow()
                  : moment(reply.created_at).fromNow()}
              </Text>
              {canDeleteReply && (
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
              <Text style={localStyles.replyText}>{reply.comment}</Text>
            )}

            <View style={localStyles.replyActionRow}>
              <TouchableOpacity
                onPress={() => handleCommentLike(reply.id)}
                style={localStyles.replyActionButton}
                disabled={!replyLike || isToggling}
              >
                <Text
                  style={[
                    localStyles.replyActionText,
                    {
                      color: replyLike?.isLiked ? Colors.PRIMARY : Colors.GRAY,
                      fontWeight: replyLike?.isLiked ? 'bold' : 'normal',
                    },
                  ]}
                >
                  {replyLike?.isLiked ? 'Харесано' : 'Харесай'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleReplyToComment(reply.id, reply.name)}
                style={localStyles.replyActionButton}
              >
                <Text style={localStyles.replyActionText}>Отговори</Text>
              </TouchableOpacity>
              {(replyLike?.count || 0) > 0 && (
                <Text style={localStyles.replyLikeCount}>
                  {replyLike?.count} харесвания
                </Text>
              )}
            </View>

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
                {canDeleteReply && (
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

  const showLoading = likesLoading

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Comments List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={localStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Search Bar */}
          <View style={localStyles.searchContainer}>
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
              style={localStyles.searchInput}
              placeholderTextColor={Colors.GRAY}
            />
            {commentSearchQuery.length > 0 && (
              <TouchableOpacity onPress={clearCommentSearch}>
                <Ionicons name="close" size={16} color={Colors.GRAY} />
              </TouchableOpacity>
            )}
          </View>

          {commentSearchQuery.trim() && (
            <View style={localStyles.searchResultsInfo}>
              <Text style={localStyles.searchResultsText}>
                {showLoading
                  ? 'Търсене в коментарите...'
                  : `Намерени ${parentComments.length} коментар(а) за "${commentSearchQuery}"`}
              </Text>
            </View>
          )}

          {showLoading && (
            <View style={localStyles.loadingContainer}>
              <ActivityIndicator color={Colors.PRIMARY} size="small" />
              <Text style={localStyles.loadingText}>
                {commentSearchQuery.trim()
                  ? 'Търсене в коментарите...'
                  : 'Зареждане...'}
              </Text>
            </View>
          )}

          {parentComments.length > 0
            ? parentComments.map((c) => {
                const commentLike = commentLikes[c.id]
                const hasReplies = replies[c.id] && replies[c.id].length > 0
                const replyCount = countAllReplies(c.id)

                const canDeleteComment =
                  isSystemAdmin(user?.role) ||
                  user?.email === c.user_email ||
                  user?.email === post.createdby ||
                  user?.email === post.group_creator_email

                return (
                  <View
                    key={`comment-${c.id}`}
                    style={localStyles.parentCommentContainer}
                  >
                    {/* Parent Comment */}
                    <View style={localStyles.commentRow}>
                      <Image
                        source={getImageSource(c.image)}
                        style={localStyles.avatar}
                      />
                      <View style={localStyles.commentMain}>
                        <View style={localStyles.commentHeader}>
                          <Text style={localStyles.author}>{c.name}</Text>
                          <Text
                            style={[
                              localStyles.role,
                              { color: getRoleColor(c.user_role) },
                            ]}
                          >
                            {getRoleDisplayText(c.user_role)}
                          </Text>
                          <Text style={localStyles.commentTime}>
                            {c.created_at_local
                              ? moment(c.created_at_local).fromNow()
                              : moment(c.created_at).fromNow()}
                          </Text>
                          {canDeleteComment && (
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
                          <Text style={localStyles.commentText}>
                            {c.comment}
                          </Text>
                        )}

                        <View style={localStyles.commentActionRow}>
                          <TouchableOpacity
                            onPress={() => handleCommentLike(c.id)}
                            style={localStyles.commentActionButton}
                            disabled={!commentLike || isToggling}
                          >
                            <Text
                              style={[
                                localStyles.commentActionText,
                                {
                                  color: commentLike?.isLiked
                                    ? Colors.PRIMARY
                                    : Colors.GRAY,
                                  fontWeight: commentLike?.isLiked
                                    ? 'bold'
                                    : 'normal',
                                },
                              ]}
                            >
                              {commentLike?.isLiked ? 'Харесано' : 'Харесай'}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleReplyToComment(c.id, c.name)}
                            style={localStyles.commentActionButton}
                          >
                            <Text style={localStyles.commentActionText}>
                              Отговори
                            </Text>
                          </TouchableOpacity>
                          {(commentLike?.count || 0) > 0 && (
                            <Text style={localStyles.commentLikeCount}>
                              {commentLike?.count} харесвания
                            </Text>
                          )}
                        </View>

                        {/* Show replies count and toggle */}
                        {hasReplies && (
                          <TouchableOpacity
                            onPress={() => onToggleReplies(c.id)}
                            style={localStyles.viewRepliesButton}
                          >
                            <View style={localStyles.repliesLine} />
                            <Text style={localStyles.viewRepliesText}>
                              {expandedComments.includes(c.id)
                                ? 'Скрий отговорите'
                                : `Виж ${replyCount} отговор${
                                    replyCount === 1 ? '' : 'а'
                                  }`}
                            </Text>
                          </TouchableOpacity>
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
                            {canDeleteComment && (
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

                    {/* Replies Container */}
                    {hasReplies && expandedComments.includes(c.id) && (
                      <View style={localStyles.repliesContainer}>
                        {renderAllReplies(c.id)}
                      </View>
                    )}
                  </View>
                )
              })
            : !showLoading && (
                <View style={localStyles.emptyContainer}>
                  <Text style={localStyles.emptyText}>
                    Все още няма коментари
                  </Text>
                </View>
              )}
        </View>
      </ScrollView>

      {/* Bottom Comment Input */}
      <View style={localStyles.bottomInputContainer}>
        {replyingToCommentId && (
          <View style={localStyles.replyingToContainer}>
            <Text style={localStyles.replyingToText}>
              Отговаряте на {replyingToName}
            </Text>
            <TouchableOpacity onPress={handleClearReply}>
              <MaterialIcons name="close" size={16} color={Colors.GRAY} />
            </TouchableOpacity>
          </View>
        )}

        <View style={localStyles.inputRow}>
          <Image
            source={getImageSource(user?.image)}
            style={localStyles.inputAvatar}
          />
          <View style={localStyles.inputContainer}>
            <TextInput
              style={localStyles.mainCommentInput}
              value={mainCommentText}
              onChangeText={setMainCommentText}
              placeholder={
                replyingToCommentId
                  ? `Отговори на ${replyingToName}...`
                  : 'Напиши коментар...'
              }
              placeholderTextColor={Colors.GRAY}
              multiline
              maxLength={500}
              editable={!isSubmittingComment}
            />
            <TouchableOpacity
              onPress={handleSubmitMainComment}
              style={[
                localStyles.sendButton,
                {
                  opacity:
                    !mainCommentText.trim() || isSubmittingComment ? 0.5 : 1,
                },
              ]}
              disabled={!mainCommentText.trim() || isSubmittingComment}
            >
              {isSubmittingComment ? (
                <ActivityIndicator size="small" color={Colors.WHITE} />
              ) : (
                <MaterialIcons name="send" size={18} color={Colors.WHITE} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const localStyles = StyleSheet.create({
  // ...styles as in your file...
  scrollContent: {
    paddingBottom: 20,
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.BLACK,
  },
  searchResultsInfo: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchResultsText: {
    color: Colors.GRAY,
    fontSize: 12,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: Colors.GRAY,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.GRAY,
    fontSize: 16,
  },
  parentCommentContainer: {
    marginBottom: 8,
    backgroundColor: Colors.WHITE,
  },
  commentRow: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  commentMain: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  author: {
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 8,
    color: Colors.BLACK,
  },
  role: {
    fontSize: 12,
    marginRight: 8,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.GRAY,
    marginRight: 8,
  },
  menuButton: {
    padding: 4,
    marginLeft: 'auto',
  },
  commentText: {
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 20,
    color: Colors.BLACK,
  },
  commentActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  commentActionButton: {
    marginRight: 16,
    paddingVertical: 4,
  },
  commentActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentLikeCount: {
    fontSize: 12,
    color: Colors.GRAY,
    marginLeft: 'auto',
  },
  viewRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  repliesLine: {
    width: 24,
    height: 1,
    backgroundColor: Colors.GRAY,
    marginRight: 8,
  },
  viewRepliesText: {
    fontSize: 13,
    color: Colors.GRAY,
    fontWeight: '600',
  },
  repliesContainer: {
    paddingLeft: 52,
    paddingRight: 16,
    paddingBottom: 8,
  },
  replyItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingVertical: 4,
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  replyMain: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  replyAuthor: {
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 6,
    color: Colors.BLACK,
  },
  replyRole: {
    fontSize: 11,
    marginRight: 6,
  },
  replyTime: {
    fontSize: 11,
    color: Colors.GRAY,
    marginRight: 6,
  },
  replyText: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 18,
    color: Colors.BLACK,
  },
  replyActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyActionButton: {
    marginRight: 12,
    paddingVertical: 2,
  },
  replyActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  replyLikeCount: {
    fontSize: 11,
    color: Colors.GRAY,
    marginLeft: 'auto',
  },
  editContainer: {
    marginVertical: 8,
  },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    backgroundColor: Colors.WHITE,
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.PRIMARY,
    borderRadius: 6,
  },
  saveButtonText: {
    color: Colors.WHITE,
    fontSize: 13,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: Colors.GRAY,
    fontSize: 13,
    fontWeight: 'bold',
  },
  menuDropdown: {
    position: 'absolute',
    top: 20,
    right: 0,
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
    minWidth: 120,
  },
  menuOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  menuOptionText: {
    fontSize: 14,
    color: Colors.BLACK,
  },
  bottomInputContainer: {
    backgroundColor: Colors.WHITE,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.LIGHT_GRAY,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingHorizontal: 16,
  },
  replyingToContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  replyingToText: {
    fontSize: 13,
    color: Colors.GRAY,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    minHeight: 40,
  },
  mainCommentInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.BLACK,
    maxHeight: 100,
    paddingRight: 8,
  },
  sendButton: {
    backgroundColor: Colors.PRIMARY,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default PostComments
