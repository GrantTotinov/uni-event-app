import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import * as ImagePicker from "expo-image-picker"
import React, { useContext, useEffect, useLayoutEffect, useState } from "react"
import RNDateTimePicker from "@react-native-community/datetimepicker"
import moment from "moment"
import "moment/locale/bg"
import axios from "axios"
import { upload } from "cloudinary-react-native"
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router"

import Colors from "@/data/Colors"
import TextInputField from "@/components/Shared/TextInputField"
import Button from "@/components/Shared/Button"
import { AuthContext } from "@/context/AuthContext"
import { cld, options } from "@/configs/CloudinaryConfig"

type RouteParams = {
  edit?: string
  id?: string
  name?: string
  bannerurl?: string
  location?: string
  link?: string
  event_date?: string
  event_time?: string
  details?: string
}

export default function AddEvent() {
  moment.locale("bg")
  const navigation = useNavigation()
  const { user } = useContext(AuthContext)
  const router = useRouter()

  const params = useLocalSearchParams<RouteParams>()
  const {
    edit,
    id,
    name: paramName,
    bannerurl: paramBannerUrl,
    location: paramLocation,
    link: paramLink,
    event_date: paramEventDate,
    event_time: paramEventTime,
    details: paramDetails,
  } = params

  const isEdit = edit === "1"

  const [image, setImage] = useState<string>()
  const [eventName, setEventName] = useState<string>()
  const [location, setLocation] = useState<string>()
  const [link, setLink] = useState<string>()
  const [details, setDetails] = useState<string>("")
  const [time, setTime] = useState("Избери час")
  const [date, setDate] = useState("Избери дата")
  const [selectedTime, setSelectedTime] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [openTimePicker, setOpenTimePicker] = useState(false)
  const [openDatePicker, setOpenDatePicker] = useState(false)
  const [dayInBulgarian, setDayInBulgarian] = useState<string>("")

  // Header title
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEdit ? "Редактирай събитие" : "Създай Ново Събитие",
    })
  }, [navigation, isEdit])

  // Initialize form on edit (avoid using object "params" as dependency to prevent infinite loops)
  useEffect(() => {
    if (!isEdit) return

    if (paramName && paramName !== eventName) setEventName(paramName)
    if (paramBannerUrl && paramBannerUrl !== image) setImage(paramBannerUrl)
    if (paramLocation && paramLocation !== location) setLocation(paramLocation)
    if (paramLink !== undefined && paramLink !== link) setLink(paramLink)
    if (paramDetails !== undefined && paramDetails !== details)
      setDetails(paramDetails)

    if (paramEventTime && paramEventTime !== time) {
      setTime(paramEventTime)
      const t = new Date()
      const [h, m] = paramEventTime.split(":")
      t.setHours(parseInt(h || "0"), parseInt(m || "0"))
      setSelectedTime(t)
    }

    if (paramEventDate && paramEventDate !== date) {
      const parts = paramEventDate.split(",")
      if (parts.length > 1) {
        const dateString = parts[1]
        setDate(paramEventDate)
        setDayInBulgarian(parts[0])
        const parsed = new Date(dateString)
        setSelectedDate(parsed)
      } else {
        setDate(paramEventDate)
        const parsed = new Date(paramEventDate)
        setSelectedDate(parsed)
        setDayInBulgarian(moment(parsed).format("dddd"))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEdit,
    paramName,
    paramBannerUrl,
    paramLocation,
    paramLink,
    paramDetails,
    paramEventTime,
    paramEventDate,
  ])

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5,
    })
    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  const onTimeChange = (_e: any, selected: any) => {
    setOpenTimePicker(false)
    if (selected) {
      setSelectedTime(selected)
      setTime(moment(selected).format("HH:mm"))
    }
  }

  const onDateChange = (_e: any, selected: any) => {
    setOpenDatePicker(false)
    if (selected) {
      setSelectedDate(selected)
      const dayBg = moment(selected).format("dddd")
      setDayInBulgarian(dayBg)
      setDate(`${dayBg},${moment(selected).format("YYYY-MM-DD")}`)
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
            callback: async (_error, resp) => {
              if (resp) finalBannerUrl = resp.url
            },
          })
        }

        await axios.put(process.env.EXPO_PUBLIC_HOST_URL + "/events", {
          eventId: id,
          userEmail: user?.email,
          eventName,
          bannerUrl: finalBannerUrl,
          location,
          link,
          details,
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

    // Create
    upload(cld, {
      file: image,
      options: options,
      callback: async (_error, resp) => {
        if (resp) {
          try {
            await axios.post(process.env.EXPO_PUBLIC_HOST_URL + "/events", {
              eventName,
              bannerUrl: resp.url,
              location,
              link,
              details,
              eventDate: `${dayInBulgarian},${moment(selectedDate).format(
                "YYYY-MM-DD"
              )}`,
              eventTime: moment(selectedTime).format("HH:mm"),
              email: user?.email,
            })
            Alert.alert("Чудесно!", "Ново събитие беше добавено!", [
              { text: "OK", onPress: () => router.replace("/(tabs)/Event") },
            ])
          } catch (err) {
            console.error(err)
            Alert.alert("Грешка", "Неуспешно добавяне на събитие.")
          }
        }
      },
    })
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.WHITE }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 25, fontWeight: "bold" }}>
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
          onChangeText={setEventName}
          value={eventName}
        />
        <TextInputField
          label="Локация"
          onChangeText={setLocation}
          value={location}
        />
        <TextInputField
          label="Линк за детайли"
          onChangeText={setLink}
          value={link}
        />

        <View style={{ marginTop: 8, marginBottom: 10 }}>
          <Text style={{ fontWeight: "600", marginBottom: 4 }}>
            Детайли за събитието
          </Text>
          <TextInput
            placeholder="Опишете подробно събитието..."
            value={details}
            onChangeText={setDetails}
            multiline
            style={styles.detailsInput}
            placeholderTextColor={Colors.GRAY}
          />
        </View>

        <View>
          <Button
            text={time}
            outline
            onPress={() => setOpenTimePicker(!openTimePicker)}
          />
          <Button
            text={date}
            outline
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
          onPress={onSubmitBtnPress}
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
  detailsInput: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    color: "#000",
  },
})
