import { useCallback } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'

export const useImagePicker = () => {
  const pickImage = useCallback(async (): Promise<string | null> => {
    try {
      // Проверяваме разрешенията
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (status !== 'granted') {
        Alert.alert(
          'Разрешение',
          'Необходимо е разрешение за достъп до галерията'
        )
        return null
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        selectionLimit: 1,
      })

      if (!result.canceled && result.assets[0]) {
        return result.assets[0].uri
      }

      return null
    } catch (error) {
      console.error('Error picking image:', error)
      Alert.alert('Грешка', 'Неуспешно избиране на снимка')
      return null
    }
  }, [])

  return { pickImage }
}
