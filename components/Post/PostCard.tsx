import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native"
import React, { useContext, useEffect, useState } from "react"
import axios from "axios"
import moment from "moment-timezone"
import "moment/locale/bg"
import UserAvatar from "./UserAvatar"
import Colors from "@/data/Colors"
import AntDesign from "@expo/vector-icons/AntDesign"
import FontAwesome from "@expo/vector-icons/FontAwesome"
import { AuthContext } from "@/context/AuthContext"
import * as ImagePicker from "expo-image-picker"
import { upload } from "cloudinary-react-native"
import { cld, options } from "@/configs/CloudinaryConfig"
import { useRouter } from "expo-router"

moment.locale("bg")

export default function PostCard({ post, onUpdate }: any) {
  const { user } = useContext(AuthContext)
  const router = useRouter()

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
  const [localPost, setLocalPost] = useState(post)

  // state за обновяване – на всяка промяна се извиква презареждане
  const [updateTrigger, setUpdateTrigger] = useState(0)

  // Преобразуване на датата на публикацията
  const createdAt = post?.createdon
    ? moment
        .utc(post.createdon)
        .tz("Europe/Sofia")
        .format("YYYY-MM-DD HH:mm:ss")
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
          const commentRes = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}`
          )
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
  const submitComment = async () => {
    if (!user) {
      Alert.alert("Моля, влезте в профила си, за да коментирате.")
      return
    }
    if (commentText.trim() === "") return
    try {
      await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/comment`, {
        postId: post.post_id,
        userEmail: user.email,
        comment: commentText,
      })
      setCommentText("")
      setCommentCount((prev) => prev + 1)
      if (commentsVisible) {
        const newComment = {
          id: Date.now(),
          comment: commentText,
          created_at: moment()
            .tz("Europe/Sofia")
            .format("YYYY-MM-DDTHH:mm:ss.SSSZ"),
          name: user.name,
          image: user.image,
        }
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
    setCommentsVisible((prev) => !prev)
  }

  const startEditing = () => {
    if (user?.email !== post.createdby) {
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

  return (
    <View style={styles.cardContainer}>
      <UserAvatar name={post?.name} image={post?.image} date={createdAt} />

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
          {user?.email === post.createdby && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity onPress={startEditing} style={styles.editLink}>
                <Text style={styles.editLinkText}>Редактирай</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deletePost} style={styles.deleteLink}>
                <Text style={styles.deleteLinkText}>Изтрий</Text>
              </TouchableOpacity>
            </View>
          )}
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
                <Text style={styles.commentText}>{c.comment}</Text>
                <Text style={styles.commentDate}>
                  {moment.utc(c.created_at).tz("Europe/Sofia").fromNow()}
                </Text>
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
    padding: 15,
    backgroundColor: Colors.WHITE,
    borderRadius: 8,
    marginTop: 10,
  },
  contentText: {
    fontSize: 18,
    marginTop: 10,
  },
  postImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
    borderRadius: 10,
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
    alignItems: "center", // Добавено, за да изравнява бутоните вертикално
    marginTop: 10,
    gap: 10,
  },
  editLink: {
    // Премахваме marginTop: 10,
    // Може да добавим paddingVertical: 5, за да има малко вътрешен отстъп
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  deleteLink: {
    // Премахваме marginTop: 10
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
})
