import React, { useContext, useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native'
import Colors from '@/data/Colors'
import Button from '@/components/Shared/Button'
import { AuthContext, isSystemAdmin } from '@/context/AuthContext'
import DropDownPicker from 'react-native-dropdown-picker'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { upload } from 'cloudinary-react-native'
import { cld, options } from '@/configs/CloudinaryConfig'
import axios from 'axios'
import { useRouter, useFocusEffect } from 'expo-router'
import { storage } from '@/configs/FirebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

type DropdownItemType = {
  label: string
  value: number | string
  key: string
}

type SelectedFile = {
  name: string
  uri: string
  mimeType: string
  size?: number
  uploadUrl?: string
}

export default function WritePost() {
  const { user } = useContext(AuthContext)
  const router = useRouter()
  const [content, setContent] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [isUhtRelated, setIsUhtRelated] = useState<boolean>(false)
  const [selectedClub, setSelectedClub] = useState<number | string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false)

  // DropDownPicker states
  const [open, setOpen] = useState<boolean>(false)
  const [value, setValue] = useState<number | string | null>(null)
  const [items, setItems] = useState<DropdownItemType[]>([
    { label: 'Публично (за всички)', value: 'public', key: 'public' },
    { label: 'Само аз (лично)', value: 0, key: 'private' },
  ])
  const [clubs, setClubs] = useState<DropdownItemType[]>([])
  const [clubsLoading, setClubsLoading] = useState<boolean>(false)

  // Always fetch clubs when screen is focused
  useFocusEffect(
    useCallback(() => {
      let isActive = true
      const fetchClubs = async () => {
        if (!user?.email) return
        setClubsLoading(true)
        try {
          const res = await axios.get(
            `${
              process.env.EXPO_PUBLIC_HOST_URL
            }/clubfollower?u_email=${encodeURIComponent(user.email)}`
          )
          if (isActive && Array.isArray(res.data)) {
            const clubOptions = res.data.map((club: any) => ({
              label: club.name,
              value: club.club_id,
              key: String(club.club_id),
            }))
            setClubs(clubOptions)
          }
        } catch (error) {
          console.error('Грешка при зареждане на клубове:', error)
        }
        setClubsLoading(false)
      }
      fetchClubs()
      return () => {
        isActive = false
      }
    }, [user?.email])
  )

  // Update dropdown items when clubs change
  React.useEffect(() => {
    setItems([
      { label: 'Публично (за всички)', value: 'public', key: 'public' },
      { label: 'Само аз (лично)', value: 0, key: 'private' },
      ...clubs,
    ])
  }, [clubs])

  const selectImage = useCallback(async () => {
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
  }, [])

  const pickDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: '*/*',
      })
      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset) => ({
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        }))
        setSelectedFiles((prev) => [...prev, ...newFiles])
      }
    } catch (error) {
      console.error('Error picking document:', error)
      Alert.alert('Грешка', 'Неуспешно избиране на файл')
    }
  }, [])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const uploadFileToFirebase = useCallback(
    async (file: SelectedFile, userEmail: string) => {
      try {
        const fileName = file.name
        const fileRef = ref(storage, `documents/${userEmail}/${fileName}`)
        const response = await fetch(file.uri)
        const blob = await response.blob()
        await uploadBytes(fileRef, blob)
        const url = await getDownloadURL(fileRef)
        return url
      } catch (error) {
        console.error('Error uploading file to Firebase:', error)
        throw error
      }
    },
    []
  )

  const onPublishPost = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert('Грешка', 'Моля въведете съдържание на публикацията')
      return
    }
    setLoading(true)
    let uploadImageUrl = ''
    try {
      // Upload image if selected
      if (selectedImage) {
        const resultData = await new Promise<string>((resolve, reject) => {
          upload(cld, {
            file: selectedImage,
            options: options,
            callback: (error: any, callResult: any) => {
              if (error) {
                reject(error)
              } else if (callResult && callResult.url) {
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
      const visibleIn = value === 'public' || value === null ? null : value

      // 1. Create the post first
      const result = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST_URL}/post`,
        {
          content: content,
          imageUrl: uploadImageUrl,
          email: user?.email,
          visibleIn: visibleIn,
          isUhtRelated: isUhtRelated,
        }
      )

      if (result.data && result.data.newPostId) {
        const postId = result.data.newPostId

        // 2. Upload files to Firebase Storage and save info to backend
        if (selectedFiles.length > 0) {
          setUploadingFiles(true)
          for (const file of selectedFiles) {
            try {
              const fileUrl = await uploadFileToFirebase(
                file,
                user?.email || 'unknown'
              )
              await axios.post(
                `${process.env.EXPO_PUBLIC_HOST_URL}/documents`,
                {
                  postId: postId,
                  fileName: file.name,
                  fileType: file.mimeType,
                  fileUrl: fileUrl,
                  createdBy: user?.email,
                }
              )
            } catch (error) {
              console.error('Error uploading document:', error)
              Alert.alert('Грешка', `Неуспешно качване на файл: ${file.name}`)
            }
          }
          setUploadingFiles(false)
        }

        // Reset form
        setContent('')
        setSelectedImage('')
        setSelectedClub(null)
        setIsUhtRelated(false)
        setSelectedFiles([])
        setValue(null)
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
  }, [
    content,
    selectedImage,
    user?.email,
    isUhtRelated,
    selectedFiles,
    value,
    uploadFileToFirebase,
    router,
  ])

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

      <TouchableOpacity onPress={pickDocument} style={styles.fileSelector}>
        <Text style={styles.fileSelectorText}>Добави файл</Text>
      </TouchableOpacity>

      {selectedFiles.length > 0 && (
        <View style={styles.selectedFilesContainer}>
          <Text style={styles.selectedFilesTitle}>Избрани файлове:</Text>
          <FlatList
            data={selectedFiles}
            keyExtractor={(item, idx) => item.uri + idx}
            renderItem={({ item, index }) => (
              <View style={styles.selectedFileRow}>
                <Text style={styles.selectedFileName}>{item.name}</Text>
                <TouchableOpacity onPress={() => removeFile(index)}>
                  <Text style={styles.removeFileText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {(isSystemAdmin(user?.role) || user?.role === 'teacher') && (
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
          onChangeValue={(val) =>
            setSelectedClub(val as number | string | null)
          }
          placeholder="Избери видимост (по подразбиране: Публично)"
          style={styles.dropdown}
          dropDownContainerStyle={[
            styles.dropdownList,
            { maxHeight: 400 }, // увеличи височината за повече видими опции
          ]}
          listItemLabelStyle={{ fontSize: 16 }}
          selectedItemLabelStyle={{ fontWeight: 'bold' }}
          placeholderStyle={{ color: Colors.GRAY }}
          listMode="SCROLLVIEW" // падащо меню с възможност за скрол
          loading={clubsLoading}
          ActivityIndicatorComponent={(props) => (
            <ActivityIndicator {...props} />
          )}
          scrollViewProps={{
            nestedScrollEnabled: true,
            persistentScrollbar: true,
          }}
          searchable={false}
          closeAfterSelecting={true}
        />
      </View>

      {uploadingFiles && (
        <View style={{ marginVertical: 10 }}>
          <ActivityIndicator size="small" color={Colors.PRIMARY} />
          <Text style={{ color: Colors.GRAY, marginTop: 5 }}>
            Качване на файлове...
          </Text>
        </View>
      )}

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
    fontSize: 16,
    color: Colors.BLACK,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
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
    borderRadius: 12,
    padding: 4,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fileSelector: {
    backgroundColor: Colors.LIGHT_GRAY,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.GRAY,
    borderStyle: 'dashed',
  },
  fileSelectorText: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
    fontSize: 16,
  },
  selectedFilesContainer: {
    marginBottom: 15,
    backgroundColor: Colors.WHITE,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.GRAY,
  },
  selectedFilesTitle: {
    fontWeight: 'bold',
    marginBottom: 5,
    color: Colors.PRIMARY,
  },
  selectedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  selectedFileName: {
    flex: 1,
    color: Colors.BLACK,
  },
  removeFileText: {
    color: Colors.RED || '#d00',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  uhtCheckboxContainer: {
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
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
    fontWeight: '500',
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
