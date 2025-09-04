import React, {
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'
import {
  ScrollView,
  Alert,
  StatusBar,
  StyleSheet,
  View,
  Platform,
  Dimensions,
} from 'react-native'
import {
  Surface,
  Text,
  TextInput,
  Button,
  Card,
  Avatar,
  IconButton,
  Portal,
  Modal,
  useTheme,
  ActivityIndicator,
  FAB,
  Divider,
} from 'react-native-paper'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
} from 'react-native-reanimated'
import * as ImagePicker from 'expo-image-picker'
import RNDateTimePicker from '@react-native-community/datetimepicker'
import moment from 'moment'
import 'moment/locale/bg'
import axios from 'axios'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'

import { uploadToCloudinary } from '@/utils/CloudinaryUpload'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'
import { useAppTheme } from '@/context/ThemeContext'

const { width: screenWidth } = Dimensions.get('window')

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

// Memoized animated components following performance guidelines
const AnimatedSurface = Animated.createAnimatedComponent(Surface)
const AnimatedCard = Animated.createAnimatedComponent(Card)

const AddEvent = React.memo(function AddEvent() {
  moment.locale('bg')
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()
  const navigation = useNavigation()
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

  const isEdit = edit === '1'

  // Form state - memoized initial values following performance guidelines
  const [eventName, setEventName] = useState<string>('')
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [link, setLink] = useState<string>('')
  const [details, setDetails] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // UI state
  const [loading, setLoading] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [mediaModalVisible, setMediaModalVisible] = useState(false)

  // Animation values - performance optimized
  const imageScale = useSharedValue(0)
  const submitProgress = useSharedValue(0)
  const fabRotation = useSharedValue(0)

  // Memoized theme colors for performance
  const colors = useMemo(
    () => ({
      surface: theme.colors.surface,
      onSurface: theme.colors.onSurface,
      primary: theme.colors.primary,
      onPrimary: theme.colors.onPrimary,
      surfaceVariant: theme.colors.surfaceVariant,
      onSurfaceVariant: theme.colors.onSurfaceVariant,
      outline: theme.colors.outline,
      background: theme.colors.background,
      primaryContainer: theme.colors.primaryContainer,
      onPrimaryContainer: theme.colors.onPrimaryContainer,
      error: theme.colors.error,
      onError: theme.colors.onError,
    }),
    [theme.colors]
  )

  // Header title
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: isEdit ? 'Редактирай събитие' : 'Създай ново събитие',
      headerTitleStyle: {
        fontWeight: '600',
      },
    })
  }, [navigation, isEdit])

  // Initialize form on edit - performance optimized
  useEffect(() => {
    if (!isEdit) return

    if (paramName && paramName !== eventName) setEventName(paramName)
    if (paramBannerUrl && paramBannerUrl !== selectedImage) {
      setSelectedImage(paramBannerUrl)
      imageScale.value = withSpring(1, { damping: 12, stiffness: 100 })
    }
    if (paramLocation && paramLocation !== location) setLocation(paramLocation)
    if (paramLink !== undefined && paramLink !== link) setLink(paramLink)
    if (paramDetails !== undefined && paramDetails !== details)
      setDetails(paramDetails)

    if (paramEventTime && paramEventTime !== selectedTime.toTimeString()) {
      const [h, m] = paramEventTime.split(':')
      const newTime = new Date()
      newTime.setHours(parseInt(h || '0'), parseInt(m || '0'))
      setSelectedTime(newTime)
    }

    if (paramEventDate && paramEventDate !== selectedDate.toDateString()) {
      const parts = paramEventDate.split(',')
      if (parts.length > 1) {
        const dateString = parts[1]
        const parsed = new Date(dateString)
        setSelectedDate(parsed)
      } else {
        const parsed = new Date(paramEventDate)
        setSelectedDate(parsed)
      }
    }
  }, [isEdit, paramName, paramBannerUrl, paramLocation, paramLink, paramDetails, paramEventTime, paramEventDate])

  // Memoized animated styles following performance guidelines
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

  // Media selection handlers - memoized with useCallback following performance guidelines
  const selectImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
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

  const removeImage = useCallback(() => {
    setSelectedImage('')
    imageScale.value = withTiming(0, { duration: 200 })
  }, [])

  // Date/Time handlers - performance optimized
  const handleTimeChange = useCallback((_event: any, selectedTime?: Date) => {
    setShowTimePicker(false)
    if (selectedTime) {
      setSelectedTime(selectedTime)
    }
  }, [])

  const handleDateChange = useCallback((_event: any, selectedDate?: Date) => {
    setShowDatePicker(false)
    if (selectedDate) {
      setSelectedDate(selectedDate)
    }
  }, [])

  // Form submission - performance optimized following guidelines
  const onSubmitEvent = useCallback(async () => {
    if (!eventName.trim() || !selectedImage || !location.trim()) {
      Alert.alert('Грешка', 'Моля попълнете всички задължителни полета')
      return
    }

    setLoading(true)
    submitProgress.value = withTiming(1, { duration: 300 })
    fabRotation.value = withTiming(180, { duration: 400 })

    try {
      // Upload image if it's not already a URL
      let finalImageUrl = selectedImage
      if (!selectedImage.startsWith('http')) {
        finalImageUrl = await uploadToCloudinary(selectedImage)
      }

      // Format date and time
      const formattedDate = `${moment(selectedDate).format('dddd')},${moment(
        selectedDate
      ).format('YYYY-MM-DD')}`
      const formattedTime = moment(selectedTime).format('HH:mm')

      if (isEdit) {
        // Update existing event
        await axios.put(`${process.env.EXPO_PUBLIC_HOST_URL}/events`, {
          eventId: id,
          userEmail: user?.email,
          eventName: eventName.trim(),
          bannerUrl: finalImageUrl,
          location: location.trim(),
          link: link.trim() || null,
          details: details.trim() || null,
          eventDate: formattedDate,
          eventTime: formattedTime,
        })

        Alert.alert('Успех', 'Събитието е обновено успешно!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/Event') },
        ])
      } else {
        // Create new event
        await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/events`, {
          eventName: eventName.trim(),
          bannerUrl: finalImageUrl,
          location: location.trim(),
          link: link.trim() || null,
          details: details.trim() || null,
          eventDate: formattedDate,
          eventTime: formattedTime,
          email: user?.email,
        })

        Alert.alert('Успех', 'Събитието е създадено успешно!', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/Event') },
        ])
      }

      // Reset form with animations
      imageScale.value = withTiming(0)
      submitProgress.value = withTiming(0)
      fabRotation.value = withTiming(0)

      setEventName('')
      setSelectedImage('')
      setLocation('')
      setLink('')
      setDetails('')
      setSelectedTime(new Date())
      setSelectedDate(new Date())
    } catch (error) {
      console.error('Error submitting event:', error)
      Alert.alert('Грешка', 'Неуспешно запазване на събитието')
      submitProgress.value = withTiming(0)
      fabRotation.value = withTiming(0)
    } finally {
      setLoading(false)
    }
  }, [
    eventName,
    selectedImage,
    location,
    link,
    details,
    selectedTime,
    selectedDate,
    isEdit,
    id,
    user?.email,
    router,
  ])

  // Memoized computed values
  const canSubmit = useMemo(() => {
    return (
      eventName.trim().length > 0 &&
      selectedImage &&
      location.trim().length > 0 &&
      !loading
    )
  }, [eventName, selectedImage, location, loading])

  const formattedTime = useMemo(() => {
    return moment(selectedTime).format('HH:mm')
  }, [selectedTime])

  const formattedDate = useMemo(() => {
    return moment(selectedDate).format('DD MMMM YYYY, dddd')
  }, [selectedDate])

  return (
    <Surface style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.surface}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Card */}
        <AnimatedCard
          mode="elevated"
          style={[styles.headerCard, { backgroundColor: colors.surface }]}
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
                <Text
                  variant="titleMedium"
                  style={[styles.headerTitle, { color: colors.onSurface }]}
                >
                  {user?.name || 'Потребител'}
                </Text>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.headerSubtitle,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {isEdit
                    ? 'Редактирайте събитието...'
                    : 'Създайте ново събитие...'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </AnimatedCard>

        {/* Event Name Input */}
        <AnimatedSurface
          style={[styles.inputContainer, { backgroundColor: colors.surface }]}
          elevation={2}
          entering={FadeIn.delay(200)}
        >
          <TextInput
            mode="outlined"
            label="Име на събитието *"
            placeholder="Въведете име на събитието..."
            value={eventName}
            onChangeText={setEventName}
            style={styles.textInput}
            outlineStyle={[
              styles.textInputOutline,
              { borderColor: colors.outline },
            ]}
            maxLength={100}
            right={
              <TextInput.Affix
                text={`${eventName.length}/100`}
                textStyle={[
                  styles.characterCounter,
                  { color: colors.onSurfaceVariant },
                ]}
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
              iconColor={colors.onPrimary}
              style={styles.removeImageButton}
              onPress={removeImage}
            />
          </Animated.View>
        )}

        {/* Location Input */}
        <AnimatedSurface
          style={[styles.inputContainer, { backgroundColor: colors.surface }]}
          elevation={2}
          entering={FadeIn.delay(300)}
        >
          <TextInput
            mode="outlined"
            label="Локация *"
            placeholder="Въведете локация..."
            value={location}
            onChangeText={setLocation}
            style={styles.textInput}
            outlineStyle={[
              styles.textInputOutline,
              { borderColor: colors.outline },
            ]}
            maxLength={100}
          />
        </AnimatedSurface>

        {/* Link Input */}
        <AnimatedSurface
          style={[styles.inputContainer, { backgroundColor: colors.surface }]}
          elevation={2}
          entering={FadeIn.delay(400)}
        >
          <TextInput
            mode="outlined"
            label="Линк за детайли"
            placeholder="https://..."
            value={link}
            onChangeText={setLink}
            style={styles.textInput}
            outlineStyle={[
              styles.textInputOutline,
              { borderColor: colors.outline },
            ]}
            keyboardType="url"
          />
        </AnimatedSurface>

        {/* Details Input */}
        <AnimatedSurface
          style={[styles.inputContainer, { backgroundColor: colors.surface }]}
          elevation={2}
          entering={FadeIn.delay(500)}
        >
          <TextInput
            mode="outlined"
            label="Детайли за събитието"
            placeholder="Опишете подробно събитието..."
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
            style={[styles.textInput, styles.detailsInput]}
            outlineStyle={[
              styles.textInputOutline,
              { borderColor: colors.outline },
            ]}
            maxLength={500}
            right={
              <TextInput.Affix
                text={`${details.length}/500`}
                textStyle={[
                  styles.characterCounter,
                  { color: colors.onSurfaceVariant },
                ]}
              />
            }
          />
        </AnimatedSurface>

        {/* Date & Time Section */}
        <Animated.View entering={FadeIn.delay(600)}>
          <Card
            mode="outlined"
            style={[styles.dateTimeCard, { borderColor: colors.outline }]}
          >
            <Card.Title
              title="Дата и час"
              subtitle="Изберете кога ще се проведе събитието"
              left={(props) => (
                <Avatar.Icon {...props} icon="calendar-clock" size={40} />
              )}
            />
            <Card.Content>
              <View style={styles.dateTimeContainer}>
                <Button
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  icon="calendar"
                  style={styles.dateTimeButton}
                >
                  {formattedDate}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => setShowTimePicker(true)}
                  icon="clock"
                  style={styles.dateTimeButton}
                >
                  {formattedTime}
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Animated.View>

        {/* Action Buttons Section */}
        <Animated.View
          entering={FadeIn.delay(700)}
          style={styles.actionSection}
        >
          <Button
            mode="outlined"
            onPress={() => setMediaModalVisible(true)}
            icon="image"
            style={styles.actionButton}
          >
            {selectedImage ? 'Смени изображение' : 'Добави изображение *'}
          </Button>

          <Divider style={styles.divider} />

          <Animated.View style={submitButtonStyle}>
            <Button
              mode="contained"
              onPress={onSubmitEvent}
              loading={loading}
              disabled={!canSubmit}
              icon={isEdit ? 'content-save' : 'plus'}
              style={[
                styles.submitButton,
                {
                  backgroundColor: canSubmit
                    ? colors.primary
                    : colors.surfaceVariant,
                },
              ]}
              labelStyle={{
                color: canSubmit ? colors.onPrimary : colors.onSurfaceVariant,
              }}
            >
              {loading
                ? 'Запазване...'
                : isEdit
                ? 'Запази промените'
                : 'Създай събитие'}
            </Button>
          </Animated.View>
        </Animated.View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
        <FAB
          icon={
            canSubmit ? (isEdit ? 'content-save' : 'check') : 'alert-circle'
          }
          onPress={onSubmitEvent}
          disabled={!canSubmit}
          loading={loading}
          style={[
            styles.fab,
            {
              backgroundColor: canSubmit
                ? colors.primary
                : colors.surfaceVariant,
            },
          ]}
          theme={{
            colors: {
              primaryContainer: canSubmit
                ? colors.primary
                : colors.surfaceVariant,
              onPrimaryContainer: canSubmit
                ? colors.onPrimary
                : colors.onSurfaceVariant,
            },
          }}
        />
      </Animated.View>

      {/* Date Picker */}
      {showDatePicker && (
        <RNDateTimePicker
          mode="date"
          value={selectedDate}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <RNDateTimePicker
          mode="time"
          value={selectedTime}
          onChange={handleTimeChange}
        />
      )}

      {/* Media Selection Modal */}
      <Portal>
        <Modal
          visible={mediaModalVisible}
          onDismiss={() => setMediaModalVisible(false)}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text
            variant="headlineSmall"
            style={[styles.modalTitle, { color: colors.onSurface }]}
          >
            Добавете изображение
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="contained"
              onPress={selectImage}
              icon="image"
              style={styles.modalButton}
            >
              Избери от галерия
            </Button>
            <Button
              mode="outlined"
              onPress={() => setMediaModalVisible(false)}
              style={styles.modalButton}
            >
              Отказ
            </Button>
          </View>
        </Modal>
      </Portal>
    </Surface>
  )
})

// Optimized styles following performance guidelines
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
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
  inputContainer: {
    borderRadius: 16,
    marginBottom: 16,
  },
  textInput: {
    backgroundColor: 'transparent',
    fontSize: 16,
  },
  textInputOutline: {
    borderRadius: 16,
    borderWidth: 1,
  },
  detailsInput: {
    minHeight: 120,
    textAlignVertical: 'top',
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
  dateTimeCard: {
    borderRadius: 16,
    marginBottom: 16,
  },
  dateTimeContainer: {
    gap: 12,
  },
  dateTimeButton: {
    borderRadius: 12,
  },
  actionSection: {
    gap: 16,
  },
  actionButton: {
    borderRadius: 12,
  },
  divider: {
    marginVertical: 8,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 8,
  },
  spacer: {
    height: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
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
})

export default AddEvent
