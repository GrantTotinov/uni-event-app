// File: components/Clubs/ClubInfo.tsx
import React, { useContext, useState, useCallback } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import {
  Surface,
  Text,
  TextInput,
  Button,
  Card,
  Avatar,
  HelperText,
  useTheme,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { uploadToCloudinary } from '@/utils/CloudinaryUpload'
import axios from 'axios'
import { AuthContext } from '@/context/AuthContext'

export default function ClubInfo() {
  const [name, setName] = useState('')
  const [about, setAbout] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [nameError, setNameError] = useState('')
  const [aboutError, setAboutError] = useState('')

  const router = useRouter()
  const theme = useTheme()
  const { user } = useContext(AuthContext)

  const validateForm = useCallback(() => {
    let isValid = true

    if (!name.trim()) {
      setNameError('Името на групата е задължително')
      isValid = false
    } else if (name.trim().length < 3) {
      setNameError('Името трябва да е поне 3 символа')
      isValid = false
    } else {
      setNameError('')
    }

    if (!about.trim()) {
      setAboutError('Описанието е задължително')
      isValid = false
    } else if (about.trim().length < 10) {
      setAboutError('Описанието трябва да е поне 10 символа')
      isValid = false
    } else {
      setAboutError('')
    }

    return isValid
  }, [name, about])

  const onAddClubBtnClick = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Upload Image
      let uploadImageUrl = ''
      if (selectedImage) {
        try {
          uploadImageUrl = await uploadToCloudinary(selectedImage)
        } catch (error) {
          Alert.alert('Грешка', 'Неуспешно качване на снимката')
          setLoading(false)
          return
        }
      }

      const result = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST_URL}/clubs`,
        {
          clubName: name.trim(),
          imageUrl: uploadImageUrl,
          about: about.trim(),
          createdBy: user?.email, // ДОБАВЕНО: createdBy field
        }
      )

      console.log('Club created:', result.data)
      Alert.alert('Успех', 'Групата беше създадена успешно!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/Club') },
      ])
    } catch (error) {
      console.error('Error creating club:', error)
      Alert.alert('Грешка', 'Неуспешно създаване на групата')
    } finally {
      setLoading(false)
    }
  }, [name, about, selectedImage, validateForm, router, user?.email])

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      Alert.alert('Грешка', 'Неуспешно избиране на снимка')
    }
  }, [])

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image Selection Card */}
        <Card style={styles.imageCard} mode="elevated" onPress={pickImage}>
          <Card.Content style={styles.imageCardContent}>
            {selectedImage ? (
              <Avatar.Image size={120} source={{ uri: selectedImage }} />
            ) : (
              <Avatar.Icon size={120} icon="camera-plus" />
            )}
            <Text variant="bodyMedium" style={styles.imageHint}>
              {selectedImage
                ? 'Натиснете за промяна'
                : 'Добавете лого на групата'}
            </Text>
          </Card.Content>
        </Card>

        {/* Form Card */}
        <Card style={styles.formCard} mode="elevated">
          <Card.Content style={styles.formContent}>
            {/* Club Name Input */}
            <View style={styles.inputContainer}>
              <TextInput
                label="Име на групата"
                value={name}
                onChangeText={setName}
                mode="outlined"
                error={!!nameError}
                maxLength={100}
                style={styles.textInput}
              />
              <HelperText type="error" visible={!!nameError}>
                {nameError}
              </HelperText>
            </View>

            {/* Club Description Input */}
            <View style={styles.inputContainer}>
              <TextInput
                label="Описание на групата"
                value={about}
                onChangeText={setAbout}
                mode="outlined"
                multiline
                numberOfLines={4}
                error={!!aboutError}
                maxLength={500}
                style={styles.textInput}
              />
              <HelperText type="error" visible={!!aboutError}>
                {aboutError}
              </HelperText>
              <HelperText type="info">{about.length}/500 символа</HelperText>
            </View>

            {/* Create Button */}
            <Button
              mode="contained"
              onPress={onAddClubBtnClick}
              loading={loading}
              disabled={loading}
              style={styles.createButton}
              icon="plus"
            >
              Създай група
            </Button>
          </Card.Content>
        </Card>

        {/* Guidelines Card */}
        <Card style={styles.guidelinesCard} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.guidelinesTitle}>
              📋 Насоки за създаване
            </Text>
            <Text variant="bodyMedium" style={styles.guidelineText}>
              • Изберете ясно и описно име
            </Text>
            <Text variant="bodyMedium" style={styles.guidelineText}>
              • Добавете подробно описание на дейностите
            </Text>
            <Text variant="bodyMedium" style={styles.guidelineText}>
              • Качете привлекателно лого или снимка
            </Text>
            <Text variant="bodyMedium" style={styles.guidelineText}>
              • Спазвайте правилата на университета
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </Surface>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  imageCard: {
    marginBottom: 24,
  },
  imageCardContent: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  imageHint: {
    opacity: 0.7,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: 24,
  },
  formContent: {
    paddingVertical: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: 'transparent',
  },
  createButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  guidelinesCard: {
    marginBottom: 20,
  },
  guidelinesTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  guidelineText: {
    marginBottom: 4,
    opacity: 0.8,
  },
})
