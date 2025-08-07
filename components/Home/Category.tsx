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
import { scale, verticalScale, moderateScale } from "react-native-size-matters"

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

const ITEM_WIDTH = Dimensions.get("screen").width * 0.42
const ITEM_HEIGHT = verticalScale(130)

export default function Category() {
  const router = useRouter()
  return (
    <View style={{ marginTop: verticalScale(15) }}>
      <FlatList
        data={categoryOptions}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity
            //onPress={() => router.push(item.path)}
            style={styles.cartContainer}
          >
            <View style={styles.imageWrapper}>
              <Image source={item.banner} style={styles.bannerImage} />
              <Text style={styles.text} numberOfLines={2} adjustsFontSizeToFit>
                {item.name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  cartContainer: {
    margin: scale(10),
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  imageWrapper: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: scale(18),
    overflow: "hidden",
    backgroundColor: Colors.WHITE,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    borderRadius: scale(18),
    resizeMode: "cover",
    position: "absolute",
    top: 0,
    left: 0,
  },
  text: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [
      { translateX: -ITEM_WIDTH / 2 + scale(10) },
      { translateY: -moderateScale(10) },
    ],
    width: ITEM_WIDTH - scale(20),
    textAlign: "center",
    fontSize: moderateScale(16),
    color: Colors.WHITE,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: scale(1), height: scale(1) },
    textShadowRadius: scale(2),
    paddingHorizontal: scale(10),
  },
})
