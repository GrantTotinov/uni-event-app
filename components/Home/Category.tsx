import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native"
import React from "react"
import Colors from "@/data/Colors"
import { useRouter } from "expo-router"

const categoryOptions = [
  {
    name: "Предстоящи събития",
    banner: require("./../../assets/images/events.png"),
    path: "/(tabs)/Event",
  },
  {
    name: "Последна публикация",
    banner: require("./../../assets/images/latestpost.png"),
    path: "/(tabs)/Home",
  },
  {
    name: "Клубове",
    banner: require("./../../assets/images/clubs.png"),
    path: "/(tabs)/Club",
  },
  {
    name: "Добави нова публикация",
    banner: require("./../../assets/images/addpost.png"),
    path: "/add-post",
  },
]

export default function Category() {
  const router = useRouter()
  return (
    <View
      style={{
        marginTop: 15,
      }}
    >
      <FlatList
        data={categoryOptions}
        numColumns={2}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            //@ts-ignore
            onPress={() => router.push(item.path)}
            style={styles.cartContainer}
          >
            <Image source={item.banner} style={styles.bannerImage} />
            <Text style={styles.text}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  cartContainer: {
    margin: 5,
  },
  bannerImage: {
    height: 100,
    objectFit: "cover",
    width: Dimensions.get("screen").width * 0.43,
  },
  text: {
    position: "absolute",
    padding: 10,
    fontSize: 17,
    color: Colors.WHITE,
    fontWeight: "400",
  },
})
