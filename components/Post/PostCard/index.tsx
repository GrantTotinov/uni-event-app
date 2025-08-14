import React, { useContext, useEffect, useState } from 'react'
import { View } from 'react-native'
import axios from 'axios'
import moment from 'moment-timezone'
import 'moment/locale/bg'
import { AuthContext, isAdmin } from '@/context/AuthContext'
import PostHeader from './PostHeader'
import PostContent from './PostContent'
import PostActions from './PostActions'
import PostComments from './PostComments'
import PostEditModal from './PostEditModal'
import PostMenuModal from './PostMenuModal'
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
  is_uht_related: boolean // Made required to match usage
  is_liked?: boolean
}

export default function PostCard({
  post,
  onUpdate,
}: {
  post: Post
  onUpdate?: () => void
}) {
  const { user } = useContext(AuthContext)
  const canDelete = isAdmin(user?.role) || user?.email === post.createdby

  // Инициализация от пропсове (без доп. заявки)
  const [isLiked, setIsLiked] = useState(!!post.is_liked)
  const [likeCount, setLikeCount] = useState(post.like_count ?? 0)
  const [commentCount, setCommentCount] = useState(post.comment_count ?? 0)

  const [commentText, setCommentText] = useState('')
  const [commentsVisible, setCommentsVisible] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(post.context)
  const [editedImageUrl, setEditedImageUrl] = useState(post.imageurl || '')
  const [editedUhtRelated, setEditedUhtRelated] = useState(
    post.is_uht_related ?? false
  )
  const [menuVisible, setMenuVisible] = useState(false)

  // Reply states
  const [replies, setReplies] = useState<{ [key: number]: any[] }>({})
  const [expandedComments, setExpandedComments] = useState<number[]>([])
  const [replyTexts, setReplyTexts] = useState<{ [key: number]: string }>({})
  const [selectedCommentMenu, setSelectedCommentMenu] = useState<number | null>(
    null
  )
  const [selectedReplyMenu, setSelectedReplyMenu] = useState<number | null>(
    null
  )
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null)
  const [editedCommentText, setEditedCommentText] = useState<string>('')
  const [editedReplyText, setEditedReplyText] = useState<string>('')

  useEffect(() => {
    setIsLiked(!!post.is_liked)
    setLikeCount(post.like_count ?? 0)
    setCommentCount(post.comment_count ?? 0)
    setEditedContent(post.context)
    setEditedImageUrl(post.imageurl || '')
    setEditedUhtRelated(post.is_uht_related ?? false)
  }, [post])

  // Зареждай коментари само при отворена секция
  useEffect(() => {
    if (!commentsVisible) return

    const fetchComments = async () => {
      try {
        const res = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}`
        )
        setComments(res.data)
        setCommentCount(Array.isArray(res.data) ? res.data.length : 0)
      } catch (error) {
        console.error('Error fetching comments', error)
      }
    }

    fetchComments()
  }, [commentsVisible, post.post_id])

  const toggleLike = async () => {
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

  const submitComment = async () => {
    if (!commentText.trim() || !user) return

    try {
      await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/comment`, {
        postId: post.post_id,
        comment: commentText,
        userEmail: user.email,
      })
      setCommentText('')

      if (commentsVisible) {
        const res = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}`
        )
        setComments(res.data)
        setCommentCount(Array.isArray(res.data) ? res.data.length : 0)
      } else {
        setCommentCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Error submitting comment', error)
    }
  }

  const toggleCommentsView = () => setCommentsVisible((prev) => !prev)

  // Reply functions
  const fetchReplies = async (commentId: number) => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}&parentId=${commentId}`
      )
      setReplies((prev) => ({ ...prev, [commentId]: response.data }))
    } catch (error) {
      console.error('Error fetching replies', error)
    }
  }

  const toggleReplies = (commentId: number) => {
    if (expandedComments.includes(commentId)) {
      setExpandedComments((prev) => prev.filter((id) => id !== commentId))
    } else {
      setExpandedComments((prev) => [...prev, commentId])
      if (!replies[commentId]) {
        fetchReplies(commentId)
      }
    }
  }

  const submitReply = async (parentId: number) => {
    if (!user) return
    const replyText = replyTexts[parentId]
    if (!replyText || replyText.trim() === '') return

    try {
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST_URL}/comment`,
        {
          postId: post.post_id,
          userEmail: user.email,
          comment: replyText,
          parentId,
        }
      )

      const now = new Date()
      const nowBG = moment(now).format()

      const newReply = {
        id: response.data.commentId,
        comment: replyText,
        created_at: now.toISOString(),
        created_at_local: nowBG,
        name: user.name,
        image: user.image,
        user_email: user.email,
        parent_id: parentId,
      }

      setReplies((prev) => ({
        ...prev,
        [parentId]: [...(prev[parentId] || []), newReply],
      }))

      setReplyTexts((prev) => ({ ...prev, [parentId]: '' }))
    } catch (error) {
      console.error('Error submitting reply', error)
    }
  }

  const updateReplyText = (commentId: number, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [commentId]: text }))
  }

  const toggleCommentMenu = (commentId: number | null) => {
    setSelectedCommentMenu((prev) => (prev === commentId ? null : commentId))
  }

  const toggleReplyMenu = (replyId: number | null) => {
    setSelectedReplyMenu((prev) => (prev === replyId ? null : replyId))
  }

  const editComment = (commentId: number, text: string) => {
    setEditingCommentId(commentId)
    setEditedCommentText(text)
  }

  const editReply = (replyId: number, text: string) => {
    setEditingReplyId(replyId)
    setEditedReplyText(text)
  }

  const saveEditedComment = async () => {
    if (!editedCommentText.trim()) return
    try {
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_HOST_URL}/comment`,
        {
          commentId: editingCommentId,
          userEmail: user?.email,
          newComment: editedCommentText,
        }
      )
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === editingCommentId
            ? { ...comment, comment: response.data.updatedComment }
            : comment
        )
      )
      setEditingCommentId(null)
      setEditedCommentText('')
    } catch (error) {
      console.error('Error editing comment', error)
    }
  }

  const saveEditedReply = async () => {
    if (!editedReplyText.trim()) return
    try {
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_HOST_URL}/comment`,
        {
          commentId: editingReplyId,
          userEmail: user?.email,
          newComment: editedReplyText,
        }
      )
      setReplies((prev) => {
        const newReplies = { ...prev }
        Object.keys(newReplies).forEach((parentId) => {
          newReplies[parseInt(parentId)] =
            newReplies[parseInt(parentId)]?.map((reply) =>
              reply.id === editingReplyId
                ? { ...reply, comment: response.data.updatedComment }
                : reply
            ) || []
        })
        return newReplies
      })
      setEditingReplyId(null)
      setEditedReplyText('')
    } catch (error) {
      console.error('Error editing reply', error)
    }
  }

  const deleteComment = async (commentId: number) => {
    try {
      await axios.delete(`${process.env.EXPO_PUBLIC_HOST_URL}/comment`, {
        data: {
          commentId,
          userEmail: user?.email,
          postAuthorEmail: post.createdby,
        },
      })
      setComments((prev) => prev.filter((comment) => comment.id !== commentId))
      setCommentCount((prev) => prev - 1)
    } catch (error) {
      console.error('Error deleting comment', error)
    }
  }

  const deleteReply = async (replyId: number, parentId: number) => {
    try {
      await axios.delete(`${process.env.EXPO_PUBLIC_HOST_URL}/comment`, {
        data: {
          commentId: replyId,
          userEmail: user?.email,
          postAuthorEmail: post.createdby,
        },
      })
      setReplies((prev) => ({
        ...prev,
        [parentId]:
          prev[parentId]?.filter((reply) => reply.id !== replyId) || [],
      }))
    } catch (error) {
      console.error('Error deleting reply', error)
    }
  }

  const deletePost = async () => {
    try {
      await axios.delete(`${process.env.EXPO_PUBLIC_HOST_URL}/post`, {
        data: { postId: post.post_id, userEmail: user?.email },
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
        commentsVisible={commentsVisible}
        onToggleLike={toggleLike}
        onToggleComments={toggleCommentsView}
        commentText={commentText}
        onCommentTextChange={setCommentText}
        onSubmitComment={submitComment}
        user={user}
      />

      {commentsVisible && (
        <PostComments
          comments={comments}
          replies={replies}
          expandedComments={expandedComments}
          replyTexts={replyTexts}
          selectedCommentMenu={selectedCommentMenu}
          selectedReplyMenu={selectedReplyMenu}
          editingCommentId={editingCommentId}
          editingReplyId={editingReplyId}
          editedCommentText={editedCommentText}
          editedReplyText={editedReplyText}
          user={user}
          post={post}
          onToggleReplies={toggleReplies}
          onSubmitReply={submitReply}
          onUpdateReplyText={updateReplyText}
          onToggleCommentMenu={toggleCommentMenu}
          onToggleReplyMenu={toggleReplyMenu}
          onEditComment={editComment}
          onEditReply={editReply}
          onSaveEditedComment={saveEditedComment}
          onSaveEditedReply={saveEditedReply}
          onDeleteComment={deleteComment}
          onDeleteReply={deleteReply}
        />
      )}

      <PostMenuModal
        visible={menuVisible}
        onHide={() => setMenuVisible(false)}
        onEdit={() => {
          setMenuVisible(false)
          setIsEditing(true)
        }}
        onDelete={() => {
          setMenuVisible(false)
          deletePost()
        }}
      />
    </View>
  )
}
