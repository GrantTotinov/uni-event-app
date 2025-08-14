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

// Define the type for dropdown items to match DropDownPicker's expected type
type DropdownItemType = {
  label: string
  value: number | string
  key: string
}

export default function WritePost() {
  const { user } = useContext(AuthContext)
  const router = useRouter()
  const [content, setContent] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [isUhtRelated, setIsUhtRelated] = useState<boolean>(false)
  const [selectedClub, setSelectedClub] = useState<number | string | null>(null)

  // DropDownPicker states
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<number | string | null>(null)
  const [items, setItems] = useState<DropdownItemType[]>([
    { label: 'Публично (за всички)', value: 'public', key: 'public' },
    { label: 'Само аз (лично)', value: 0, key: 'private' },
  ])

  // Fetch user's followed clubs using existing clubfollower API
  useEffect(() => {
    const fetchUserClubs = async () => {
      if (!user?.email) return

      try {
        // Use existing clubfollower API to get clubs user follows
        const followedResponse = await axios.get(
          `${
            process.env.EXPO_PUBLIC_HOST_URL
          }/clubfollower?u_email=${encodeURIComponent(user.email)}`
        )

        // Get all clubs to find ones created by user
        const allClubsResponse = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/clubs`
        )

        const followedClubs = followedResponse.data || []
        const allClubs = allClubsResponse.data || []

        // Find clubs created by user
        const createdClubs = allClubs.filter(
          (club: any) => club.createdby === user.email
        )

        // Combine followed and created clubs (remove duplicates)
        const userClubs = [
          ...followedClubs.map((club: any) => ({
            ...club,
            membership_type: 'follower',
          })),
          ...createdClubs.map((club: any) => ({
            club_id: club.id,
            name: club.name,
            membership_type: 'creator',
          })),
        ]

        // Remove duplicates based on club_id
        const uniqueClubs = userClubs.filter(
          (club, index, self) =>
            index === self.findIndex((c) => c.club_id === club.club_id)
        )

        if (uniqueClubs.length > 0) {
          const clubItems: DropdownItemType[] = uniqueClubs.map(
            (club: any) => ({
              label: `${club.name} (${
                club.membership_type === 'creator' ? 'създател' : 'член'
              })`,
              value: club.club_id,
              key: `club-${club.club_id}`,
            })
          )

          // Add club items to existing public and private options
          setItems((prevItems) => [...prevItems, ...clubItems])
        }
      } catch (error) {
        console.error('Error fetching user clubs:', error)
        // Don't show alert for network errors, user can still create public posts
      }
    }

    fetchUserClubs()
  }, [user?.email])

  const onPublishPost = async () => {
    if (!content.trim()) {
      Alert.alert('Грешка', 'Моля въведете съдържание на публикацията')
      return
    }

    setLoading(true)

    try {
      let uploadImageUrl = ''

      if (selectedImage) {
        const resultData = await new Promise<string>((resolve, reject) => {
          upload(cld, {
            file: selectedImage,
            options: options,
            callback: (error: any, callResult: any) => {
              if (error) {
                reject(error)
              } else if (callResult && callResult.url) {
                // callResult is the Cloudinary upload response which has a url property
                resolve(callResult.url)
              } else {
                resolve('')
              }
            },
          })
        })
        uploadImageUrl = resultData
      }

      // Determine the visibleIn value to send to the server
      const visibleIn =
        selectedClub === 'public'
          ? null
          : selectedClub === null
          ? null
          : selectedClub

      const result = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST_URL}/post`,
        {
          content: content,
          imageUrl: uploadImageUrl,
          email: user?.email,
          visibleIn: visibleIn, // null for public, 0 for private, club_id for specific club
          isUhtRelated: isUhtRelated,
        }
      )

      if (result.data) {
        // Reset form
        setContent('')
        setSelectedImage('')
        setSelectedClub(null)
        setValue(null)
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
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.5,
      })

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Error selecting image:', error)
      Alert.alert('Грешка', 'Неуспешно избиране на снимка')
    }
  }

  return (
    <View style={{ marginTop: 25 }}>
      <TextInput
        placeholder="Какво имате на ум?"
        value={content}
        onChangeText={setContent}
        style={styles.textInput}
        multiline
        numberOfLines={5}
        placeholderTextColor={Colors.GRAY}
      />

      <TouchableOpacity onPress={selectImage} style={styles.imageSelector}>
        <Text style={styles.imageSelectorText}>Добави снимка</Text>
      </TouchableOpacity>

      {selectedImage && (
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          <TouchableOpacity
            onPress={() => setSelectedImage('')}
            style={styles.removeImageButton}
          >
            <Text style={styles.removeImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

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
          onChangeValue={(value) =>
            setSelectedClub(value as number | string | null)
          }
          placeholder="Избери видимост (по подразбиране: Публично)"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownList}
          listItemLabelStyle={{ fontSize: 16 }}
          selectedItemLabelStyle={{ fontWeight: 'bold' }}
          placeholderStyle={{ color: Colors.GRAY }}
          listMode="SCROLLVIEW"
          scrollViewProps={{
            nestedScrollEnabled: true,
          }}
          searchable={false}
          closeAfterSelecting={true}
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
    fontSize: 16,
    color: Colors.BLACK,
  },
  imageSelector: {
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderStyle: 'dashed',
  },
  imageSelectorText: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 15,
    alignItems: 'center',
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  uhtCheckboxContainer: {
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: Colors.PRIMARY,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
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
    flex: 1,
  },
  dropdownContainer: {
    marginBottom: 15,
    zIndex: 1000,
  },
  dropdownLabel: {
    fontSize: 15,
    marginBottom: 5,
    color: Colors.GRAY,
    fontWeight: '500',
  },
  dropdown: {
    borderColor: Colors.GRAY,
    borderRadius: 10,
    minHeight: 40,
    backgroundColor: Colors.WHITE,
  },
  dropdownList: {
    borderColor: Colors.GRAY,
    borderRadius: 10,
    backgroundColor: Colors.WHITE,
    maxHeight: 200,
  },
})
