import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  ToastAndroid,
} from "react-native"
import React, { useContext, useState } from "react"
import Colors from "@/data/Colors"
import DropDownPicker from "react-native-dropdown-picker"
import Button from "../Shared/Button"
import * as ImagePicker from "expo-image-picker"
import { upload } from "cloudinary-react-native"
import { cld, options } from "@/configs/CloudinaryConfig"
import axios from "axios"
import { AuthContext } from "@/context/AuthContext"
import { useRouter } from "expo-router"

export default function WritePost() {
  const [selectedImage, setSelectedImage] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(null)
  const [content, setContent] = useState<string | null>()
  const { user } = useContext(AuthContext)
  const router = useRouter()
  const [item, setItems] = useState([
    { label: "Public", value: "Public" },
    { label: "ABC Club", value: "ABC Club" },
  ])
  const onPostBtnClick = async () => {
    if (!content) {
      ToastAndroid.show(
        "Полето е празно. Моля въведете текст",
        ToastAndroid.BOTTOM
      )
      return
    }
    setLoading(true)
    // Upload image
    let uploadImageUrl = ""
    if (selectedImage) {
      const resultData: any = await new Promise(async (resolve, reject) => {
        await upload(cld, {
          file: selectedImage,
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
      uploadImageUrl = resultData && resultData?.url
    }
    const result = await axios.post(
      process.env.EXPO_PUBLIC_HOST_URL + "/post",
      {
        content: content,
        imageUrl: uploadImageUrl,
        visibleIn: value,
        email: user.email,
      }
    )
    console.log(result.data)
    setLoading(false)
    router.replace("/(tabs)/Home")
  }
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5,
    })

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri)
    }
  }
  return (
    <View>
      <TextInput
        placeholder="Напиши своята публикация тук..."
        style={styles.textInput}
        multiline={true}
        numberOfLines={5}
        maxLength={1000}
        onChangeText={(value) => setContent(value)}
      />

      <TouchableOpacity onPress={pickImage}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.image} />
        ) : (
          <Image
            source={require("./../../assets/images/image.png")}
            style={styles.image}
          />
        )}
      </TouchableOpacity>
      <View
        style={{
          marginTop: 15,
        }}
      >
        <DropDownPicker
          items={item}
          open={open}
          value={value}
          setOpen={setOpen}
          setValue={setValue}
          setItems={setItems}
          style={{
            borderWidth: 0,
            elevation: 3,
          }}
        />
      </View>
      <Button
        text="Публикувай"
        onPress={() => onPostBtnClick()}
        loading={loading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  textInput: {
    padding: 15,
    backgroundColor: Colors.WHITE,
    height: 140,
    marginTop: 10,
    borderRadius: 15,
    textAlignVertical: "top",
    elevation: 7,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 15,
    marginTop: 15,
    marginLeft: -10,
  },
})
