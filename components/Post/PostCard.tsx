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
import { scale, verticalScale, moderateScale } from "react-native-size-matters"

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

  // state за обновяване – на всяка промяна се извиква презареждане
  const [updateTrigger, setUpdateTrigger] = useState(0)
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
  const submitComment = async () => {
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
        }
      )
      console.log("Comment submitted successfully:", response.data)
      setCommentText("")
      setCommentCount((prev) => prev + 1)
      if (commentsVisible) {
        const now = new Date()
        const nowBG = moment(now).format()
        // Използвайте същия формат като този, който идва от сървъра
        const newComment = {
          id: response.data.commentId,
          comment: commentText,
          // Не използваме UTC() - просто вземаме локалното време
          created_at: now.toISOString(),
          created_at_local: nowBG,
          name: user.name,
          image: user.image,
          user_email: user.email,
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
        />
        {(isAdmin(user?.role) || user?.email === post.createdby) && (
          <TouchableOpacity onPress={showMenu} style={{ padding: scale(8) }}>
            <Text style={{ fontSize: moderateScale(22) }}>⋮</Text>
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
              borderTopLeftRadius: scale(16),
              borderTopRightRadius: scale(16),
              padding: scale(20),
              minWidth: "100%",
              elevation: scale(10),
              zIndex: 2,
            }}
          >
            <View
              style={{
                width: scale(40),
                height: verticalScale(4),
                backgroundColor: Colors.GRAY,
                borderRadius: scale(2),
                alignSelf: "center",
                marginBottom: verticalScale(16),
              }}
            />
            <TouchableOpacity
              onPress={() => {
                hideMenu()
                startEditing()
              }}
              style={{ paddingVertical: verticalScale(16) }}
            >
              <Text
                style={{
                  color: Colors.PRIMARY,
                  fontWeight: "bold",
                  fontSize: moderateScale(18),
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
              style={{ paddingVertical: verticalScale(16) }}
            >
              <Text
                style={{
                  color: "red",
                  fontWeight: "bold",
                  fontSize: moderateScale(18),
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
                size={scale(24)}
                color={isLiked ? Colors.PRIMARY : "black"}
              />
              <Text style={styles.actionText}>{likeCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleCommentsView}
              style={styles.subContainer}
            >
              <FontAwesome name="commenting-o" size={scale(24)} color="black" />
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
        <TouchableOpacity onPress={submitComment} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Изпрати</Text>
        </TouchableOpacity>
      </View>
      {commentsVisible && (
        <View style={styles.commentsContainer}>
          {comments.length > 0 ? (
            comments.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <Text style={styles.commentAuthor}>{c.name}</Text>
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
                    {/* Добавен ред */}
                    <Text style={styles.commentDate}>
                      {c.created_at_local
                        ? moment(c.created_at_local).fromNow()
                        : moment(c.created_at).fromNow()}
                    </Text>
                    {user?.email === c.user_email && (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingCommentId(c.id)
                          setEditedCommentText(c.comment)
                        }}
                      >
                        <Text
                          style={{ color: Colors.PRIMARY, fontWeight: "bold" }}
                        >
                          Редактирай
                        </Text>
                      </TouchableOpacity>
                    )}
                    {(isAdmin(user?.role) ||
                      user?.email === c.user_email ||
                      user?.email === post.createdby) && (
                      <TouchableOpacity onPress={() => deleteComment(c.id)}>
                        <Text style={{ color: "red", fontWeight: "bold" }}>
                          Изтрий
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
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
    padding: scale(15),
    backgroundColor: Colors.WHITE,
    borderRadius: scale(8),
    marginTop: verticalScale(10),
  },
  contentText: {
    fontSize: moderateScale(18),
    marginTop: verticalScale(10),
  },
  postImage: {
    width: "100%",
    height: verticalScale(300),
    resizeMode: "cover",
    borderRadius: scale(10),
    marginTop: verticalScale(10),
  },
  actionsContainer: {
    marginTop: verticalScale(10),
    flexDirection: "row",
    alignItems: "center",
    gap: scale(20),
  },
  subContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(7),
  },
  actionText: {
    fontSize: moderateScale(17),
    color: Colors.GRAY,
  },
  commentsLink: {
    marginTop: verticalScale(7),
    color: Colors.GRAY,
  },
  commentInputContainer: {
    marginTop: verticalScale(15),
    flexDirection: "row",
    alignItems: "center",
    borderColor: Colors.GRAY,
    borderWidth: 1,
    borderRadius: scale(8),
    paddingHorizontal: scale(10),
  },
  commentInput: {
    flex: 1,
    height: verticalScale(40),
    color: Colors.BLACK,
  },
  submitButton: {
    padding: scale(10),
  },
  submitButtonText: {
    color: Colors.PRIMARY,
    fontWeight: "bold",
  },
  commentsContainer: {
    marginTop: verticalScale(15),
    borderTopWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    paddingTop: verticalScale(10),
  },
  commentItem: {
    marginBottom: verticalScale(12),
    paddingVertical: verticalScale(8),
    borderBottomWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
  },
  commentAuthor: {
    fontWeight: "bold",
    fontSize: moderateScale(16),
    color: Colors.BLACK,
  },
  commentText: {
    fontSize: moderateScale(15),
    color: Colors.BLACK,
  },
  commentDate: {
    fontSize: moderateScale(13),
    color: Colors.GRAY,
  },
  noCommentsText: {
    fontStyle: "italic",
    color: Colors.GRAY,
  },
  editInput: {
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: scale(8),
    padding: scale(10),
    marginTop: verticalScale(10),
    fontSize: moderateScale(16),
    color: Colors.BLACK,
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: verticalScale(10),
  },
  saveButton: {
    backgroundColor: Colors.PRIMARY,
    padding: scale(10),
    borderRadius: scale(8),
    flex: 1,
    marginRight: scale(5),
  },
  cancelButton: {
    backgroundColor: Colors.GRAY,
    padding: scale(10),
    borderRadius: scale(8),
    flex: 1,
    marginLeft: scale(5),
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
    width: scale(150),
    height: verticalScale(150),
    borderRadius: scale(10),
    marginTop: verticalScale(10),
    alignSelf: "center",
  },
  imagePlaceholder: {
    backgroundColor: Colors.LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: Colors.GRAY,
    fontSize: moderateScale(14),
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: verticalScale(10),
    gap: scale(10),
  },
  editLink: {
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(8),
  },
  deleteLink: {
    paddingVertical: verticalScale(5),
    paddingHorizontal: scale(8),
  },
  deleteLinkText: {
    color: "red",
    fontWeight: "bold",
  },
  editLinkText: {
    color: Colors.PRIMARY,
    fontWeight: "bold",
  },
})
