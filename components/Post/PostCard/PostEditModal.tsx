import React from 'react'
import { View, TextInput, TouchableOpacity, Text, Image } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { upload } from 'cloudinary-react-native'
import { cld, options } from '@/configs/CloudinaryConfig'
import axios from 'axios'
import { isSystemAdmin } from '@/context/AuthContext'
import Colors from '@/data/Colors'
import { styles } from './styles'

interface PostEditModalProps {
  editedContent: string
  setEditedContent: (content: string) => void
  editedImageUrl: string
  setEditedImageUrl: (url: string) => void
  editedUhtRelated: boolean
  setEditedUhtRelated: (related: boolean) => void
  user: any
  post: any
  onSave: () => void
  onCancel: () => void
}

export default function PostEditModal({
  editedContent,
  setEditedContent,
  editedImageUrl,
  setEditedImageUrl,
  editedUhtRelated,
  setEditedUhtRelated,
  user,
  post,
  onSave,
  onCancel,
}: PostEditModalProps) {
  const pickEditImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5,
    })
    if (!result.canceled) {
      setEditedImageUrl(result.assets[0].uri)
    }
  }

  const saveEdits = async () => {
    try {
      let finalImageUrl = editedImageUrl
      if (editedImageUrl && !editedImageUrl.startsWith('http')) {
        await upload(cld, {
          file: editedImageUrl,
          options: options,
          callback: (_error, resp) => {
            if (resp) finalImageUrl = resp.url
          },
        })
      }

      await axios.put(`${process.env.EXPO_PUBLIC_HOST_URL}/post`, {
        postId: post.post_id,
        userEmail: user.email,
        content: editedContent,
        imageUrl: finalImageUrl,
        isUhtRelated: editedUhtRelated,
      })
      onSave()
    } catch (error) {
      console.error('Грешка при редактиране', error)
    }
  }

  return (
    <>
      <TextInput
        style={styles.editInput}
        value={editedContent}
        onChangeText={setEditedContent}
        multiline
        placeholder="Редактирайте съдържанието"
        placeholderTextColor={Colors.GRAY}
      />

      {(isSystemAdmin(user?.role) || user?.role === 'teacher') && (
        <View style={styles.uhtCheckboxContainer}>
          <TouchableOpacity
            onPress={() => setEditedUhtRelated(!editedUhtRelated)}
            style={styles.checkboxContainer}
          >
            <View
              style={[
                styles.checkbox,
                editedUhtRelated && styles.checkboxChecked,
              ]}
            >
              {editedUhtRelated && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>
              Свързано с УХТ (официална информация)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={pickEditImage}>
        {editedImageUrl ? (
          <Image source={{ uri: editedImageUrl }} style={styles.editImage} />
        ) : (
          <View style={[styles.editImage, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>Избери изображение</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.editButtons}>
        <TouchableOpacity onPress={saveEdits} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Запази</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Откажи</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}
