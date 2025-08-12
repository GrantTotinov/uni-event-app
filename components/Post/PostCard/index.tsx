import React, { useContext, useEffect, useState } from "react"
import { View, Modal } from "react-native"
import axios from "axios"
import moment from "moment-timezone"
import "moment/locale/bg"
import { AuthContext, isAdmin } from "@/context/AuthContext"
import Colors from "@/data/Colors"
import PostHeader from "./PostHeader"
import PostContent from "./PostContent"
import PostActions from "./PostActions"
import PostComments from "./PostComments"
import PostEditModal from "./PostEditModal"
import PostMenuModal from "./PostMenuModal"
import { styles } from "./styles"

moment.locale("bg")

export default function PostCard({ post, onUpdate }: any) {
  const { user } = useContext(AuthContext)
  const canDelete = isAdmin(user?.role) || user?.email === post.createdby

  // States for likes, comments and editing
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [commentText, setCommentText] = useState("")
  const [commentsVisible, setCommentsVisible] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(post?.context)
  const [editedImageUrl, setEditedImageUrl] = useState(post?.imageurl)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editedCommentText, setEditedCommentText] = useState<string>("")
  const [menuVisible, setMenuVisible] = useState(false)
  const [replies, setReplies] = useState<{ [key: number]: any[] }>({})
  const [expandedComments, setExpandedComments] = useState<number[]>([])
  const [replyTexts, setReplyTexts] = useState<{ [key: number]: string }>({})
  const [selectedCommentMenu, setSelectedCommentMenu] = useState<number | null>(
    null
  )
  const [selectedReplyMenu, setSelectedReplyMenu] = useState<number | null>(
    null
  )
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null)
  const [editedReplyText, setEditedReplyText] = useState<string>("")
  const [editedUhtRelated, setEditedUhtRelated] = useState(
    post?.is_uht_related || false
  )
  const [updateTrigger, setUpdateTrigger] = useState(0)

  // Fetch like and comment counts
  useEffect(() => {
    const fetchLikeAndCommentCount = async () => {
      try {
        const likeRes = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/post-like?postId=${post.post_id}`
        )
        setLikeCount(likeRes.data.likeCount)

        if (user) {
          const likedRes = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/post-like?postId=${post.post_id}&userEmail=${user.email}`
          )
          setIsLiked(likedRes.data.isLiked)
        }
        if (!commentsVisible) {
          const commentRes = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}`
          )
          if (Array.isArray(commentRes.data)) {
            setCommentCount(commentRes.data.length)
          } else {
            setCommentCount(commentRes.data.commentCount)
          }
        }
      } catch (error) {
        console.error("Error fetching like/comment count", error)
      }
    }
    fetchLikeAndCommentCount()
  }, [post.post_id, user, commentsVisible])

  const showMenu = () => setMenuVisible(true)
  const hideMenu = () => setMenuVisible(false)

  const toggleCommentsView = () => {
    setCommentsVisible((prev) => !prev)
  }

  const refreshPostData = async () => {
    try {
      const res = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/post?club=${post.club}&orderField=post.createdon`
      )
      const updatedPost = res.data.find((p: any) => p.post_id === post.post_id)
      if (updatedPost) {
        setEditedContent(updatedPost.context)
        setEditedImageUrl(updatedPost.imageurl)
      }
    } catch (error) {
      console.error("Error refreshing post data", error)
    }
  }

  useEffect(() => {
    refreshPostData()
  }, [updateTrigger])

  return (
    <View style={styles.cardContainer}>
      <PostHeader
        post={post}
        user={user}
        canDelete={canDelete}
        onShowMenu={showMenu}
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
            refreshPostData()
            if (onUpdate) onUpdate()
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
        onToggleLike={() => {
          /* implement toggle like logic */
        }}
        onToggleComments={toggleCommentsView}
        commentText={commentText}
        onCommentTextChange={setCommentText}
        onSubmitComment={() => {
          /* implement submit comment logic */
        }}
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
          onToggleReplies={(commentId: number) => {
            /* implement toggle replies */
          }}
          onSubmitReply={(parentId: number) => {
            /* implement submit reply */
          }}
          onUpdateReplyText={(commentId: number, text: string) => {
            /* implement update reply text */
          }}
          onToggleCommentMenu={(commentId: number | null) =>
            setSelectedCommentMenu(commentId)
          }
          onToggleReplyMenu={(replyId: number | null) =>
            setSelectedReplyMenu(replyId)
          }
          onEditComment={(commentId: number, text: string) => {
            setEditingCommentId(commentId)
            setEditedCommentText(text)
          }}
          onEditReply={(replyId: number, text: string) => {
            setEditingReplyId(replyId)
            setEditedReplyText(text)
          }}
          onSaveEditedComment={() => {
            /* implement save edited comment */
          }}
          onSaveEditedReply={() => {
            /* implement save edited reply */
          }}
          onDeleteComment={(commentId: number) => {
            /* implement delete comment */
          }}
          onDeleteReply={(replyId: number, parentId: number) => {
            /* implement delete reply */
          }}
        />
      )}

      <PostMenuModal
        visible={menuVisible}
        onHide={hideMenu}
        onEdit={() => {
          hideMenu()
          setIsEditing(true)
          setEditedContent(post.context)
          setEditedImageUrl(post.imageurl)
          setEditedUhtRelated(post.is_uht_related || false)
        }}
        onDelete={() => {
          hideMenu()
          // implement delete post logic
        }}
      />
    </View>
  )
}
