import React, { useContext, useEffect, useState, memo } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
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
import Button from '@/components/Shared/Button'
import { AuthContext, isSystemAdmin } from '@/context/AuthContext'
import { useEvents } from '@/hooks/useEvents'
import type { Event } from '@/hooks/useEvents'

moment.locale('bg')

interface EVENT extends Event {
  onUnregister?: () => void
  onDelete?: () => void
}

const EventCard = memo(function EventCard({
  onUnregister,
  onDelete,
  ...event
}: EVENT) {
  const { user } = useContext(AuthContext)
  const router = useRouter()

  // Use the events hook for mutations
  const { registerMutation, unregisterMutation, interestMutation } = useEvents({
    userEmail: user?.email,
  })

  // Local state for UI updates
  const [isRegistered, setIsRegistered] = useState(event.isRegistered ?? false)
  const [isInterested, setIsInterested] = useState(event.isInterested ?? false)
  const [registeredCount, setRegisteredCount] = useState(
    event.registeredCount ?? 0
  )
  const [interestedCount, setInterestedCount] = useState(
    event.interestedCount ?? 0
  )
  const [menuVisible, setMenuVisible] = useState(false)

  const canManage = isSystemAdmin(user?.role) || user?.email === event.createdby

  // Sync with props when they change
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

  const openDetails = () => {
    try {
      router.push({ pathname: '/event/[id]', params: { id: String(event.id) } })
    } catch (error) {
      console.error('Navigation error:', error)
      Alert.alert('Грешка', 'Неуспешно отваряне на детайли.')
    }
  }

  const handleRegister = () => {
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
  }

  const handleUnregister = () => {
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
  }

  const handleInterest = async () => {
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
              Alert.alert('Чудесно!', 'Проявихте интерес към събитието!')
            } else {
              setIsInterested(false)
              setInterestedCount((prev) => Math.max(0, prev - 1))
              Alert.alert(
                'Готово!',
                'Вече не проявявате интерес към събитието.'
              )
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
  }

  const shareImage = async () => {
    try {
      const downloadResult = await FileSystem.downloadAsync(
        event.bannerurl,
        FileSystem.documentDirectory + `${event.name}.jpg`
      )
      await Sharing.shareAsync(downloadResult.uri)
    } catch (error) {
      console.error('Share error:', error)
      Alert.alert('Грешка', 'Неуспешно споделяне.')
    }
  }

  const deleteEvent = () => {
    Alert.alert(
      'Изтриване на събитие',
      'Сигурни ли сте, че искате да изтриете това събитие?',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${process.env.EXPO_PUBLIC_HOST_URL}/events`, {
                data: { eventId: event.id, userEmail: user?.email },
              })
              Alert.alert('Успешно', 'Събитието е изтрито.')
              onDelete && onDelete()
            } catch (error) {
              console.error('Delete event error', error)
              Alert.alert('Грешка', 'Неуспешно изтриване на събитието.')
            }
          },
        },
      ]
    )
  }

  return (
    <View style={styles.card}>
      {canManage && (
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.menuButton}
        >
          <MaterialIcons name="more-vert" size={22} color={Colors.GRAY} />
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={openDetails} activeOpacity={0.85}>
        <Image
          source={{ uri: event.bannerurl }}
          style={styles.banner}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholder={require('@/assets/images/image.png')}
          placeholderContentFit="cover"
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={openDetails} activeOpacity={0.8}>
        <Text style={styles.title}>{event.name}</Text>
      </TouchableOpacity>

      <Text style={styles.createdBy}>Създадено от: {event.username}</Text>

      <View style={styles.subContainer}>
        <Entypo name="location" size={24} color={Colors.GRAY} />
        <Text style={styles.metaText}>{event.location}</Text>
      </View>

      <View style={styles.subContainer}>
        <Ionicons name="calendar-number" size={24} color={Colors.GRAY} />
        <Text style={styles.metaText}>
          {event.event_date} от {event.event_time}
        </Text>
      </View>

      <View style={styles.subContainer}>
        <Ionicons name="people" size={24} color={Colors.PRIMARY} />
        <Text style={styles.countPrimary}>
          {registeredCount}{' '}
          {registeredCount === 1 ? 'регистриран' : 'регистрирани'}
        </Text>
      </View>

      <View style={styles.subContainer}>
        <Ionicons name="heart" size={24} color="#e74c3c" />
        <Text style={styles.countInterested}>
          {interestedCount}{' '}
          {interestedCount === 1 ? 'заинтересован' : 'заинтересовани'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button text="Сподели" outline={true} onPress={shareImage} />
        <TouchableOpacity
          onPress={handleInterest}
          style={styles.interestButton}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isInterested ? 'heart' : 'heart-outline'}
            size={20}
            color={isInterested ? '#e74c3c' : Colors.PRIMARY}
          />
          <Text
            style={[
              styles.interestButtonText,
              { color: isInterested ? '#e74c3c' : Colors.PRIMARY },
            ]}
          >
            {isInterested ? 'Имам интерес' : 'Интерес'}
          </Text>
        </TouchableOpacity>

        {!isRegistered ? (
          <Button text="Регистрирай се" onPress={handleRegister} />
        ) : (
          <Button text="Отпиши се" onPress={handleUnregister} outline={true} />
        )}
      </View>

      <Modal
        visible={menuVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.sheet}>
            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false)
                try {
                  router.push({
                    pathname: '/add-event',
                    params: {
                      edit: '1',
                      id: String(event.id),
                      name: event.name,
                      bannerurl: event.bannerurl,
                      location: event.location,
                      link: event.link ?? '',
                      event_date: event.event_date,
                      event_time: event.event_time,
                      details: event.details ?? '',
                    },
                  })
                } catch (error) {
                  console.error('Navigation error (edit event):', error)
                  Alert.alert('Грешка', 'Неуспешно отваряне на формата.')
                }
              }}
              style={styles.sheetOption}
            >
              <Text style={styles.sheetOptionTextPrimary}>Редактирай</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false)
                deleteEvent()
              }}
              style={styles.sheetOption}
            >
              <Text style={styles.sheetOptionTextDanger}>Изтрий</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
})

const styles = StyleSheet.create({
  card: {
    padding: 20,
    margin: 10,
    marginHorizontal: 20,
    backgroundColor: Colors.WHITE,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 15,
    padding: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  banner: {
    width: '100%',
    height: 150,
    borderRadius: 15,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: Colors.BLACK,
  },
  createdBy: {
    fontSize: 14,
    color: Colors.GRAY,
    marginBottom: 10,
  },
  subContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: Colors.GRAY,
    flex: 1,
  },
  countPrimary: {
    fontSize: 14,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  countInterested: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    gap: 10,
  },
  interestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.WHITE,
    gap: 5,
  },
  interestButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.WHITE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  sheetOption: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  sheetOptionTextPrimary: {
    fontSize: 18,
    color: Colors.PRIMARY,
    fontWeight: 'bold',
  },
  sheetOptionTextDanger: {
    fontSize: 18,
    color: 'red',
    fontWeight: 'bold',
  },
})

export default EventCard
