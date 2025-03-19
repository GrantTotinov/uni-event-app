import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import React, { useContext, useState } from "react"
import Colors from "@/data/Colors"
import TextInputField from "@/components/Shared/TextInputField"
import { AuthContext } from "@/context/AuthContext"
import DateTimePicker from "@react-native-community/datetimepicker"
import RNDateTimePicker from "@react-native-community/datetimepicker"
import Button from "@/components/Shared/Button"
import moment from "moment"
import axios from "axios"
import { cld, options } from "@/configs/CloudinaryConfig"
import { upload } from "cloudinary-react-native"
import { useRouter } from "expo-router"

export default function AddEvent() {
  const [image, setImage] = useState<string>()
  const [eventName, setEventName] = useState<string>()
  const [location, setLocation] = useState<string>()
  const [link, setLink] = useState<string>()
  const [time, setTime] = useState("Избери час")
  const [date, setDate] = useState("Избери дата")
  const [selectedTime, setSelectedTime] = useState<string>()
  const [selectedDate, setSelectedDate] = useState<string>()
  const [openTimePicker, setOpenTimePicker] = useState(false)
  const [openDatePicker, setOpenDatePicker] = useState(false)
  const { user } = useContext(AuthContext)
  const router = useRouter()
  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }
  const onTimeChange = (event: any, selectedTime: any) => {
    setOpenTimePicker(false)
    console.log(selectedTime)
    setSelectedTime(selectedTime)
    setTime(moment(selectedTime).format("hh:mm a"))
  }
  const onDateChange = (event: any, selectedDate: any) => {
    setOpenDatePicker(false)
    console.log(selectedDate)
    setSelectedDate(selectedDate)
    setDate(moment(selectedDate).format("MMMM Do YYYY"))
  }
  const onSubmitBtnPress = async () => {
    upload(cld, {
      file: image,
      options: options,
      callback: async (error, resp) => {
        if (resp) {
          const result = await axios.post(
            process.env.EXPO_PUBLIC_HOST_URL + "/events",
            {
              eventName: eventName,
              bannerUrl: resp.url,
              location: location,
              link: link,
              eventDate: selectedDate,
              eventTime: selectedDate,
              email: user?.email,
            }
          )
          console.log(result)
          Alert.alert("Чудесно!", "Ново събитие беше добавено!", [
            {
              text: "OK",
              onPress: () => router.replace("/Event"),
            },
          ])
        }
      },
    })
  }
  return (
    <View
      style={{
        padding: 20,
        backgroundColor: Colors.WHITE,
        height: "100%",
      }}
    >
      <Text
        style={{
          fontSize: 25,
          fontWeight: "bold",
        }}
      >
        Добави Събитие
      </Text>

      <TouchableOpacity onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <Image
            source={require("./../../assets/images/image.png")}
            style={styles.image}
          />
        )}
      </TouchableOpacity>

      <TextInputField
        label="Име на събитието"
        onChangeText={(v) => setEventName(v)}
      />
      <TextInputField label="Локация" onChangeText={(v) => setLocation(v)} />
      <TextInputField
        label="Линк за детайли"
        onChangeText={(v) => setLink(v)}
      />
      <View>
        <Button
          text={time}
          outline={true}
          onPress={() => setOpenTimePicker(!openTimePicker)}
        />
        <Button
          text={date}
          outline={true}
          onPress={() => setOpenDatePicker(!openDatePicker)}
        />
      </View>
      {openTimePicker && (
        <RNDateTimePicker
          mode="time"
          value={new Date()}
          onChange={onTimeChange}
        />
      )}
      {openDatePicker && (
        <RNDateTimePicker
          mode="date"
          value={new Date()}
          onChange={onDateChange}
        />
      )}
      <Button text="Създай" onPress={() => onSubmitBtnPress()} />
    </View>
  )
}
const styles = StyleSheet.create({
  image: {
    width: 100,
    height: 100,
    borderRadius: 15,
    marginTop: 15,
    marginLeft: -10,
  },
})
