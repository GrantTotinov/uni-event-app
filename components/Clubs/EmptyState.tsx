import { View, Text, Image } from "react-native"
import Button from "../Shared/Button"
import Colors from "@/data/Colors"
import { useRouter } from "expo-router"

export default function EmptyState() {
  const router = useRouter()
  return (
    <View
      style={{
        display: "flex",
        alignItems: "center",
        marginTop: 50,
      }}
    >
      <Image
        source={require("./../../assets/images/no-club.png")}
        style={{
          width: 170,
          height: 170,
        }}
      />
      <Text
        style={{
          fontSize: 22,
          textAlign: "center",
          color: Colors.GRAY,
        }}
      >
        Все още не участвате в никакви Клубове/Групи
      </Text>
      <Button
        text="Открии Клубове/Групи"
        onPress={() => router.push("/explore-clubs")}
      />
    </View>
  )
}
