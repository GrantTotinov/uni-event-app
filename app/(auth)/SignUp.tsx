import { View, Text, Image } from "react-native"
import React from "react"
import Ionicons from "@expo/vector-icons/Ionicons"
import Colors from "@/data/Colors"
import TextInputField from "@/components/Shared/TextInputField"
import Button from "@/components/Shared/Button"

export default function SignUp() {
  const onBtnPress = () => {}
  return (
    <View
      style={{
        padding: 20,
        paddingTop: 60,
      }}
    >
      <Text
        style={{
          fontSize: 25,
          fontWeight: "bold",
        }}
      >
        Създайте нов акаунт
      </Text>

      <View
        style={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <View>
          <Image
            style={{
              width: 140,
              height: 140,
              borderRadius: 99,
              marginTop: 20,
            }}
            source={require("./../../assets/images/profile.png")}
          />
          <Ionicons
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
            }}
            name="camera"
            size={35}
            color={Colors.PRIMARY}
          />
        </View>
      </View>
      <TextInputField
        label="Име, Фамилия"
        onChangeText={(v) => console.log()}
      />
      <TextInputField label="Емайл" onChangeText={(v) => console.log()} />
      <TextInputField
        label="Парола"
        password={true}
        onChangeText={(v) => console.log()}
      />

      <Button text="Създайте акаунт" onPress={() => onBtnPress()} />
    </View>
  )
}
