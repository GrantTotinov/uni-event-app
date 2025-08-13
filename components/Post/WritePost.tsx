import React, { useContext, useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native'
import Colors from '@/data/Colors'
import Button from '@/components/Shared/Button'
import { AuthContext, isAdmin } from '@/context/AuthContext'
import DropDownPicker from 'react-native-dropdown-picker'
import * as ImagePicker from 'expo-image-picker'
import { upload } from 'cloudinary-react-native'
import { cld, options } from '@/configs/CloudinaryConfig'
import axios from 'axios'
import { useRouter } from 'expo-router'

export default function WritePost() {
  const [post, setPost] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedClub, setSelectedClub] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [isUhtRelated, setIsUhtRelated] = useState(false)

  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(null)
  // Ensure each item has a unique key
  const [items, setItems] = useState([
    { label: 'Публично', value: undefined, key: 'public' },
  ])

  const { user } = useContext(AuthContext)
  const router = useRouter()

  useEffect(() => {
    GetUserFollowedClubs()
  }, [])

  const onPublishPost = async () => {
    if (!post) {
      Alert.alert('Моля добавете съдържание')
      return
    }

    setLoading(true)
    let imageUrl = ''

    try {
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
        imageUrl = resultData && resultData?.url
      }

      const payload: any = {
        content: post,
        userEmail: user?.email,
        imageUrl: imageUrl,
        isUhtRelated,
      }
      if (selectedClub) {
        payload.clubId = selectedClub
      }

      const response = await axios.post(
        process.env.EXPO_PUBLIC_HOST_URL + '/post',
        payload
      )

      if (response.data && response.data.post_id) {
        setPost('')
        setSelectedImage(null)
        setSelectedClub(null)
        setIsUhtRelated(false)
        Alert.alert('Успех', 'Публикацията е създадена успешно!')
        router.back()
      } else {
        Alert.alert('Грешка', 'Неуспешно създаване на публикация')
      }
    } catch (error) {
      console.error('Грешка при създаване на публикация:', error)
      Alert.alert('Грешка', 'Неуспешно създаване на публикация')
    }

    setLoading(false)
  }

  const selectImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5,
    })

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri)
    }
  }

  const GetUserFollowedClubs = async () => {
    try {
      const result = await axios.get(
        process.env.EXPO_PUBLIC_HOST_URL +
          '/clubfollower?u_email=' +
          user?.email
      )
      // Map clubs to items with unique keys
      const data = result.data?.map((item: any) => ({
        label: item?.name?.replace(/^"|"$/g, ''), // Remove extra quotes if present
        value: item.club_id,
        key: String(item.club_id),
      }))
      setItems([
        { label: 'Публично', value: undefined, key: 'public' },
        ...(data || []),
      ])
    } catch (error) {
      console.error('Error fetching followed clubs:', error)
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

      {(isAdmin(user?.role) || user?.role === 'teacher') && (
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
          onChangeValue={(value) => setSelectedClub(value as number | null)}
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
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 15,
  },
  imageSelector: {
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    borderWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
    backgroundColor: Colors.WHITE,
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: Colors.LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: Colors.GRAY,
    fontSize: 14,
  },
  uhtCheckboxContainer: {
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    borderRadius: 5,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.WHITE,
  },
  checkboxChecked: {
    backgroundColor: Colors.PRIMARY,
  },
  checkmark: {
    color: Colors.WHITE,
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.PRIMARY,
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownLabel: {
    fontSize: 15,
    marginBottom: 5,
    color: Colors.GRAY,
  },
  dropdown: {
    borderColor: Colors.GRAY,
    borderRadius: 10,
    minHeight: 40,
  },
  dropdownList: {
    borderColor: Colors.GRAY,
    borderRadius: 10,
  },
})
