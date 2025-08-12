import React, { useContext, useEffect, useState } from "react"
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native"
import Colors from "@/data/Colors"
import Button from "@/components/Shared/Button"
import { AuthContext, isAdmin } from "@/context/AuthContext"
import DropDownPicker from "react-native-dropdown-picker"
import * as ImagePicker from "expo-image-picker"
import { upload } from "cloudinary-react-native"
import { cld, options } from "@/configs/CloudinaryConfig"
import axios from "axios"
import { useRouter } from "expo-router"

export default function WritePost() {
  const [post, setPost] = useState<string>("")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedClub, setSelectedClub] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isUhtRelated, setIsUhtRelated] = useState(false)

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(null)
  const [items, setItems] = useState([{ label: "Публично", value: null }])

  const { user } = useContext(AuthContext)
  const router = useRouter()

  useEffect(() => {
    GetUserFollowedClubs()
  }, [])

  const onPublishPost = async () => {
    if (!post) {
      Alert.alert("Моля добавете съдържание")
      return
    }

    setLoading(true)
    let imageUrl = ""

    try {
      if (selectedImage) {
        await upload(cld, {
          file: selectedImage,
          options: options,
          callback: (_error, response) => {
            if (response?.url) {
              imageUrl = response.url
            }
          },
        })
      }

      const resp = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST_URL}/post`,
        {
          content: post,
          imageUrl: imageUrl,
          email: user?.email,
          visibleIn: selectedClub,
          isUhtRelated: isUhtRelated,
        }
      )

      if (resp) {
        setPost("")
        setSelectedImage(null)
        setSelectedClub(null)
        setIsUhtRelated(false)
        Alert.alert("Успешно", "Публикацията е създадена!", [
          { text: "OK", onPress: () => router.replace("/(tabs)/Home") },
        ])
      }
    } catch (error) {
      console.error("Error creating post:", error)
      Alert.alert("Грешка", "Неуспешно създаване на публикация")
    }

    setLoading(false)
  }

  const selectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5,
    })

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const GetUserFollowedClubs = async () => {
    const result = await axios.get(
      process.env.EXPO_PUBLIC_HOST_URL + "/clubfollower?u_email=" + user?.email
    )
    console.log(result?.data)
    const data = result.data?.map((item: any) => ({
      label: item?.name,
      value: item.club_id,
    }))
    console.log(data)
    setItems((prev) => [...prev, ...data])
  }

  return (
    <View>
      <TextInput
        placeholder="Напиши своята публикация тук..."
        style={styles.textInput}
        multiline={true}
        numberOfLines={5}
        maxLength={1000}
        onChangeText={(value) => setPost(value)}
        value={post}
      />

      <TouchableOpacity onPress={selectImage} style={styles.imageSelector}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Добави изображение</Text>
          </View>
        )}
      </TouchableOpacity>

      {(isAdmin(user?.role) || user?.role === "teacher") && (
        <View style={styles.uhtCheckboxContainer}>
          <TouchableOpacity
            onPress={() => setIsUhtRelated(!isUhtRelated)}
            style={styles.checkboxContainer}
          >
            <View
              style={[styles.checkbox, isUhtRelated && styles.checkboxChecked]}
            >
              {isUhtRelated && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Свързано с УХТ (официална информация)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.dropdownContainer}>
        <Text style={styles.dropdownLabel}>Видимост на публикацията:</Text>
        <DropDownPicker
          open={open}
          value={value}
          items={items}
          setOpen={setOpen}
          setValue={setValue}
          setItems={setItems}
          onChangeValue={(value) => setSelectedClub(value)}
          placeholder="Избери видимост"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownList}
        />
      </View>

      <Button text="Публикувай" onPress={onPublishPost} loading={loading} />
    </View>
  )
}

const styles = StyleSheet.create({
  textInput: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 10,
    padding: 10,
    paddingTop: 15,
    textAlignVertical: "top",
    minHeight: 100,
    marginBottom: 15,
  },
  imageSelector: {
    marginBottom: 15,
  },
  selectedImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  imagePlaceholder: {
    height: 100,
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 10,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: Colors.GRAY,
    fontSize: 16,
  },
  uhtCheckboxContainer: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
  },
  checkboxChecked: {
    backgroundColor: Colors.PRIMARY,
  },
  checkmark: {
    color: Colors.WHITE,
    fontSize: 14,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.BLACK,
    flex: 1,
    fontWeight: "500",
  },
  dropdownContainer: {
    marginBottom: 20,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: Colors.BLACK,
  },
  dropdown: {
    borderColor: Colors.GRAY,
    borderRadius: 8,
  },
  dropdownList: {
    borderColor: Colors.GRAY,
  },
})
