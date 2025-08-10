import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import React, { useContext, useState, useEffect } from "react"
import Colors from "@/data/Colors"
import TextInputField from "@/components/Shared/TextInputField"
import { AuthContext } from "@/context/AuthContext"
import RNDateTimePicker from "@react-native-community/datetimepicker"
import Button from "@/components/Shared/Button"
import moment from "moment"
import "moment/locale/bg"
import axios from "axios"
import { cld, options } from "@/configs/CloudinaryConfig"
import { upload } from "cloudinary-react-native"
import { useRouter, useLocalSearchParams } from "expo-router"

export default function AddEvent() {
  moment.locale("bg")
  const [image, setImage] = useState<string>()
  const [eventName, setEventName] = useState<string>()
  const [location, setLocation] = useState<string>()
  const [link, setLink] = useState<string>()
  const [time, setTime] = useState("Избери час")
  const [date, setDate] = useState("Избери дата")
  const [selectedTime, setSelectedTime] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [openTimePicker, setOpenTimePicker] = useState(false)
  const [openDatePicker, setOpenDatePicker] = useState(false)
  const [dayInBulgarian, setDayInBulgarian] = useState<string>("")
  const { user } = useContext(AuthContext)
  const router = useRouter()

  const params = useLocalSearchParams<{
    edit?: string
    id?: string
    name?: string
    bannerurl?: string
    location?: string
    link?: string
    event_date?: string
    event_time?: string
  }>()
  const isEdit = params.edit === "1"

  // FIXED - Променил useEffect зависимостите
  useEffect(() => {
    if (isEdit) {
      // Зареждаме данните само веднъж при инициализация
      if (params.name) setEventName(params.name)
      if (params.bannerurl) setImage(params.bannerurl)
      if (params.location) setLocation(params.location)
      if (params.link) setLink(params.link)

      if (params.event_time) {
        setTime(params.event_time)
        const timeDate = new Date()
        const [hours, minutes] = params.event_time.split(":")
        timeDate.setHours(parseInt(hours), parseInt(minutes))
        setSelectedTime(timeDate)
      }

      if (params.event_date) {
        const dateParts = params.event_date.split(",")
        if (dateParts.length > 1) {
          const dateString = dateParts[1]
          setDate(params.event_date)
          setDayInBulgarian(dateParts[0])
          const parsedDate = new Date(dateString)
          setSelectedDate(parsedDate)
        } else {
          setDate(params.event_date)
          const parsedDate = new Date(params.event_date)
          setSelectedDate(parsedDate)
          setDayInBulgarian(moment(parsedDate).format("dddd"))
        }
      }
    }
  }, [isEdit]) // FIXED - Зависи само от isEdit, не от params

  const pickImage = async () => {
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
    if (selectedTime) {
      setSelectedTime(selectedTime)
      setTime(moment(selectedTime).format("HH:mm"))
    }
  }

  const onDateChange = (event: any, selectedDate: any) => {
    setOpenDatePicker(false)
    if (selectedDate) {
      setSelectedDate(selectedDate)
      const dayInBulgarian = moment(selectedDate).format("dddd")
      setDayInBulgarian(dayInBulgarian)
      setDate(`${dayInBulgarian},${moment(selectedDate).format("YYYY-MM-DD")}`)
    }
  }

  const onSubmitBtnPress = async () => {
    if (!eventName || !image || !location || !date || !time) {
      Alert.alert("Моля въведете всички полета")
      return
    }

    if (isEdit) {
      let finalBannerUrl = image
      try {
        if (!image.startsWith("http")) {
          await upload(cld, {
            file: image,
            options: options,
            callback: async (error, resp) => {
              if (resp) finalBannerUrl = resp.url
            },
          })
        }

        await axios.put(process.env.EXPO_PUBLIC_HOST_URL + "/events", {
          eventId: params.id,
          userEmail: user?.email,
          eventName: eventName,
          bannerUrl: finalBannerUrl,
          location,
          link,
          eventDate: date.includes(",")
            ? date
            : `${dayInBulgarian},${moment(selectedDate).format("YYYY-MM-DD")}`,
          eventTime:
            time === "Избери час" ? moment(selectedTime).format("HH:mm") : time,
        })

        Alert.alert("Успешно", "Събитието е обновено.", [
          { text: "OK", onPress: () => router.replace("/(tabs)/Event") },
        ])
      } catch (e) {
        console.error(e)
        Alert.alert("Грешка", "Неуспешна редакция.")
      }
      return
    }

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
              eventDate: `${dayInBulgarian},${moment(selectedDate).format(
                "YYYY-MM-DD"
              )}`,
              eventTime: moment(selectedTime).format("HH:mm"),
              email: user?.email,
            }
          )
          console.log(result)
          Alert.alert("Чудесно!", "Ново събитие беше добавено!", [
            {
              text: "OK",
              onPress: () => router.replace("/(tabs)/Event"),
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
        {isEdit ? "Редактирай събитие" : "Добави Събитие"}
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
        value={eventName}
      />
      <TextInputField
        label="Локация"
        onChangeText={(v) => setLocation(v)}
        value={location}
      />
      <TextInputField
        label="Линк за детайли"
        onChangeText={(v) => setLink(v)}
        value={link}
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
          value={selectedTime}
          onChange={onTimeChange}
        />
      )}

      {openDatePicker && (
        <RNDateTimePicker
          mode="date"
          value={selectedDate}
          onChange={onDateChange}
        />
      )}

      <Button
        text={isEdit ? "Запази промените" : "Създай"}
        onPress={() => onSubmitBtnPress()}
      />
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
