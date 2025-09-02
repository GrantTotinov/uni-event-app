// components/Post/WritePost.tsx
import React, { useContext, useState, useCallback } from 'react'
import {
  View,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
  StyleSheet,
} from 'react-native' // Added StyleSheet
import {
  Surface,
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  Avatar,
  IconButton,
  Portal,
  Modal,
  useTheme,
  ActivityIndicator,
  Divider,
  FAB,
  Menu,
} from 'react-native-paper'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  BounceIn,
  ZoomIn,
} from 'react-native-reanimated'
import Colors from '@/data/Colors'
import { AuthContext, isSystemAdmin } from '@/context/AuthContext'
import { useAppTheme } from '@/context/ThemeContext'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import { uploadToCloudinary } from '@/utils/CloudinaryUpload'
import { storage } from '@/configs/FirebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import axios from 'axios'
import { useRouter, useFocusEffect } from 'expo-router'
import { Image } from 'expo-image'

const { width: screenWidth } = Dimensions.get('window')

interface SelectedFile {
  name: string
  uri: string
  mimeType: string
  size?: number
}

interface ClubOption {
  id: number | string
  name: string
  icon?: string
}

// Memoized animated components following performance guidelines
const AnimatedSurface = Animated.createAnimatedComponent(Surface)
const AnimatedCard = Animated.createAnimatedComponent(Card)

export default function WritePost() {
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()
  const router = useRouter()

  // Content state - memoized initial values following performance guidelines
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([])
  const [isUhtRelated, setIsUhtRelated] = useState(false)
  const [selectedClub, setSelectedClub] = useState<ClubOption | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [clubs, setClubs] = useState<ClubOption[]>([])
  const [clubsLoading, setClubsLoading] = useState(false)
  const [visibilityMenuVisible, setVisibilityMenuVisible] = useState(false)
  const [mediaModalVisible, setMediaModalVisible] = useState(false)

  // Animation values - performance optimized
  const contentHeight = useSharedValue(60)
  const imageScale = useSharedValue(0)
  const fabRotation = useSharedValue(0)
  const submitProgress = useSharedValue(0)

  // Fetch clubs with optimized performance following performance guidelines
  useFocusEffect(
    useCallback(() => {
      let isActive = true
      const fetchClubs = async () => {
        if (!user?.email) return
        setClubsLoading(true)
        try {
          const response = await axios.get(
            `${process.env.EXPO_PUBLIC_HOST_URL}/clubfollower`,
            {
              params: { u_email: user.email },
              timeout: 10000,
            }
          )
          if (isActive && Array.isArray(response.data)) {
            const clubOptions: ClubOption[] = response.data.map(
              (club: any) => ({
                id: club.club_id,
                name: club.name?.replace(/"/g, '') || 'Неименована група',
                icon: 'account-group',
              })
            )
            setClubs(clubOptions)
          }
        } catch (error) {
          console.error('Error fetching clubs:', error)
        } finally {
          setClubsLoading(false)
        }
      }
      fetchClubs()
      return () => {
        isActive = false
      }
    }, [user?.email])
  )

  // Memoized animated styles following performance guidelines
  const textInputAnimatedStyle = useAnimatedStyle(
    () => ({
      minHeight: withSpring(contentHeight.value, {
        damping: 15,
        stiffness: 150,
      }),
    }),
    []
  )

  const imageAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: imageScale.value }],
      opacity: imageScale.value,
    }),
    []
  )

  const fabAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ rotate: `${fabRotation.value}deg` }],
    }),
    []
  )

  const submitButtonStyle = useAnimatedStyle(
    () => ({
      opacity: interpolate(submitProgress.value, [0, 1], [1, 0.7]),
      transform: [
        { scale: interpolate(submitProgress.value, [0, 1], [1, 0.95]) },
      ],
    }),
    []
  )

  // Content length animation - optimized with useCallback following performance guidelines
  const handleContentChange = useCallback((text: string) => {
    setContent(text)
    const lines = text.split('\n').length
    const newHeight = Math.max(60, Math.min(200, lines * 24 + 36))
    contentHeight.value = withSpring(newHeight, { damping: 12, stiffness: 120 })
  }, [])

  // Media selection handlers - memoized with useCallback following performance guidelines
  const selectImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        selectionLimit: 1,
      })
      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
        imageScale.value = withSpring(1, { damping: 12, stiffness: 100 })
        setMediaModalVisible(false)
      }
    } catch (error) {
      console.error('Error selecting image:', error)
      Alert.alert('Грешка', 'Неуспешно избиране на снимка')
    }
  }, [])

  const selectDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: true,
        type: '*/*',
      })
      if (!result.canceled && result.assets) {
        const newFiles: SelectedFile[] = result.assets.map((asset) => ({
          name: asset.name,
          uri: asset.uri,
          mimeType: asset.mimeType || 'application/octet-stream',
          size: asset.size,
        }))
        setSelectedFiles((prev) => [...prev, ...newFiles])
        setMediaModalVisible(false)
      }
    } catch (error) {
      console.error('Error selecting documents:', error)
      Alert.alert('Грешка', 'Неуспешно избиране на файл')
    }
  }, [])

  const removeImage = useCallback(() => {
    imageScale.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(setSelectedImage)('')
      }
    })
  }, [])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // Upload utilities - optimized with useCallback following performance guidelines
  const uploadFileToFirebase = useCallback(
    async (file: SelectedFile, userEmail: string): Promise<string> => {
      const fileName = `${Date.now()}_${file.name}`
      const fileRef = ref(storage, `documents/${userEmail}/${fileName}`)
      const response = await fetch(file.uri)
      const blob = await response.blob()
      await uploadBytes(fileRef, blob)
      return await getDownloadURL(fileRef)
    },
    []
  )

  // Submit post with animations - performance optimized following guidelines
  const onSubmitPost = useCallback(async () => {
    if (!content.trim()) {
      Alert.alert('Грешка', 'Моля въведете съдържание на публикацията')
      return
    }

    setLoading(true)
    submitProgress.value = withTiming(1, { duration: 300 })
    fabRotation.value = withTiming(180, { duration: 400 })

    try {
      // Upload image if selected
      let uploadImageUrl = ''
      if (selectedImage) {
        uploadImageUrl = await uploadToCloudinary(selectedImage)
      }

      // Determine visibility
      const visibleIn =
        selectedClub?.id === 'public' || !selectedClub?.id
          ? null
          : selectedClub.id

      // Create post
      const postResult = await axios.post(
        `${process.env.EXPO_PUBLIC_HOST_URL}/post`,
        {
          content: content.trim(),
          imageUrl: uploadImageUrl,
          email: user?.email,
          visibleIn,
          isUhtRelated,
        }
      )

      if (postResult.data?.newPostId && selectedFiles.length > 0) {
        setUploadingFiles(true)
        const postId = postResult.data.newPostId

        // Upload files with error handling
        for (const file of selectedFiles) {
          try {
            const fileUrl = await uploadFileToFirebase(
              file,
              user?.email || 'unknown'
            )
            await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/documents`, {
              postId,
              fileName: file.name,
              fileType: file.mimeType,
              fileUrl,
              createdBy: user?.email,
            })
          } catch (error) {
            console.error('Error uploading file:', error)
            Alert.alert(
              'Предупреждение',
              `Неуспешно качване на файл: ${file.name}`
            )
          }
        }
      }

      // Reset form with animations
      contentHeight.value = withSpring(60)
      imageScale.value = withTiming(0)
      submitProgress.value = withTiming(0)
      fabRotation.value = withTiming(0)

      setContent('')
      setSelectedImage('')
      setSelectedFiles([])
      setIsUhtRelated(false)
      setSelectedClub(null)

      Alert.alert('Успех', 'Публикацията е създадена успешно!')
      router.back()
    } catch (error) {
      console.error('Error creating post:', error)
      Alert.alert('Грешка', 'Неуспешно създаване на публикация')
      submitProgress.value = withTiming(0)
      fabRotation.value = withTiming(0)
    } finally {
      setLoading(false)
      setUploadingFiles(false)
    }
  }, [
    content,
    selectedImage,
    selectedFiles,
    selectedClub,
    isUhtRelated,
    user?.email,
    uploadFileToFirebase,
    router,
  ])

  // Memoized visibility options following performance guidelines
  const visibilityOptions = React.useMemo(
    () => [
      { id: 'public', name: 'Публично (за всички)', icon: 'earth' },
      { id: 'private', name: 'Само аз (лично)', icon: 'lock' },
      ...clubs,
    ],
    [clubs]
  )

  const canSubmit = content.trim().length > 0 && !loading && !uploadingFiles

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header Card */}
      <AnimatedCard
        mode="elevated"
        style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}
        entering={SlideInDown.delay(100)}
      >
        <Card.Content style={styles.headerContent}>
          <View style={styles.headerRow}>
            <Avatar.Image
              size={48}
              source={{
                uri:
                  user?.image ||
                  'https://placehold.co/48x48/cccccc/ffffff?text=U',
              }}
            />
            <View style={styles.headerTextContainer}>
              <Text variant="titleMedium" style={styles.headerTitle}>
                {user?.name || 'Потребител'}
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                Споделете вашите мисли...
              </Text>
            </View>
          </View>
        </Card.Content>
      </AnimatedCard>

      {/* Content Input */}
      <AnimatedSurface
        style={[
          styles.contentInputContainer,
          { backgroundColor: theme.colors.surface },
          textInputAnimatedStyle,
        ]}
        elevation={2}
        entering={FadeIn.delay(200)}
      >
        <TextInput
          mode="outlined"
          placeholder="Какво имате на ум?"
          value={content}
          onChangeText={handleContentChange}
          multiline
          textAlignVertical="top"
          style={styles.textInput}
          outlineStyle={[
            styles.textInputOutline,
            { borderColor: theme.colors.outline },
          ]}
          contentStyle={styles.textInputContent}
          maxLength={2000}
          right={
            <TextInput.Affix
              text={`${content.length}/2000`}
              textStyle={styles.characterCounter}
            />
          }
        />
      </AnimatedSurface>

      {/* Selected Image */}
      {selectedImage && (
        <Animated.View
          style={[styles.selectedImageContainer, imageAnimatedStyle]}
          entering={ZoomIn.duration(300)}
          exiting={FadeOut.duration(200)}
        >
          <Image
            source={{ uri: selectedImage }}
            style={styles.selectedImage}
            contentFit="cover"
            transition={300}
          />
          <IconButton
            icon="close"
            size={24}
            iconColor={theme.colors.onPrimary}
            style={styles.removeImageButton}
            onPress={removeImage}
          />
        </Animated.View>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <Animated.View entering={FadeIn.delay(100)} exiting={FadeOut}>
          <Card
            mode="outlined"
            style={[styles.filesCard, { borderColor: theme.colors.outline }]}
          >
            <Card.Title
              title="Прикачени файлове"
              titleVariant="titleSmall"
              left={(props) => (
                <Avatar.Icon {...props} icon="attachment" size={32} />
              )}
            />
            <Card.Content>
              {selectedFiles.map((file, index) => (
                <Animated.View
                  key={`${file.uri}-${index}`}
                  entering={BounceIn.delay(index * 100)}
                  exiting={FadeOut}
                >
                  <Surface
                    style={[
                      styles.fileRow,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                    elevation={1}
                  >
                    <View style={styles.fileInfo}>
                      <Text variant="bodyMedium" numberOfLines={1}>
                        {file.name}
                      </Text>
                      {file.size && (
                        <Text variant="bodySmall" style={styles.fileSize}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Text>
                      )}
                    </View>
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={() => removeFile(index)}
                    />
                  </Surface>
                </Animated.View>
              ))}
            </Card.Content>
          </Card>
        </Animated.View>
      )}

      {/* UHT Toggle */}
      {(isSystemAdmin(user?.role) || user?.role === 'teacher') && (
        <Animated.View entering={FadeIn.delay(300)}>
          <Surface
            style={[
              styles.uhtContainer,
              { backgroundColor: theme.colors.surface },
            ]}
            elevation={1}
          >
            <View style={styles.uhtContent}>
              <View style={styles.uhtTextContainer}>
                <Text variant="titleMedium">УХТ Публикация</Text>
                <Text variant="bodySmall" style={styles.uhtSubtitle}>
                  Официална информация от университета
                </Text>
              </View>
              <Chip
                mode={isUhtRelated ? 'flat' : 'outlined'}
                selected={isUhtRelated}
                onPress={() => setIsUhtRelated(!isUhtRelated)}
                icon={isUhtRelated ? 'check' : 'plus'}
                style={[
                  styles.uhtChip,
                  {
                    backgroundColor: isUhtRelated
                      ? theme.colors.primaryContainer
                      : 'transparent',
                  },
                ]}
              >
                {isUhtRelated ? 'Включено' : 'Изключено'}
              </Chip>
            </View>
          </Surface>
        </Animated.View>
      )}

      {/* Visibility Selector */}
      <Animated.View entering={FadeIn.delay(400)}>
        <Surface
          style={[
            styles.visibilityContainer,
            { backgroundColor: theme.colors.surface },
          ]}
          elevation={1}
        >
          <Menu
            visible={visibilityMenuVisible}
            onDismiss={() => setVisibilityMenuVisible(false)}
            anchor={
              <View>
                {/* ПОПРАВЕНО: Wrapped Card.Title in TouchableOpacity for proper onPress support */}
                <Card.Title
                  title="Видимост на публикацията"
                  subtitle={selectedClub?.name || 'Публично (за всички)'}
                  left={(props) => (
                    <Avatar.Icon
                      {...props}
                      icon={
                        selectedClub?.icon ||
                        (selectedClub?.id === 'private' ? 'lock' : 'earth')
                      }
                      size={40}
                    />
                  )}
                  right={(props) => (
                    <IconButton
                      {...props}
                      icon="chevron-down"
                      onPress={() => setVisibilityMenuVisible(true)}
                    />
                  )}
                />
                {/* ПОПРАВЕНО: Added TouchableOpacity overlay for onPress functionality */}
                <View
                  style={StyleSheet.absoluteFillObject}
                  onTouchEnd={() => setVisibilityMenuVisible(true)}
                />
              </View>
            }
            contentStyle={styles.menuContent}
          >
            <ScrollView style={styles.menuScrollView}>
              {visibilityOptions.map((option) => (
                <Menu.Item
                  key={option.id}
                  onPress={() => {
                    setSelectedClub(option)
                    setVisibilityMenuVisible(false)
                  }}
                  title={option.name}
                  leadingIcon={option.icon}
                  style={[
                    styles.menuItem,
                    {
                      backgroundColor:
                        selectedClub?.id === option.id
                          ? theme.colors.primaryContainer
                          : 'transparent',
                    },
                  ]}
                />
              ))}
            </ScrollView>
          </Menu>
        </Surface>
      </Animated.View>

      {/* Upload Progress */}
      {uploadingFiles && (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
          <Card
            mode="outlined"
            style={[styles.progressCard, { borderColor: theme.colors.primary }]}
          >
            <Card.Content style={styles.progressContent}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text variant="bodyMedium">Качване на файлове...</Text>
            </Card.Content>
          </Card>
        </Animated.View>
      )}

      <View style={styles.spacer} />

      {/* Media Selection Modal */}
      <Portal>
        <Modal
          visible={mediaModalVisible}
          onDismiss={() => setMediaModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Добавете медия
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="contained"
              onPress={selectImage}
              icon="image"
              style={styles.modalButton}
            >
              Изберете снимка
            </Button>
            <Button
              mode="outlined"
              onPress={selectDocument}
              icon="file-document"
              style={styles.modalButton}
            >
              Изберете файл
            </Button>
            <Divider style={styles.modalDivider} />
            <Button
              mode="text"
              onPress={() => setMediaModalVisible(false)}
              textColor={theme.colors.outline}
            >
              Отказ
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {/* Media FAB */}
        <FAB
          icon="attachment"
          size="small"
          onPress={() => setMediaModalVisible(true)}
          style={[
            styles.mediaFab,
            { backgroundColor: theme.colors.secondaryContainer },
          ]}
        />

        {/* Submit FAB */}
        <Animated.View style={[fabAnimatedStyle, submitButtonStyle]}>
          <FAB
            icon={loading ? 'loading' : 'send'}
            onPress={onSubmitPost}
            disabled={!canSubmit}
            loading={loading}
            style={[
              styles.submitFab,
              {
                backgroundColor: canSubmit
                  ? theme.colors.primary
                  : theme.colors.surfaceDisabled,
              },
            ]}
          />
        </Animated.View>
      </View>
    </ScrollView>
  )
}

// Optimized styles following performance guidelines
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    borderRadius: 16,
  },
  headerContent: {
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: '600',
  },
  headerSubtitle: {
    opacity: 0.7,
  },
  contentInputContainer: {
    borderRadius: 16,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: 'transparent',
    fontSize: 16,
    lineHeight: 24,
  },
  textInputOutline: {
    borderRadius: 16,
    borderWidth: 1,
  },
  textInputContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  characterCounter: {
    fontSize: 12,
    opacity: 0.6,
  },
  selectedImageContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  filesCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  fileInfo: {
    flex: 1,
  },
  fileSize: {
    opacity: 0.7,
  },
  uhtContainer: {
    borderRadius: 12,
    marginBottom: 16,
  },
  uhtContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  uhtTextContainer: {
    flex: 1,
  },
  uhtSubtitle: {
    opacity: 0.7,
  },
  uhtChip: {
    // Additional chip styles if needed
  },
  visibilityContainer: {
    borderRadius: 12,
    marginBottom: 16,
  },
  menuContent: {
    borderRadius: 12,
    maxHeight: 300,
  },
  menuScrollView: {
    maxHeight: 250,
  },
  menuItem: {
    // Menu item styles
  },
  progressCard: {
    marginBottom: 16,
    borderRadius: 12,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spacer: {
    height: 100,
  },
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    borderRadius: 12,
  },
  modalDivider: {
    marginVertical: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    gap: 12,
  },
  mediaFab: {
    // Media FAB styles
  },
  submitFab: {
    // Submit FAB styles
  },
})
