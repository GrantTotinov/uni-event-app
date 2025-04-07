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

moment.locale("bg")

export default function PostCard({ post }: any) {
  const { user } = useContext(AuthContext)

  // Състояния за харесвания
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  // Състояния за коментари
  const [commentCount, setCommentCount] = useState(0)
  const [commentText, setCommentText] = useState("")
  // За да покажем/скрием секцията с коментари
  const [commentsVisible, setCommentsVisible] = useState(false)
  // Списък с коментари (детайлна информация за всеки коментар)
  const [comments, setComments] = useState<any[]>([])

  // Преобразуваме датата на публикацията
  const createdAt = post?.createdon
    ? moment
        .utc(post.createdon)
        .tz("Europe/Sofia")
        .add(2, "hours")
        .toISOString()
    : "Няма дата"

  // При монтиране на компонента зареждаме харесванията и броя коментари (резюме)
  useEffect(() => {
    const fetchLikeAndCommentCount = async () => {
      try {
        // Зареждаме броя харесвания
        const likeRes = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/post-like?postId=${post.post_id}`
        )
        setLikeCount(likeRes.data.likeCount)

        // Проверяваме дали е харесано от текущия потребител
        if (user) {
          const likedRes = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/post-like?postId=${post.post_id}&userEmail=${user.email}`
          )
          setIsLiked(likedRes.data.isLiked)
        }

        // Ако секцията с коментари не е отворена, вземаме само броя им
        if (!commentsVisible) {
          const commentRes = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}`
          )
          // Ако API връща списък, използваме дължината му, ако връща обект – очакваме свойството commentCount
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

  // Когато секцията с коментари е отворена – вземаме детайлния списък с коментари
  useEffect(() => {
    if (commentsVisible) {
      const fetchComments = async () => {
        try {
          const commentRes = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}`
          )
          // Очакваме списък с обекти: { id, comment, created_at, name, image }
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

  // Функция за лайкване/анлайкване
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

  // Функция за добавяне на нов коментар
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
      // Изчистваме полето и актуализираме броя
      setCommentText("")
      setCommentCount((prev) => prev + 1)
      // Ако секцията е отворена, добавяме коментара локално (може и да се направи нов fetch)
      if (commentsVisible) {
        const newComment = {
          id: Date.now(), // временно ID, ако не получаваме от бекенда
          comment: commentText,
          created_at: new Date().toISOString(),
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

  // Функция за показване/скриване на секцията с коментари
  const toggleCommentsView = () => {
    setCommentsVisible((prev) => !prev)
  }

  return (
    <View style={styles.cardContainer}>
      <UserAvatar name={post?.name} image={post?.image} date={createdAt} />
      <Text style={styles.contentText}>{post?.content}</Text>
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
                  {moment(c.created_at).fromNow()}
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
})
