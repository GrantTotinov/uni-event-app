import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native"
import React, { useContext, useEffect, useState } from "react"
import axios from "axios"
import moment from "moment-timezone"
import "moment/locale/bg"
import UserAvatar from "./UserAvatar"
import Colors from "@/data/Colors"
import AntDesign from "@expo/vector-icons/AntDesign"
import FontAwesome from "@expo/vector-icons/FontAwesome"
import { AuthContext, isAdmin } from "@/context/AuthContext"
import * as ImagePicker from "expo-image-picker"
import { upload } from "cloudinary-react-native"
import { cld, options } from "@/configs/CloudinaryConfig"
import { useRouter } from "expo-router"
import { MaterialIcons } from "@expo/vector-icons"

moment.locale("bg")

export default function PostCard({ post, onUpdate }: any) {
  const { user } = useContext(AuthContext)
  const router = useRouter()
  const canDelete = isAdmin(user?.role) || user?.email === post.createdby
  // Състояния за харесвания, коментари и редактиране
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [commentText, setCommentText] = useState("")
  const [commentsVisible, setCommentsVisible] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(post?.context)
  const [editedImageUrl, setEditedImageUrl] = useState(post?.imageurl)
  //const [localPost, setLocalPost] = useState(post)
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

  // state за обновяване – на всяка промяна се извиква презареждане
  const [updateTrigger, setUpdateTrigger] = useState(0)

  const fetchReplies = async (commentId: number) => {
    try {
      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}&parentId=${commentId}`
      )
      setReplies((prev) => ({ ...prev, [commentId]: response.data }))
    } catch (error) {
      console.error("Error fetching replies", error)
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

  // Функция за изпращане на reply
  const submitReply = async (parentId: number) => {
    if (!user) {
      Alert.alert("Моля, влезте в профила си, за да коментирате.")
      return
    }

    const replyText = replyTexts[parentId]
    if (!replyText || replyText.trim() === "") return

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

      // Добавяне на новия reply към локалния state
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

      // Изчистване на текста за reply
      setReplyTexts((prev) => ({ ...prev, [parentId]: "" }))

      console.log("Reply submitted successfully:", response.data)
    } catch (error) {
      console.error("Error submitting reply", error)
      Alert.alert("Грешка", "Неуспешно добавяне на отговор.")
    }
  }

  // Функция за обновяване на reply текста
  const updateReplyText = (commentId: number, text: string) => {
    setReplyTexts((prev) => ({ ...prev, [commentId]: text }))
  }

  // Функция за управление на менюто за коментари
  const toggleCommentMenu = (commentId: number | null) => {
    setSelectedCommentMenu((prev) => (prev === commentId ? null : commentId))
  }

  // Функция за управление на менюто за подкоментари
  const toggleReplyMenu = (replyId: number | null) => {
    setSelectedReplyMenu((prev) => (prev === replyId ? null : replyId))
  }

  // Функция за изтриване на подкоментар
  const deleteReply = async (replyId: number, parentId: number) => {
    Alert.alert(
      "Изтриване на отговор",
      "Сигурни ли сте, че искате да изтриете този отговор?",
      [
        {
          text: "Отказ",
          style: "cancel",
        },
        {
          text: "Изтрий",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${process.env.EXPO_PUBLIC_HOST_URL}/comment`,
                {
                  data: {
                    commentId: replyId,
                    userEmail: user.email,
                    postAuthorEmail: post.createdby,
                  },
                }
              )
              console.log("Отговорът е изтрит:", response.data)

              // Премахване на отговора от локалния state
              setReplies((prev) => ({
                ...prev,
                [parentId]:
                  prev[parentId]?.filter((reply) => reply.id !== replyId) || [],
              }))

              Alert.alert("Успех", "Отговорът е изтрит успешно.")
            } catch (error) {
              console.error("Грешка при изтриване на отговора", error)
              Alert.alert(
                "Грешка",
                "Неуспешно изтриване на отговора. Опитайте отново."
              )
            }
          },
        },
      ]
    )
  }

  // Функция за запазване на редактиран подкоментар
  const saveEditedReply = async () => {
    if (!editedReplyText.trim()) {
      Alert.alert("Грешка", "Отговорът не може да бъде празен.")
      return
    }

    try {
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_HOST_URL}/comment`,
        {
          commentId: editingReplyId,
          userEmail: user.email,
          newComment: editedReplyText,
        }
      )
      console.log("Отговорът е редактиран:", response.data)

      // Актуализиране на локалния state
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
      setEditedReplyText("")
      Alert.alert("Успех", "Отговорът е редактиран успешно.")
    } catch (error) {
      console.error("Грешка при редактиране на отговора", error)
      Alert.alert(
        "Грешка",
        "Неуспешно редактиране на отговора. Опитайте отново."
      )
    }
  }

  const deleteComment = async (commentId: number) => {
    Alert.alert(
      "Изтриване на коментар",
      "Сигурни ли сте, че искате да изтриете този коментар?",
      [
        {
          text: "Отказ",
          style: "cancel",
        },
        {
          text: "Изтрий",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${process.env.EXPO_PUBLIC_HOST_URL}/comment`,
                {
                  data: {
                    commentId,
                    userEmail: user.email,
                    postAuthorEmail: post.createdby,
                  },
                }
              )
              console.log("Коментарът е изтрит:", response.data)
              setComments((prev) =>
                prev.filter((comment) => comment.id !== commentId)
              )
              setCommentCount((prev) => prev - 1)
              Alert.alert("Успех", "Коментарът е изтрит успешно.")
            } catch (error) {
              console.error("Грешка при изтриване на коментара", error)
              Alert.alert(
                "Грешка",
                "Неуспешно изтриване на коментара. Опитайте отново."
              )
            }
          },
        },
      ]
    )
  }

  const saveEditedComment = async () => {
    if (!editedCommentText.trim()) {
      Alert.alert("Грешка", "Коментарът не може да бъде празен.")
      return
    }

    try {
      const response = await axios.put(
        `${process.env.EXPO_PUBLIC_HOST_URL}/comment`,
        {
          commentId: editingCommentId,
          userEmail: user.email,
          newComment: editedCommentText,
        }
      )
      console.log("Коментарът е редактиран:", response.data)

      // Актуализиране на локалния state
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === editingCommentId
            ? { ...comment, comment: response.data.updatedComment }
            : comment
        )
      )
      setEditingCommentId(null)
      setEditedCommentText("")
      Alert.alert("Успех", "Коментарът е редактиран успешно.")
    } catch (error) {
      console.error("Грешка при редактиране на коментара", error)
      Alert.alert(
        "Грешка",
        "Неуспешно редактиране на коментара. Опитайте отново."
      )
    }
  }
  // Преобразуване на датата на публикацията
  // Преобразуване на датата на публикацията
  const createdAt = post?.createdon_local
    ? moment(post.createdon_local).format("YYYY-MM-DD HH:mm:ss")
    : "Няма дата"

  // Функция за презареждане на данните на публикацията
  const refreshPostData = async () => {
    try {
      // Извличаме всички постове за конкретния клуб
      const res = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/post?club=${post.club}&orderField=post.createdon`
      )
      // Филтрираме получения списък, за да намерим актуализирания пост
      const updatedPost = res.data.find((p: any) => p.post_id === post.post_id)
      if (updatedPost) {
        // Обновяваме локалните състояния (ако това ви е нужно)
        setEditedContent(updatedPost.context)
        setEditedImageUrl(updatedPost.imageurl)
        // Допълнително може да обновите и други state, ако е необходимо
      }
    } catch (error) {
      console.error("Error refreshing post data", error)
    }
  }

  // Използваме useEffect, който слуша за updateTrigger
  useEffect(() => {
    refreshPostData()
  }, [updateTrigger])

  // Зареждане на харесвания и броя коментари
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

  // Зареждане на коментари, когато секцията е отворена
  useEffect(() => {
    if (commentsVisible) {
      const fetchComments = async () => {
        try {
          console.log("Fetching comments for post ID:", post.post_id)
          const commentRes = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}`
          )
          console.log("Fetched comments:", commentRes.data)
          setComments(commentRes.data)
          setCommentCount(
            Array.isArray(commentRes.data) ? commentRes.data.length : 0
          )
        } catch (error) {
          console.error("Error fetching comments", error)
        }
      }
      fetchComments()
    }
  }, [commentsVisible, post.post_id])

  // Функция за харесване/разхаресване
  const toggleLike = async () => {
    if (!user) {
      Alert.alert("Моля, влезте в профила си, за да можете да лайквате.")
      return
    }
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
        setLikeCount((prev) => prev - 1)
      }
    } catch (error) {
      console.error("Error toggling like", error)
      Alert.alert("Грешка", "Нещо се обърка, моля опитайте отново.")
    }
  }

  // Функция за изпращане на коментар
  // Функция за изпращане на коментар
  const submitComment = async (parentId: number | null = null) => {
    if (!user) {
      Alert.alert("Моля, влезте в профила си, за да коментирате.")
      return
    }
    if (commentText.trim() === "") return
    try {
      console.log("Submitting comment:", commentText)
      const response = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST_URL}/comment`,
        {
          postId: post.post_id,
          userEmail: user.email,
          comment: commentText,
          parentId, // Добавяне на parentId, ако е наличен
        }
      )
      console.log("Comment submitted successfully:", response.data)
      setCommentText("")
      setCommentCount((prev) => prev + 1)
      if (commentsVisible) {
        const now = new Date()
        const nowBG = moment(now).format()
        const newComment = {
          id: response.data.commentId,
          comment: commentText,
          created_at: now.toISOString(),
          created_at_local: nowBG,
          name: user.name,
          image: user.image,
          user_email: user.email,
          parent_id: parentId, // Добавяне на parentId към локалния state
        }
        console.log("Adding new comment to state:", newComment)
        setComments((prev) => [newComment, ...prev])
      }
    } catch (error) {
      console.error("Error submitting comment", error)
      Alert.alert(
        "Грешка",
        "Неуспешно добавяне на коментар, моля опитайте отново."
      )
    }
  }

  const toggleCommentsView = () => {
    console.log("Toggling comments view. Current state:", commentsVisible)
    setCommentsVisible((prev) => !prev)
  }

  const startEditing = () => {
    if (!isAdmin(user?.role) && user?.email !== post.createdby) {
      Alert.alert("Нямате права да редактирате този пост.")
      return
    }
    setIsEditing(true)
  }

  const pickEditImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5,
    })
    if (!result.canceled) {
      setEditedImageUrl(result.assets[0].uri)
    }
  }

  const saveEdits = async () => {
    let finalImageUrl = editedImageUrl
    try {
      if (editedImageUrl && !editedImageUrl.startsWith("http")) {
        const resultData: any = await new Promise(async (resolve, reject) => {
          await upload(cld, {
            file: editedImageUrl,
            options: options,
            callback: (error: any, response: any) => {
              if (error) {
                reject(error)
              } else {
                resolve(response)
              }
            },
          })
        })
        finalImageUrl = resultData?.url
      }
      await axios.put(`${process.env.EXPO_PUBLIC_HOST_URL}/post`, {
        postId: post.post_id,
        userEmail: user.email,
        content: editedContent,
        imageUrl: finalImageUrl,
      })
      setIsEditing(false)
      // Обновяваме данните за публикацията чрез извикване на refreshPostData
      refreshPostData()
      // Можете да оставите и router.replace() ако имате нужда да пренасочите потребителя към Home:
      // router.replace("/(tabs)/Home")
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error("Грешка при редактиране", error)
      Alert.alert("Грешка", "Нещо се обърка при опита за редакция.")
    }
  }

  const deletePost = async () => {
    // Потвърждение за изтриване
    Alert.alert(
      "Изтриване на пост",
      "Сигурни ли сте, че искате да изтриете този пост?",
      [
        {
          text: "Отказ",
          style: "cancel",
        },
        {
          text: "Изтрий",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await axios.delete(
                `${process.env.EXPO_PUBLIC_HOST_URL}/post`,
                {
                  data: {
                    postId: post.post_id,
                    userEmail: user.email,
                  },
                }
              )
              console.log("Постът е изтрит:", response.data)
              // Извикване на callback-а за обновяване на списъка с постове
              if (onUpdate) {
                onUpdate()
              }
              Alert.alert("Успех", "Постът е изтрит успешно.")
            } catch (error) {
              console.error("Грешка при изтриване на поста", error)
              Alert.alert(
                "Грешка",
                "Неуспешно изтриване на поста. Опитайте отново."
              )
            }
          },
        },
      ]
    )
  }
  const showMenu = () => setMenuVisible(true)
  const hideMenu = () => setMenuVisible(false)

  return (
    <View style={styles.cardContainer}>
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
        />
        {(isAdmin(user?.role) || user?.email === post.createdby) && (
          <TouchableOpacity onPress={showMenu} style={{ padding: 8 }}>
            <Text style={{ fontSize: 22 }}>⋮</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={hideMenu}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          {/* Overlay */}
          <TouchableOpacity
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "transparent",
              zIndex: 1,
            }}
            activeOpacity={1}
            onPress={hideMenu}
          />
          {/* Bottom sheet */}
          <View
            style={{
              backgroundColor: Colors.WHITE,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              minWidth: "100%",
              elevation: 10,
              zIndex: 2,
            }}
          >
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: Colors.GRAY,
                borderRadius: 2,
                alignSelf: "center",
                marginBottom: 16,
              }}
            />
            <TouchableOpacity
              onPress={() => {
                hideMenu()
                startEditing()
              }}
              style={{ paddingVertical: 16 }}
            >
              <Text
                style={{
                  color: Colors.PRIMARY,
                  fontWeight: "bold",
                  fontSize: 18,
                  textAlign: "center",
                }}
              >
                Редактирай
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                hideMenu()
                deletePost()
              }}
              style={{ paddingVertical: 16 }}
            >
              <Text
                style={{
                  color: "red",
                  fontWeight: "bold",
                  fontSize: 18,
                  textAlign: "center",
                }}
              >
                Изтрий
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {isEditing ? (
        <>
          <TextInput
            style={styles.editInput}
            value={editedContent}
            onChangeText={setEditedContent}
            placeholder="Редактирайте съдържанието"
            placeholderTextColor={Colors.GRAY}
          />
          <TouchableOpacity onPress={pickEditImage}>
            {editedImageUrl ? (
              <Image
                source={{ uri: editedImageUrl }}
                style={styles.editImage}
              />
            ) : (
              <View style={[styles.editImage, styles.imagePlaceholder]}>
                <Text style={styles.placeholderText}>Избери изображение</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.editButtons}>
            <TouchableOpacity onPress={saveEdits} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Запази</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsEditing(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Откажи</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.contentText}>{post?.context}</Text>
          {post.imageurl && (
            <Image source={{ uri: post.imageurl }} style={styles.postImage} />
          )}
          <View style={styles.actionsContainer}>
            <TouchableOpacity onPress={toggleLike} style={styles.subContainer}>
              <AntDesign
                name="like2"
                size={24}
                color={isLiked ? Colors.PRIMARY : "black"}
              />
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleCommentsView}
              style={styles.subContainer}
            >
              <FontAwesome name="commenting-o" size={24} color="black" />
              <Text style={styles.actionText}>{commentCount}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={toggleCommentsView}>
            <Text style={styles.commentsLink}>Виж всички коментари</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Добавете коментар..."
          placeholderTextColor={Colors.GRAY}
        />
        <TouchableOpacity
          onPress={() => submitComment()}
          style={styles.submitButton}
        >
          <Text style={styles.submitButtonText}>Изпрати</Text>
        </TouchableOpacity>
      </View>
      {commentsVisible && (
        <View style={styles.commentsContainer}>
          {(selectedCommentMenu !== null || selectedReplyMenu !== null) && (
            <TouchableOpacity
              style={styles.overlay}
              activeOpacity={1}
              onPress={() => {
                toggleCommentMenu(null)
                toggleReplyMenu(null)
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
                      onPress={() => toggleCommentMenu(c.id)}
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

                {/* Меню с опции за коментар */}
                {selectedCommentMenu === c.id && (
                  <View style={styles.commentMenu}>
                    {user?.email === c.user_email && (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingCommentId(c.id)
                          setEditedCommentText(c.comment)
                          toggleCommentMenu(null)
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
                          deleteComment(c.id)
                          toggleCommentMenu(null)
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
                      onChangeText={setEditedCommentText}
                      placeholder="Редактирайте коментара..."
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity onPress={saveEditedComment}>
                        <Text
                          style={{ color: Colors.PRIMARY, fontWeight: "bold" }}
                        >
                          Запази
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingCommentId(null)
                          setEditedCommentText("")
                        }}
                      >
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

                    {/* Бутон за показване/скриване на отговори */}
                    <TouchableOpacity onPress={() => toggleReplies(c.id)}>
                      <Text style={styles.replyButton}>
                        {expandedComments.includes(c.id)
                          ? "Скрий отговорите"
                          : "Покажи отговорите"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {/* Секция за отговори */}
                {expandedComments.includes(c.id) && (
                  <View style={styles.repliesContainer}>
                    {/* Показване на съществуващи отговори */}
                    {replies[c.id]?.map((reply) => (
                      <View key={reply.id} style={styles.replyItem}>
                        <View style={styles.commentHeader}>
                          <Text style={styles.replyAuthor}>{reply.name}</Text>
                          {(user?.email === reply.user_email ||
                            isAdmin(user?.role) ||
                            user?.email === post.createdby) && (
                            <TouchableOpacity
                              onPress={() => toggleReplyMenu(reply.id)}
                              style={styles.commentMenuIcon}
                            >
                              <MaterialIcons
                                name="more-vert"
                                size={16}
                                color={Colors.GRAY}
                              />
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* Меню с опции за подкоментар */}
                        {selectedReplyMenu === reply.id && (
                          <View style={styles.replyMenu}>
                            {user?.email === reply.user_email && (
                              <TouchableOpacity
                                onPress={() => {
                                  setEditingReplyId(reply.id)
                                  setEditedReplyText(reply.comment)
                                  toggleReplyMenu(null)
                                }}
                                style={styles.menuOption}
                              >
                                <Text style={styles.menuOptionText}>
                                  Редактирай
                                </Text>
                              </TouchableOpacity>
                            )}
                            {(isAdmin(user?.role) ||
                              user?.email === reply.user_email ||
                              user?.email === post.createdby) && (
                              <TouchableOpacity
                                onPress={() => {
                                  deleteReply(reply.id, c.id)
                                  toggleReplyMenu(null)
                                }}
                                style={styles.menuOption}
                              >
                                <Text
                                  style={[
                                    styles.menuOptionText,
                                    { color: "red" },
                                  ]}
                                >
                                  Изтрий
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}

                        {editingReplyId === reply.id ? (
                          <>
                            <TextInput
                              style={styles.replyInput}
                              value={editedReplyText}
                              onChangeText={setEditedReplyText}
                              placeholder="Редактирайте отговора..."
                            />
                            <View style={styles.editButtons}>
                              <TouchableOpacity onPress={saveEditedReply}>
                                <Text
                                  style={{
                                    color: Colors.PRIMARY,
                                    fontWeight: "bold",
                                  }}
                                >
                                  Запази
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => {
                                  setEditingReplyId(null)
                                  setEditedReplyText("")
                                }}
                              >
                                <Text
                                  style={{ color: "red", fontWeight: "bold" }}
                                >
                                  Откажи
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        ) : (
                          <>
                            <Text style={styles.replyText}>
                              {reply.comment}
                            </Text>
                            <Text style={styles.commentDate}>
                              {reply.created_at_local
                                ? moment(reply.created_at_local).fromNow()
                                : moment(reply.created_at).fromNow()}
                            </Text>
                          </>
                        )}
                      </View>
                    ))}

                    {/* Поле за добавяне на нов отговор */}
                    <View style={styles.replyInputContainer}>
                      <TextInput
                        style={styles.replyInput}
                        value={replyTexts[c.id] || ""}
                        onChangeText={(text) => updateReplyText(c.id, text)}
                        placeholder="Отговорете на този коментар..."
                        placeholderTextColor={Colors.GRAY}
                      />
                      <TouchableOpacity
                        onPress={() => submitReply(c.id)}
                        style={styles.replySubmitButton}
                      >
                        <Text style={styles.replySubmitButtonText}>
                          Отговори
                        </Text>
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
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    //padding: 10,
    backgroundColor: Colors.WHITE,
    borderRadius: 5,
    marginTop: 10,
    overflow: "hidden",
  },
  contentText: {
    fontSize: 15,
    marginTop: 10,
  },
  postImage: {
    width: "100%",
    aspectRatio: 4 / 5,
    resizeMode: "cover",
    borderRadius: 5,
    marginTop: 10,
  },
  actionsContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  subContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  actionText: {
    fontSize: 17,
    color: Colors.GRAY,
  },
  commentsLink: {
    marginTop: 7,
    color: Colors.GRAY,
  },
  commentInputContainer: {
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    borderColor: Colors.GRAY,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  commentInput: {
    flex: 1,
    height: 40,
    color: Colors.BLACK,
  },
  submitButton: {
    padding: 10,
  },
  submitButtonText: {
    color: Colors.PRIMARY,
    fontWeight: "bold",
  },
  commentsContainer: {
    marginTop: 15,
    borderTopWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    paddingTop: 10,
  },
  commentItem: {
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
  },
  commentAuthor: {
    fontWeight: "bold",
    fontSize: 16,
    color: Colors.BLACK,
  },
  commentText: {
    fontSize: 15,
    color: Colors.BLACK,
  },
  commentDate: {
    fontSize: 13,
    color: Colors.GRAY,
  },
  noCommentsText: {
    fontStyle: "italic",
    color: Colors.GRAY,
  },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    fontSize: 16,
    color: Colors.BLACK,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: Colors.PRIMARY,
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  cancelButton: {
    backgroundColor: Colors.GRAY,
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  saveButtonText: {
    color: Colors.WHITE,
    textAlign: "center",
  },
  cancelButtonText: {
    color: Colors.WHITE,
    textAlign: "center",
  },
  editImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginTop: 10,
    alignSelf: "center",
  },
  imagePlaceholder: {
    backgroundColor: Colors.LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: Colors.GRAY,
    fontSize: 14,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  editLink: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  deleteLink: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  deleteLinkText: {
    color: "red",
    fontWeight: "bold",
  },
  editLinkText: {
    color: Colors.PRIMARY,
    fontWeight: "bold",
  },
  replyButton: {
    color: Colors.PRIMARY,
    marginTop: 5,
    fontWeight: "bold",
  },
  repliesContainer: {
    marginTop: 10,
    paddingLeft: 15,
    borderLeftWidth: 2,
    borderLeftColor: Colors.LIGHT_GRAY,
  },
  replyItem: {
    marginLeft: 20,
    marginTop: 5,
    borderLeftWidth: 1,
    borderLeftColor: Colors.GRAY,
    paddingLeft: 10,
    marginBottom: 8,
    padding: 8,
    backgroundColor: Colors.LIGHT_GRAY + "20",
    borderRadius: 8,
  },
  replyAuthor: {
    fontWeight: "bold",
    color: Colors.BLACK,
    fontSize: 14,
  },
  replyText: {
    color: Colors.BLACK,
    marginTop: 2,
    fontSize: 14,
  },
  replyInputContainer: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    color: Colors.BLACK,
  },
  replySubmitButton: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  replySubmitButtonText: {
    color: Colors.WHITE,
    fontWeight: "bold",
    fontSize: 12,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  commentMenuIcon: {
    padding: 5,
  },
  commentMenu: {
    position: "absolute",
    top: 30,
    right: 10,
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
    minWidth: 120,
  },
  replyMenu: {
    position: "absolute",
    top: 25,
    right: 10,
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
    minWidth: 120,
  },
  menuOption: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
  },
  menuOptionText: {
    fontSize: 16,
    color: Colors.BLACK,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
})
