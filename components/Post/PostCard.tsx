import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native"
import React, { useContext, useEffect, useState } from "react"
import UserAvatar from "./UserAvatar"
import Colors from "@/data/Colors"
import AntDesign from "@expo/vector-icons/AntDesign"
import FontAwesome from "@expo/vector-icons/FontAwesome"
import moment from "moment-timezone"
import "moment/locale/bg"
import axios from "axios"
import { AuthContext } from "@/context/AuthContext"

moment.locale("bg")

export default function PostCard({ post }: any) {
  const { user } = useContext(AuthContext)

  // Започваме с начални стойности от 0/false (ако не са предадени от бекенда)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  // Преобразуване на датата
  const createdAt = post?.createdon
    ? moment
        .utc(post.createdon)
        .tz("Europe/Sofia")
        .add(2, "hours")
        .toISOString()
    : "Няма дата"

  // При mount на компонента, правим заявка за актуалните данни
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        // Вземаме броя лайкове за поста
        const res = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/post-like?postId=${post.post_id}`
        )
        setLikeCount(res.data.likeCount)

        // Ако има логнат потребител, проверяваме дали е харесал поста
        if (user) {
          const resLiked = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/post-like?postId=${post.post_id}&userEmail=${user.email}`
          )
          setIsLiked(resLiked.data.isLiked)
        }
      } catch (error) {
        console.error("Error loading like status", error)
      }
    }

    fetchLikeStatus()
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
        setLikeCount((prev: number) => prev + 1)
      } else {
        // Изпращаме заявка за премахване на лайк
        await axios.delete(`${process.env.EXPO_PUBLIC_HOST_URL}/post-like`, {
          data: { postId: post.post_id, userEmail: user.email },
        })
        setIsLiked(false)
        setLikeCount((prev: number) => prev - 1)
      }
    } catch (error) {
      console.error("Error toggling like", error)
      Alert.alert("Грешка", "Нещо се обърка, моля опитайте отново.")
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
          <Text style={styles.actionText}>25</Text>
        </View>
      </View>
      <Text style={styles.commentsLink}>Виж всички коментари</Text>
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
})
