import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native"
import React, { useState } from "react"
import Colors from "@/data/Colors"
import DropDownPicker from "react-native-dropdown-picker"
import Button from "../Shared/Button"
import * as ImagePicker from "expo-image-picker"

export default function WritePost() {
  const [selectedImage, setSelectedImage] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(null)
  const [item, setItems] = useState([
    { label: "Public", value: "Public" },
    { label: "ABC Club", value: "ABC Club" },
  ])
  const onPostBtnClick = () => {}
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
