import {
  View,
  Image,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ToastAndroid,
} from "react-native"
import React, { useContext, useState } from "react"
import * as ImagePicker from "expo-image-picker"
import Colors from "@/data/Colors"
import Button from "@/components/Shared/Button"
import { upload } from "cloudinary-react-native"
import { cld, options } from "@/configs/CloudinaryConfig"
import axios from "axios"
import { useRouter } from "expo-router"

export default function ClubInfo() {
  const [name, setName] = useState<string | null>()
  const [about, setAbout] = useState<string | null>()
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [selectedImage, setSelectedImage] = useState<string | undefined>()
  const onAddClubBtnClick = async () => {
    if (!name) {
      ToastAndroid.show("Моля попълнете полетата", ToastAndroid.BOTTOM)
      return
    }
    if (!about) {
      ToastAndroid.show("Моля попълнете полетата", ToastAndroid.BOTTOM)
      return
    }
    setLoading(true)
    // Upload Image
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
      process.env.EXPO_PUBLIC_HOST_URL + "/clubs",
      {
        clubName: name,
        imageUrl: uploadImageUrl,
        about: about,
      }
    )
    console.log(result.data)
    setLoading(false)
    router.replace("/(tabs)/Club")
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
    <View
      style={{
        padding: 20,
      }}
    >
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
      <Text style={styles.text}>Име на клуба / групата</Text>
      <TextInput
        placeholder="Напиши име на клуба / групата"
        style={styles.textInput}
        multiline={true}
        numberOfLines={2}
        maxLength={1000}
        onChangeText={(value) => setName(value)}
      />
      <Text style={styles.text}>Описание на клуба / групата</Text>
      <TextInput
        placeholder="Напиши кратко описание на клуба / групата"
        style={styles.textInput}
        multiline={true}
        numberOfLines={2}
        maxLength={1000}
        onChangeText={(value) => setAbout(value)}
      />

      <Button
        text=" + Създай"
        onPress={() => onAddClubBtnClick()}
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
  text: {
    color: Colors.GRAY,
    margin: 5,
  },
})
