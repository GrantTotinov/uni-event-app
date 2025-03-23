import { View, Text, Image, StyleSheet } from "react-native"
import React from "react"
import UserAvatar from "./UserAvatar"
import Colors from "@/data/Colors"
import AntDesign from "@expo/vector-icons/AntDesign"
import FontAwesome from "@expo/vector-icons/FontAwesome"
import moment from "moment-timezone"
import "moment/locale/bg"

moment.locale("bg")

export default function PostCard({ post }: any) {
  // Проверяваме дали има дата и я конвертираме с добавени 2 часа
  const createdAt = post?.createdon
    ? moment
        .utc(post.createdon)
        .tz("Europe/Sofia")
        .add(2, "hours")
        .toISOString()
    : "Няма дата"
  return (
    <View
      style={{
        padding: 15,
        backgroundColor: Colors.WHITE,
        borderRadius: 8,
        marginTop: 10,
      }}
    >
      <UserAvatar name={post?.name} image={post?.image} date={createdAt} />
      <Text
        style={{
          fontSize: 18,
          marginTop: 10,
        }}
      >
        {post?.content}
      </Text>

      {post.imageurl && (
        <Image
          source={{ uri: post.imageurl }}
          style={{
            width: "100%",
            height: 300,
            objectFit: "cover",
            borderRadius: 10,
          }}
        />
      )}
      <View
        style={{
          marginTop: 10,
          display: "flex",
          flexDirection: "row",
          gap: 20,
          alignItems: "center",
        }}
      >
        <View style={styles.subContainer}>
          <AntDesign name="like2" size={24} color="black" />
          <Text
            style={{
              fontSize: 17,
              color: Colors.GRAY,
            }}
          >
            25
          </Text>
        </View>
        <View style={styles.subContainer}>
          <FontAwesome name="commenting-o" size={24} color="black" />
          <Text
            style={{
              fontSize: 17,
              color: Colors.GRAY,
            }}
          >
            25
          </Text>
        </View>
      </View>
      <Text
        style={{
          marginTop: 7,
          color: Colors.GRAY,
        }}
      >
        Виж всички коментари
      </Text>
    </View>
  )
}
const styles = StyleSheet.create({
  subContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
})
