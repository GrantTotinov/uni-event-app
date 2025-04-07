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

  // Състояния за харесвания и коментари
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [commentCount, setCommentCount] = useState(0)
  const [commentText, setCommentText] = useState("")

  // Преобразуване на датата
  const createdAt = post?.createdon
    ? moment
        .utc(post.createdon)
        .tz("Europe/Sofia")
        .add(2, "hours")
        .toISOString()
    : "Няма дата"

  useEffect(() => {
    // Извличаме данни за лайковете и коментарите
    const fetchData = async () => {
      try {
        // Зареждаме броя на харесванията
        const likeRes = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/post-like?postId=${post.post_id}`
        )
        setLikeCount(likeRes.data.likeCount)

        // Ако има логнат потребител, проверяваме дали е харесал поста
        if (user) {
          const likedRes = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/post-like?postId=${post.post_id}&userEmail=${user.email}`
          )
          setIsLiked(likedRes.data.isLiked)
        }

        // Зареждаме броя коментари – API-то може да върне или броя или списък
        const commentRes = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/comment?postId=${post.post_id}`
        )
        setCommentCount(commentRes.data.commentCount || commentRes.data.length)
      } catch (error) {
        console.error("Error fetching post data", error)
      }
    }
    fetchData()
  }, [post.post_id, user])

  const toggleLike = async () => {
    if (!user) {
      Alert.alert("Моля, влезте в профила си, за да можете да лайквате.")
      return
    }
    try {
      if (!isLiked) {
        // Изпращаме заявка за добавяне на лайк
        await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/post-like`, {
          postId: post.post_id,
          userEmail: user.email,
        })
        setIsLiked(true)
        setLikeCount((prev) => prev + 1)
      } else {
        // Изпращаме заявка за премахване на лайк
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

  const submitComment = async () => {
    if (!user) {
      Alert.alert("Моля, влезте в профила си, за да коментирате.")
      return
    }
    if (commentText.trim() === "") return
    try {
      // Изпращаме заявка за добавяне на коментар
      await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/comment`, {
        postId: post.post_id,
        userEmail: user.email,
        comment: commentText,
      })
      setCommentText("")
      setCommentCount((prev) => prev + 1)
    } catch (error) {
      console.error("Error submitting comment", error)
      Alert.alert(
        "Грешка",
        "Неуспешно добавяне на коментар, моля опитайте отново."
      )
    }
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
        <View style={styles.subContainer}>
          <FontAwesome name="commenting-o" size={24} color="black" />
          <Text style={styles.actionText}>{commentCount}</Text>
        </View>
      </View>
      <Text style={styles.commentsLink}>Виж всички коментари</Text>
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
    gap: 20,
    alignItems: "center",
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
    color: Colors.GRAY,
  },
  submitButton: {
    padding: 10,
  },
  submitButtonText: {
    color: Colors.PRIMARY,
    fontWeight: "bold",
  },
})
