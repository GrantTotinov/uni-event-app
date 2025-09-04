import React, {
  useContext,
  useEffect,
  useState,
  memo,
  useCallback,
  useMemo,
} from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native'
import { Entypo, Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import axios from 'axios'
import moment from 'moment'
import 'moment/locale/bg'

import Colors from '@/data/Colors'
import { AuthContext, isSystemAdmin } from '@/context/AuthContext'
import { useEvents } from '@/hooks/useEvents'
import { useAppTheme } from '@/context/ThemeContext'
import type { Event } from '@/hooks/useEvents'

moment.locale('bg')

const { width } = Dimensions.get('window')

interface EVENT extends Event {
  onUnregister?: () => void
  onDelete?: () => void
}

// Memoized component following performance guidelines
const EventCard = memo(function EventCard({
  onUnregister,
  onDelete,
  ...event
}: EVENT) {
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const router = useRouter()

  // Use the events hook for mutations
  const { registerMutation, unregisterMutation, interestMutation } = useEvents({
    userEmail: user?.email,
  })

  // Local state for UI updates - performance optimized
  const [isRegistered, setIsRegistered] = useState(event.isRegistered ?? false)
  const [isInterested, setIsInterested] = useState(event.isInterested ?? false)
  const [registeredCount, setRegisteredCount] = useState(
    event.registeredCount ?? 0
  )
  const [interestedCount, setInterestedCount] = useState(
    event.interestedCount ?? 0
  )

  const canManage = isSystemAdmin(user?.role) || user?.email === event.createdby

  // Enhanced theme colors with better light/dark contrast - performance optimized
  const colors = useMemo(
    () => ({
      // Surface colors
      surface: isDarkMode ? '#1a1a1a' : '#ffffff',
      surfaceVariant: isDarkMode ? '#2a2a2a' : '#f5f5f5',
      surfaceContainer: isDarkMode ? '#1e1e1e' : '#fafafa',

      // Text colors
      onSurface: isDarkMode ? '#ffffff' : '#1a1a1a',
      onSurfaceVariant: isDarkMode ? '#c7c7c7' : '#5f5f5f',
      onPrimary: '#ffffff',

      // Primary colors
      primary: Colors.PRIMARY,
      primaryContainer: isDarkMode ? '#1a4d47' : '#e0f2f1',
      onPrimaryContainer: isDarkMode ? '#7dd3c0' : '#00695c',

      // Secondary colors for interest
      secondary: '#4caf50',
      secondaryContainer: isDarkMode ? '#1b5e20' : '#e8f5e8',
      onSecondaryContainer: isDarkMode ? '#81c784' : '#2e7d32',

      // Error colors for unregister
      error: '#f44336',
      errorContainer: isDarkMode ? '#5d1a1a' : '#ffebee',
      onErrorContainer: isDarkMode ? '#ef9a9a' : '#c62828',

      // Outline and shadow
      outline: isDarkMode ? '#404040' : '#e0e0e0',
      shadow: isDarkMode ? '#000000' : '#000000',

      // Special interest colors
      interestActive: '#4caf50',
      interestInactive: isDarkMode ? '#666666' : '#9e9e9e',
    }),
    [isDarkMode]
  )

  // Memoized styles for theme support - performance optimized
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: colors.surface,
          marginHorizontal: 16,
          marginVertical: 8,
          borderRadius: 16,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 12,
          elevation: 6,
          overflow: 'hidden',
          borderWidth: isDarkMode ? 1 : 0,
          borderColor: colors.outline,
        },
        shareButton: {
          position: 'absolute',
          top: 12,
          right: 12,
          backgroundColor: 'rgba(0,0,0,0.7)',
          borderRadius: 22,
          width: 44,
          height: 44,
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        },
        imageContainer: {
          position: 'relative',
        },
        eventImage: {
          width: '100%',
          height: 220,
          backgroundColor: colors.surfaceVariant,
        },
        contentContainer: {
          padding: 20,
        },
        eventTitle: {
          fontSize: 20,
          fontWeight: '700',
          color: colors.onSurface,
          marginBottom: 8,
          lineHeight: 26,
          letterSpacing: 0.2,
        },
        eventDate: {
          fontSize: 16,
          color: colors.primary,
          fontWeight: '600',
          marginBottom: 8,
          letterSpacing: 0.1,
        },
        eventLocation: {
          fontSize: 15,
          color: colors.onSurfaceVariant,
          marginBottom: 8,
          lineHeight: 20,
        },
        createdBy: {
          fontSize: 13,
          color: colors.onSurfaceVariant,
          marginBottom: 16,
          fontStyle: 'italic',
          opacity: 0.8,
        },
        statsContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 20,
          paddingHorizontal: 8,
        },
        statItem: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceContainer,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          flex: 1,
          marginHorizontal: 4,
        },
        statText: {
          fontSize: 13,
          fontWeight: '600',
          marginLeft: 6,
          flex: 1,
        },
        interestedText: {
          color: colors.secondary,
        },
        registeredText: {
          color: colors.primary,
        },
        buttonsContainer: {
          flexDirection: 'row',
          gap: 12,
          marginTop: 4,
        },

        // Enhanced Interest Button Styles
        interestButton: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 12,
          borderWidth: 2,
          minHeight: 48,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.2 : 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        interestButtonActive: {
          backgroundColor: colors.secondaryContainer,
          borderColor: colors.interestActive,
        },
        interestButtonInactive: {
          backgroundColor: 'transparent',
          borderColor: colors.outline,
        },
        interestButtonText: {
          fontSize: 14,
          fontWeight: '600',
          marginLeft: 6,
          letterSpacing: 0.2,
        },
        interestButtonTextActive: {
          color: colors.onSecondaryContainer,
        },
        interestButtonTextInactive: {
          color: colors.onSurfaceVariant,
        },

        // Enhanced Register Button Styles
        registerButton: {
          flex: 1,
          minHeight: 48,
        },
        registerButtonContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderRadius: 12,
          minHeight: 48,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.2 : 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
        registerButtonActive: {
          backgroundColor: colors.primary,
          borderWidth: 0,
        },
        registerButtonOutline: {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.error,
        },
        registerButtonText: {
          fontSize: 14,
          fontWeight: '600',
          marginLeft: 6,
          letterSpacing: 0.2,
        },
        registerButtonTextActive: {
          color: colors.onPrimary,
        },
        registerButtonTextOutline: {
          color: colors.error,
        },

        // Loading states
        loadingOpacity: {
          opacity: 0.7,
        },
      }),
    [colors, isDarkMode]
  )

  // Sync with props when they change - performance optimized
  useEffect(() => {
    setIsRegistered(event.isRegistered ?? false)
    setIsInterested(event.isInterested ?? false)
    setRegisteredCount(event.registeredCount ?? 0)
    setInterestedCount(event.interestedCount ?? 0)
  }, [
    event.isRegistered,
    event.isInterested,
    event.registeredCount,
    event.interestedCount,
  ])

  // Memoized handlers following performance guidelines
  const openDetails = useCallback(() => {
    try {
      router.push({ pathname: '/event/[id]', params: { id: String(event.id) } })
    } catch (error) {
      console.error('Navigation error:', error)
      Alert.alert('Грешка', 'Неуспешно отваряне на детайли.')
    }
  }, [router, event.id])

  const handleRegister = useCallback(() => {
    if (!user?.email) {
      Alert.alert('Вход', 'Трябва да сте влезли.')
      return
    }

    Alert.alert('Регистрация за събитие!', 'Потвърди регистрацията!', [
      {
        text: 'Потвърдете',
        onPress: () => {
          registerMutation.mutate(
            {
              eventId: event.id,
              userEmail: user.email,
            },
            {
              onSuccess: () => {
                setIsRegistered(true)
                setRegisteredCount((prev) => prev + 1)
                Alert.alert('Успех!', 'Регистрирахте се успешно!')
              },
              onError: (error) => {
                console.error('Register error', error)
                Alert.alert('Грешка!', 'Неуспешна регистрация.')
              },
            }
          )
        },
      },
      { text: 'Отказ', style: 'cancel' },
    ])
  }, [user?.email, event.id, registerMutation])

  const handleUnregister = useCallback(() => {
    if (!user?.email) {
      Alert.alert('Вход', 'Трябва да сте влезли.')
      return
    }

    Alert.alert(
      'Отписване от събитие!',
      'Сигурни ли сте, че искате да се отпишете?',
      [
        {
          text: 'Да',
          onPress: () => {
            unregisterMutation.mutate(
              {
                eventId: event.id,
                userEmail: user.email,
              },
              {
                onSuccess: () => {
                  setIsRegistered(false)
                  setRegisteredCount((prev) => Math.max(0, prev - 1))
                  Alert.alert('Готово!', 'Вече не сте записани за събитието.')
                  onUnregister && onUnregister()
                },
                onError: (error) => {
                  console.error('Unregister error', error)
                  Alert.alert('Грешка!', 'Неуспешно отписване.')
                },
              }
            )
          },
        },
        { text: 'Отказ', style: 'cancel' },
      ]
    )
  }, [user?.email, event.id, unregisterMutation, onUnregister])

  const handleInterest = useCallback(async () => {
    if (!user?.email) {
      Alert.alert('Вход', 'Трябва да сте влезли.')
      return
    }

    try {
      interestMutation.mutate(
        {
          eventId: event.id,
          userEmail: user.email,
          isInterested,
        },
        {
          onSuccess: () => {
            if (!isInterested) {
              setIsInterested(true)
              setInterestedCount((prev) => prev + 1)
            } else {
              setIsInterested(false)
              setInterestedCount((prev) => Math.max(0, prev - 1))
            }
          },
          onError: (error) => {
            console.error('Interest toggle error', error)
            Alert.alert('Грешка!', 'Неуспешна операция.')
          },
        }
      )
    } catch (error) {
      console.error('Interest toggle error', error)
      Alert.alert('Грешка!', 'Неуспешна операция.')
    }
  }, [user?.email, event.id, isInterested, interestMutation])

  const handleShare = useCallback(async () => {
    try {
      const eventLink = `https://academix.bg/event/${event.id}`
      const shareText = `🎉 ${event.name}\n\n📅 ${event.event_date} в ${event.event_time}\n📍 ${event.location}\n\n${eventLink}`

      const isSharingAvailable = await Sharing.isAvailableAsync()

      if (event.bannerurl && isSharingAvailable) {
        const downloadResult = await FileSystem.downloadAsync(
          event.bannerurl,
          FileSystem.cacheDirectory + `event-${event.id}.jpg`
        )

        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(downloadResult.uri, {
            dialogTitle: `Сподели ${event.name}`,
            UTI: 'public.jpeg',
            mimeType: 'image/jpeg',
          })
        } else {
          await Sharing.shareAsync(downloadResult.uri)
        }
        return
      }

      if (isSharingAvailable) {
        const fileUri = FileSystem.cacheDirectory + 'shared-event.txt'
        await FileSystem.writeAsStringAsync(fileUri, shareText)
        await Sharing.shareAsync(fileUri)
        return
      }

      // Fallback to clipboard
      Alert.alert(
        'Споделяне',
        'Информацията за събитието е копирана. Можете да я поставите където желаете.',
        [{ text: 'OK' }]
      )
    } catch (error) {
      console.error('Share error:', error)
      Alert.alert('Грешка', 'Неуспешно споделяне.')
    }
  }, [event])

  // Memoized formatted date - performance optimized
  const formattedDate = useMemo(() => {
    return `${event.event_date} в ${event.event_time}`
  }, [event.event_date, event.event_time])

  // Memoized loading state - performance optimized
  const isLoading = useMemo(() => {
    return (
      registerMutation.isPending ||
      unregisterMutation.isPending ||
      interestMutation.isPending
    )
  }, [
    registerMutation.isPending,
    unregisterMutation.isPending,
    interestMutation.isPending,
  ])

  return (
    <TouchableOpacity
      style={dynamicStyles.card}
      onPress={openDetails}
      activeOpacity={0.95}
      accessibilityRole="button"
      accessibilityLabel={`Събитие ${event.name}`}
    >
      {/* Event Image with Share Button */}
      <View style={dynamicStyles.imageContainer}>
        <Image
          source={{ uri: event.bannerurl }}
          style={dynamicStyles.eventImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          placeholderContentFit="cover"
          accessibilityLabel={`Изображение на ${event.name}`}
        />

        {/* Enhanced Share Button Overlay */}
        <TouchableOpacity
          style={dynamicStyles.shareButton}
          onPress={handleShare}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Сподели събитие"
        >
          <Ionicons name="share-outline" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Event Content */}
      <View style={dynamicStyles.contentContainer}>
        {/* Event Name */}
        <Text
          style={dynamicStyles.eventTitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {event.name}
        </Text>

        {/* Event Date */}
        <Text style={dynamicStyles.eventDate}>{formattedDate}</Text>

        {/* Event Location */}
        <Text
          style={dynamicStyles.eventLocation}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          📍 {event.location}
        </Text>

        {/* Created By */}
        <Text style={dynamicStyles.createdBy}>
          Организирано от {event.username}
        </Text>

        {/* Enhanced Stats Row */}
        <View style={dynamicStyles.statsContainer}>
          {/* Interested Count */}
          <View style={dynamicStyles.statItem}>
            <Ionicons name="heart" size={16} color={colors.secondary} />
            <Text
              style={[dynamicStyles.statText, dynamicStyles.interestedText]}
              numberOfLines={1}
            >
              {interestedCount} интерес
            </Text>
          </View>

          {/* Registered Count */}
          <View style={dynamicStyles.statItem}>
            <Ionicons name="people" size={16} color={colors.primary} />
            <Text
              style={[dynamicStyles.statText, dynamicStyles.registeredText]}
              numberOfLines={1}
            >
              {registeredCount} записани
            </Text>
          </View>
        </View>

        {/* Enhanced Action Buttons */}
        <View
          style={[
            dynamicStyles.buttonsContainer,
            isLoading && dynamicStyles.loadingOpacity,
          ]}
        >
          {/* Enhanced Interest Button */}
          <TouchableOpacity
            style={[
              dynamicStyles.interestButton,
              isInterested
                ? dynamicStyles.interestButtonActive
                : dynamicStyles.interestButtonInactive,
            ]}
            onPress={handleInterest}
            activeOpacity={0.8}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={
              isInterested ? 'Премахни интерес' : 'Покажи интерес'
            }
          >
            <Ionicons
              name={isInterested ? 'heart' : 'heart-outline'}
              size={18}
              color={
                isInterested
                  ? colors.onSecondaryContainer
                  : colors.onSurfaceVariant
              }
            />
            <Text
              style={[
                dynamicStyles.interestButtonText,
                isInterested
                  ? dynamicStyles.interestButtonTextActive
                  : dynamicStyles.interestButtonTextInactive,
              ]}
            >
              {isInterested ? 'Заинтересован' : 'Интерес'}
            </Text>
          </TouchableOpacity>

          {/* Enhanced Register Button */}
          <TouchableOpacity
            style={[
              dynamicStyles.registerButton,
              dynamicStyles.registerButtonContainer,
              isRegistered
                ? dynamicStyles.registerButtonOutline
                : dynamicStyles.registerButtonActive,
            ]}
            onPress={isRegistered ? handleUnregister : handleRegister}
            activeOpacity={0.8}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={
              isRegistered
                ? 'Отпиши се от събитието'
                : 'Регистрирай се за събитието'
            }
          >
            <Ionicons
              name={
                isRegistered ? 'remove-circle-outline' : 'add-circle-outline'
              }
              size={18}
              color={isRegistered ? colors.error : colors.onPrimary}
            />
            <Text
              style={[
                dynamicStyles.registerButtonText,
                isRegistered
                  ? dynamicStyles.registerButtonTextOutline
                  : dynamicStyles.registerButtonTextActive,
              ]}
            >
              {isRegistered ? 'Отпиши се' : 'Регистрирай се'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
})

export default EventCard
