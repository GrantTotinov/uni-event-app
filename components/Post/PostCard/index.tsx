import React, { useContext, useState, useCallback } from 'react'
import { View } from 'react-native'
import axios from 'axios'
import moment from 'moment-timezone'
import 'moment/locale/bg'
import { AuthContext, isSystemAdmin } from '@/context/AuthContext'
import { usePostComments } from '@/hooks/useComments'
import PostHeader from './PostHeader'
import PostContent from './PostContent'
import PostActions from './PostActions'
import PostEditModal from './PostEditModal'
import PostMenuModal from './PostMenuModal'
import PostCommentsModal from './PostCommentsModal'
import { styles } from './styles'

moment.locale('bg')

export interface Post {
  post_id: number
  context: string
  imageurl?: string
  createdby: string
  createdon: string
  createdon_local: string
  name: string
  image: string
  role: string
  like_count: number
  comment_count: number
  is_uht_related: boolean
  is_liked?: boolean
  user_role?: string
  club?: number | string | null
  club_name?: string // добави това
}

export default function PostCard({
  post,
  onUpdate,
}: {
  post: Post
  onUpdate?: () => void
}) {
  const { user } = useContext(AuthContext)
  const canDelete = Boolean(
    user?.email && (isSystemAdmin(user?.role) || user?.email === post.createdby)
  )

  const [isLiked, setIsLiked] = useState(!!post.is_liked)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0)
  const [commentText, setCommentText] = useState('')
  const [commentsModalVisible, setCommentsModalVisible] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null)
  const [editedCommentText, setEditedCommentText] = useState('')
  const [editedReplyText, setEditedReplyText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(post.context)
  const [editedImageUrl, setEditedImageUrl] = useState(post.imageurl || '')
  const [editedUhtRelated, setEditedUhtRelated] = useState(post.is_uht_related)
  const [menuVisible, setMenuVisible] = useState(false)
  const [expandedComments, setExpandedComments] = useState<number[]>([])
  const [replyTexts, setReplyTexts] = useState<{ [key: number]: string }>({})
  const [selectedCommentMenu, setSelectedCommentMenu] = useState<number | null>(
    null
  )
  const [selectedReplyMenu, setSelectedReplyMenu] = useState<number | null>(
    null
  )

  // Submission tracking
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // React Query hooks for comments
  const {
    comments,
    addCommentMutation,
    editCommentMutation,
    deleteCommentMutation,
    invalidateComments,
  } = usePostComments(post.post_id)

  // Build replies from comments with proper nesting
  const buildRepliesMap = (allComments: any[]) => {
    const repliesMap: { [key: number]: any[] } = {}

    // Sort comments to ensure proper hierarchy
    const sortedComments = [...allComments].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime()
      const dateB = new Date(b.created_at).getTime()
      return dateA - dateB
    })

    sortedComments.forEach((comment) => {
      if (comment.parent_id) {
        if (!repliesMap[comment.parent_id]) {
          repliesMap[comment.parent_id] = []
        }
        repliesMap[comment.parent_id].push(comment)
      }
    })

    return repliesMap
  }

  const replies = buildRepliesMap(comments)

  const handleToggleLike = async () => {
    if (!user) return
    try {
      if (!isLiked) {
        await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/post-like`, {
          postId: post.post_id,
          userEmail: user.email,
        })
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      } else {
        await axios.delete(`${process.env.EXPO_PUBLIC_HOST_URL}/post-like`, {
          data: { postId: post.post_id, userEmail: user.email },
        })
        setIsLiked(false)
        setLikeCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error toggling like', error)
    }
  }

  // Optimized comment submission with anti-spam protection
  const handleSubmitComment = useCallback(
    async (commentText: string, parentId?: number) => {
      if (!commentText.trim() || !user || isSubmittingComment) return false

      setIsSubmittingComment(true)

      try {
        await addCommentMutation.mutateAsync({
          postId: post.post_id,
          userEmail: user.email,
          comment: commentText.trim(),
          parentId,
        })

        invalidateComments()

        // Update comment count if it's a main comment (not a reply)
        if (!parentId) {
          setCommentCount((prev) => prev + 1)
        }

        return true
      } catch (error) {
        console.error('Error submitting comment', error)
        return false
      } finally {
        // Add delay to prevent spam
        setTimeout(() => {
          setIsSubmittingComment(false)
        }, 1000)
      }
    },
    [
      user,
      addCommentMutation,
      post.post_id,
      invalidateComments,
      isSubmittingComment,
    ]
  )

  const handleToggleReplies = (commentId: number) => {
    setExpandedComments((prev) =>
      prev.includes(commentId)
        ? prev.filter((id) => id !== commentId)
        : [...prev, commentId]
    )
  }

  const handleSubmitReply = async (commentText: string, parentId?: number) => {
    if (!user) return

    const success = await handleSubmitComment(commentText, parentId)
    if (success && parentId) {
      // Clear reply text only if it was a reply (had parentId)
      setReplyTexts((prev) => ({ ...prev, [parentId]: '' }))
    }
  }

  const handleUpdateReplyText = (commentId: number, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [commentId]: text }))
  }

  const handleToggleCommentMenu = (commentId: number | null) => {
    setSelectedCommentMenu(commentId)
    if (commentId === null) {
      setEditingCommentId(null)
      setEditedCommentText('')
    }
  }

  const handleToggleReplyMenu = (replyId: number | null) => {
    setSelectedReplyMenu(replyId)
    if (replyId === null) {
      setEditingReplyId(null)
      setEditedReplyText('')
    }
  }

  const handleEditComment = (commentId: number, text: string) => {
    setEditingCommentId(commentId)
    setEditedCommentText(text)
    setSelectedCommentMenu(null)
  }

  const handleEditReply = (replyId: number, text: string) => {
    setEditingReplyId(replyId)
    setEditedReplyText(text)
    setSelectedReplyMenu(null)
  }

  const handleUpdateEditedCommentText = (text: string) => {
    setEditedCommentText(text)
  }

  const handleUpdateEditedReplyText = (text: string) => {
    setEditedReplyText(text)
  }

  const handleSaveEditedComment = async () => {
    if (!editedCommentText.trim() || !user || editingCommentId == null) return
    try {
      await editCommentMutation.mutateAsync({
        commentId: editingCommentId,
        userEmail: user.email,
        newComment: editedCommentText,
      })
      setEditingCommentId(null)
      setEditedCommentText('')
      invalidateComments()
    } catch (error) {
      console.error('Error editing comment', error)
    }
  }

  const handleSaveEditedReply = async () => {
    if (!editedReplyText.trim() || !user || editingReplyId == null) return
    try {
      await editCommentMutation.mutateAsync({
        commentId: editingReplyId,
        userEmail: user.email,
        newComment: editedReplyText,
      })
      setEditingReplyId(null)
      setEditedReplyText('')
      invalidateComments()
    } catch (error) {
      console.error('Error editing reply', error)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!user?.email) return
    try {
      await deleteCommentMutation.mutateAsync({
        commentId,
        userEmail: user.email,
        postAuthorEmail: post.createdby,
      })
      invalidateComments()
      setCommentCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error deleting comment', error)
    }
  }

  const handleDeleteReply = async (replyId: number) => {
    if (!user?.email) return
    try {
      await deleteCommentMutation.mutateAsync({
        commentId: replyId,
        userEmail: user.email,
        postAuthorEmail: post.createdby,
      })
      invalidateComments()
    } catch (error) {
      console.error('Error deleting reply', error)
    }
  }

  const handleDeletePost = async () => {
    if (!user?.email) return
    try {
      await axios.delete(`${process.env.EXPO_PUBLIC_HOST_URL}/post`, {
        data: { postId: post.post_id, userEmail: user.email },
      })
      onUpdate && onUpdate()
    } catch (error) {
      console.error('Error deleting post', error)
    }
  }

  return (
    <View style={styles.cardContainer}>
      <PostHeader
        post={post}
        user={user}
        canDelete={canDelete}
        onShowMenu={() => setMenuVisible(true)}
      />

      {isEditing ? (
        <PostEditModal
          editedContent={editedContent}
          setEditedContent={setEditedContent}
          editedImageUrl={editedImageUrl}
          setEditedImageUrl={setEditedImageUrl}
          editedUhtRelated={editedUhtRelated}
          setEditedUhtRelated={setEditedUhtRelated}
          user={user}
          post={post}
          onSave={() => {
            setIsEditing(false)
            onUpdate && onUpdate()
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <PostContent post={post} />
      )}

      <PostActions
        isLiked={isLiked}
        likeCount={likeCount}
        commentCount={commentCount}
        commentsVisible={commentsModalVisible}
        onToggleLike={handleToggleLike}
        onToggleComments={() => setCommentsModalVisible(true)}
        commentText={commentText}
        onCommentTextChange={setCommentText}
        onSubmitComment={() => handleSubmitComment(commentText)}
        user={user}
        postImageUrl={post.imageurl}
      />

      <PostCommentsModal
        visible={commentsModalVisible}
        onClose={() => setCommentsModalVisible(false)}
        commentsProps={{
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
          onToggleReplies: handleToggleReplies,
          onSubmitReply: handleSubmitReply, // <-- използвай само този
          onUpdateReplyText: handleUpdateReplyText,
          onToggleCommentMenu: handleToggleCommentMenu,
          onToggleReplyMenu: handleToggleReplyMenu,
          onEditComment: handleEditComment,
          onEditReply: handleEditReply,
          onUpdateEditedCommentText: handleUpdateEditedCommentText,
          onUpdateEditedReplyText: handleUpdateEditedReplyText,
          onSaveEditedComment: handleSaveEditedComment,
          onSaveEditedReply: handleSaveEditedReply,
          onDeleteComment: handleDeleteComment,
          onDeleteReply: handleDeleteReply,
          // Премахни onSubmitComment от тук
          isSubmittingComment,
        }}
      />

      <PostMenuModal
        visible={menuVisible}
        onHide={() => setMenuVisible(false)}
        onEdit={() => {
          setMenuVisible(false)
          setIsEditing(true)
        }}
        onDelete={() => {
          setMenuVisible(false)
          handleDeletePost()
        }}
      />
    </View>
  )
}
