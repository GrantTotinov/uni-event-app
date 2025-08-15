import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native'
import moment from 'moment-timezone'
import { MaterialIcons, Ionicons, AntDesign } from '@expo/vector-icons'
import Colors from '@/data/Colors'
import { isAdmin } from '@/context/AuthContext'
import { usePostComments } from '@/hooks/useComments'
import { styles } from './styles'

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

const REPLY_INDENT = 52

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
  const [commentSearchQuery, setCommentSearchQuery] = useState<string>('')
  const [commentLikes, setCommentLikes] = useState<{
    [key: number]: { isLiked: boolean; count: number }
  }>({})

  const { comments: searchedComments, isLoading: isSearching } =
    usePostComments(post.post_id, commentSearchQuery)

  // Only show root comments (parent_id == null) as top-level
  const displayComments = (
    commentSearchQuery.trim() ? searchedComments : comments
  ).filter((c) => !c.parent_id)

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

  const handleCommentLike = (commentId: number) => {
    setCommentLikes((prev) => {
      const current = prev[commentId] || { isLiked: false, count: 0 }
      return {
        ...prev,
        [commentId]: {
          isLiked: !current.isLiked,
          count: current.isLiked
            ? Math.max(0, current.count - 1)
            : current.count + 1,
        },
      }
    })
  }

  // Recursive rendering for replies, with correct indentation and cycle protection
  const renderReplies = (
    parentId: number,
    level: number = 1,
    visited: Set<number> = new Set()
  ): React.ReactNode => {
    const childReplies = replies[parentId] || []
    if (!childReplies.length) return null

    return childReplies.map((reply) => {
      if (visited.has(reply.id)) {
        return null
      }
      const newVisited = new Set(visited)
      newVisited.add(reply.id)

      const isExpanded = expandedComments.includes(reply.id)
      return (
        <View
          key={reply.id}
          style={{
            marginLeft: REPLY_INDENT,
            marginTop: 8,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          {/* Avatar OUTSIDE the rectangle */}
          <Image
            source={{ uri: reply.image }}
            style={styles.discordReplyAvatar}
          />
          {/* Content: rectangle and actions below */}
          <View style={{ flex: 1 }}>
            <View style={[styles.discordReplyContentContainer]}>
              <View>
                <View style={styles.discordCommentNameRow}>
                  <Text style={styles.discordReplyAuthor}>{reply.name}</Text>
                  <Text
                    style={[
                      styles.discordReplyRole,
                      { color: getRoleColor(reply.role) },
                    ]}
                  >
                    {getRoleDisplayText(reply.role)}
                  </Text>
                </View>
                <Text style={styles.discordReplyText}>{reply.comment}</Text>
              </View>
            </View>
            {/* Date and actions BELOW the rectangle */}
            <View
              style={[styles.discordActionRow, { marginLeft: 0, marginTop: 4 }]}
            >
              <Text style={styles.discordCommentDate}>
                {reply.created_at_local
                  ? moment(reply.created_at_local).fromNow()
                  : moment(reply.created_at).fromNow()}
              </Text>
              <TouchableOpacity
                onPress={() => handleCommentLike(reply.id)}
                style={styles.discordActionButton}
              >
                <AntDesign
                  name="like2"
                  size={14}
                  color={
                    commentLikes[reply.id]?.isLiked
                      ? Colors.PRIMARY
                      : Colors.GRAY
                  }
                />
                <Text
                  style={[
                    styles.discordActionText,
                    {
                      color: commentLikes[reply.id]?.isLiked
                        ? Colors.PRIMARY
                        : Colors.GRAY,
                    },
                  ]}
                >
                  {commentLikes[reply.id]?.isLiked ? 'Харесано' : 'Харесай'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onToggleReplies(reply.id)}
                style={styles.discordActionButton}
              >
                <MaterialIcons name="reply" size={14} color={Colors.GRAY} />
                <Text style={styles.discordActionText}>Отговори</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.discordLikeCountContainer, { marginLeft: 0 }]}>
              <AntDesign
                name="heart"
                size={12}
                color={
                  commentLikes[reply.id]?.isLiked ? Colors.PRIMARY : Colors.GRAY
                }
              />
              <Text style={styles.discordLikeCountText}>
                {commentLikes[reply.id]?.count || 0}
              </Text>
            </View>
            {isExpanded && (
              <View style={styles.discordRepliesContainer}>
                {renderReplies(reply.id, level + 1, newVisited)}
                <View style={styles.discordReplyInputContainer}>
                  <Image
                    source={{ uri: user?.image }}
                    style={styles.discordReplyAvatar}
                  />
                  <View style={styles.discordReplyInputWrapper}>
                    <TextInput
                      style={styles.discordReplyInput}
                      value={replyTexts[reply.id] || ''}
                      onChangeText={(text) => onUpdateReplyText(reply.id, text)}
                      placeholder="Отговорете на този коментар..."
                      placeholderTextColor={Colors.GRAY}
                    />
                    <TouchableOpacity
                      onPress={() => onSubmitReply(reply.id)}
                      style={styles.discordReplySubmitButton}
                    >
                      <Text style={styles.discordReplySubmitButtonText}>
                        Отговори
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      )
    })
  }

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

      {/* Comment Search Bar */}
      <View style={styles.searchContainer}>
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
          style={styles.searchInput}
          placeholderTextColor={Colors.GRAY}
        />
        {commentSearchQuery.length > 0 && (
          <TouchableOpacity onPress={clearCommentSearch} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={16} color={Colors.GRAY} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Results Info */}
      {commentSearchQuery.trim() && (
        <View style={styles.searchResultsInfo}>
          <Text style={styles.searchResultsText}>
            {isSearching
              ? 'Търсене в коментарите...'
              : `Намерени ${displayComments.length} коментар(а) за "${commentSearchQuery}"`}
          </Text>
        </View>
      )}

      {/* Loading indicator for search */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={Colors.PRIMARY} size="small" />
        </View>
      )}

      {displayComments.length > 0 ? (
        displayComments.map((c) => (
          <View
            key={c.id}
            style={[
              styles.discordCommentItem,
              { flexDirection: 'row', alignItems: 'flex-start' },
            ]}
          >
            {/* Avatar OUTSIDE the rectangle */}
            <Image
              source={{ uri: c.image }}
              style={styles.discordCommentAvatar}
            />
            {/* Content: rectangle and actions below */}
            <View style={{ flex: 1 }}>
              <View style={[styles.discordCommentContentContainer]}>
                <View>
                  <View style={styles.discordCommentNameRow}>
                    <Text style={styles.discordCommentAuthor}>{c.name}</Text>
                    <Text
                      style={[
                        styles.discordCommentRole,
                        { color: getRoleColor(c.role) },
                      ]}
                    >
                      {getRoleDisplayText(c.role)}
                    </Text>
                  </View>
                  {editingCommentId === c.id ? (
                    <View style={styles.discordEditContainer}>
                      <TextInput
                        style={styles.discordEditInput}
                        value={editedCommentText}
                        onChangeText={(text) => onEditComment(c.id, text)}
                        placeholder="Редактирайте коментара..."
                        multiline
                      />
                      <View style={styles.discordEditButtons}>
                        <TouchableOpacity
                          onPress={onSaveEditedComment}
                          style={styles.discordSaveButton}
                        >
                          <Text style={styles.discordSaveButtonText}>
                            Запази
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => onEditComment(0, '')}
                          style={styles.discordCancelButton}
                        >
                          <Text style={styles.discordCancelButtonText}>
                            Откажи
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.discordCommentText}>{c.comment}</Text>
                  )}
                </View>
                {(user?.email === c.user_email ||
                  isAdmin(user?.role) ||
                  user?.email === post.createdby) && (
                  <TouchableOpacity
                    onPress={() => onToggleCommentMenu(c.id)}
                    style={styles.discordCommentMenuButton}
                  >
                    <MaterialIcons
                      name="more-vert"
                      size={18}
                      color={Colors.GRAY}
                    />
                  </TouchableOpacity>
                )}
              </View>
              {/* Date and actions BELOW the rectangle */}
              <View
                style={[
                  styles.discordActionRow,
                  { marginLeft: 0, marginTop: 4 },
                ]}
              >
                <Text style={styles.discordCommentDate}>
                  {c.created_at_local
                    ? moment(c.created_at_local).fromNow()
                    : moment(c.created_at).fromNow()}
                </Text>
                <TouchableOpacity
                  onPress={() => handleCommentLike(c.id)}
                  style={styles.discordActionButton}
                >
                  <AntDesign
                    name="like2"
                    size={14}
                    color={
                      commentLikes[c.id]?.isLiked ? Colors.PRIMARY : Colors.GRAY
                    }
                  />
                  <Text
                    style={[
                      styles.discordActionText,
                      {
                        color: commentLikes[c.id]?.isLiked
                          ? Colors.PRIMARY
                          : Colors.GRAY,
                      },
                    ]}
                  >
                    {commentLikes[c.id]?.isLiked ? 'Харесано' : 'Харесай'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => onToggleReplies(c.id)}
                  style={styles.discordActionButton}
                >
                  <MaterialIcons name="reply" size={14} color={Colors.GRAY} />
                  <Text style={styles.discordActionText}>Отговори</Text>
                </TouchableOpacity>
              </View>
              <View
                style={[styles.discordLikeCountContainer, { marginLeft: 0 }]}
              >
                <AntDesign
                  name="heart"
                  size={12}
                  color={
                    commentLikes[c.id]?.isLiked ? Colors.PRIMARY : Colors.GRAY
                  }
                />
                <Text style={styles.discordLikeCountText}>
                  {commentLikes[c.id]?.count || 0}
                </Text>
              </View>
              {/* Replies section (recursive, indented) */}
              {expandedComments.includes(c.id) && (
                <View style={styles.discordRepliesContainer}>
                  {renderReplies(c.id, 1, new Set([c.id]))}
                  <View style={styles.discordReplyInputContainer}>
                    <Image
                      source={{ uri: user?.image }}
                      style={styles.discordReplyAvatar}
                    />
                    <View style={styles.discordReplyInputWrapper}>
                      <TextInput
                        style={styles.discordReplyInput}
                        value={replyTexts[c.id] || ''}
                        onChangeText={(text) => onUpdateReplyText(c.id, text)}
                        placeholder="Отговорете на този коментар..."
                        placeholderTextColor={Colors.GRAY}
                      />
                      <TouchableOpacity
                        onPress={() => onSubmitReply(c.id)}
                        style={styles.discordReplySubmitButton}
                      >
                        <Text style={styles.discordReplySubmitButtonText}>
                          Отговори
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
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
                      <Text style={[styles.menuOptionText, { color: 'red' }]}>
                        Изтрий
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noCommentsText}>
          {commentSearchQuery.trim()
            ? `Няма намерени коментари за "${commentSearchQuery}"`
            : 'Все още няма коментари.'}
        </Text>
      )}
    </View>
  )
}
