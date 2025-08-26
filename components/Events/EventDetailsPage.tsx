import React, { useContext, useState, memo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { Entypo, Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'

import Colors from '@/data/Colors'
import Button from '@/components/Shared/Button'
import { AuthContext, isSystemAdmin } from '@/context/AuthContext'
import { useEventDetails, useEvents } from '@/hooks/useEvents'

interface EventDetailsPageProps {
  eventId?: string
}

const EventDetailsPage = memo(function EventDetailsPage({
  eventId,
}: EventDetailsPageProps) {
  const { user } = useContext(AuthContext)
  const router = useRouter()

  // Use the event details hook
  const {
    data: eventData,
    isLoading,
    error,
    refetch,
  } = useEventDetails(eventId, user?.email)

  // Use the events hook for mutations
  const { registerMutation, unregisterMutation, interestMutation } = useEvents({
    userEmail: user?.email,
  })

  const [registering, setRegistering] = useState(false)
  const [interestedLoading, setInterestedLoading] = useState(false)

  // Extract event from query data
  const event = eventData?.pages?.[0]

  const toggleRegister = async () => {
    if (!event || !user?.email) {
      Alert.alert('Вход', 'Трябва да сте влезли.')
      return
    }

    setRegistering(true)
    try {
      if (!event.isRegistered) {
        await registerMutation.mutateAsync({
          eventId: event.id,
          userEmail: user.email,
        })
        Alert.alert('Успех', 'Регистрирахте се.')
      } else {
        await unregisterMutation.mutateAsync({
          eventId: event.id,
          userEmail: user.email,
        })
        Alert.alert('Готово', 'Отписахте се.')
      }
      // Refresh the event details to get updated counts
      refetch()
    } catch (e) {
      console.error('Registration toggle error:', e)
      Alert.alert('Грешка', 'Операцията не беше успешна.')
    } finally {
      setRegistering(false)
    }
  }

  const toggleInterest = async () => {
    if (!event || !user?.email) {
      Alert.alert('Вход', 'Трябва да сте влезли.')
      return
    }

    setInterestedLoading(true)
    try {
      await interestMutation.mutateAsync({
        eventId: event.id,
        userEmail: user.email,
        isInterested: !!event.isInterested,
      })
      // Refresh the event details to get updated counts
      refetch()
    } catch (e) {
      console.error('Interest toggle error:', e)
      Alert.alert('Грешка', 'Операцията не беше успешна.')
    } finally {
      setInterestedLoading(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.PRIMARY} />
      </View>
    )
  }

  if (error || !event) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Colors.GRAY }}>
          {error ? 'Грешка при зареждане.' : 'Събитието не е намерено.'}
        </Text>
        <Button text="Назад" onPress={() => router.back()} outline />
      </View>
    )
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      style={{ backgroundColor: Colors.WHITE }}
    >
      <Image
        source={{ uri: event.bannerurl }}
        style={styles.banner}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        placeholder={require('@/assets/images/image.png')}
        placeholderContentFit="cover"
      />

      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.createdBy}>Създадено от: {event.username}</Text>

      <View style={styles.row}>
        <Entypo name="location" size={22} color={Colors.GRAY} />
        <Text style={styles.meta}>{event.location}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="calendar-number" size={22} color={Colors.GRAY} />
        <Text style={styles.meta}>
          {event.event_date} от {event.event_time}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="people" size={22} color={Colors.PRIMARY} />
        <Text style={styles.countPrimary}>
          {event.registeredCount ?? 0}{' '}
          {(event.registeredCount ?? 0) === 1 ? 'регистриран' : 'регистрирани'}
        </Text>
      </View>

      <View style={styles.row}>
        <Ionicons name="heart" size={22} color="#e74c3c" />
        <Text style={styles.countInterested}>
          {event.interestedCount ?? 0}{' '}
          {(event.interestedCount ?? 0) === 1
            ? 'заинтересован'
            : 'заинтересовани'}
        </Text>
      </View>

      {event.details ? (
        <View style={{ marginTop: 15 }}>
          <Text style={styles.sectionTitle}>Детайли</Text>
          <Text style={styles.details}>{event.details}</Text>
        </View>
      ) : null}

      {event.link ? (
        <TouchableOpacity
          style={{ marginTop: 10 }}
          onPress={() => {
            Alert.alert('Линк', event.link || '')
          }}
        >
          <Text style={styles.linkText}>Виж допълнителен линк</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.actions}>
        <Button
          text={event.isRegistered ? 'Отпиши се' : 'Регистрирай се'}
          onPress={toggleRegister}
          loading={registering}
          outline={!!event.isRegistered}
          fullWidth
        />
        <TouchableOpacity
          onPress={toggleInterest}
          style={[
            styles.interestBtn,
            event.isInterested && {
              backgroundColor: '#ffe6e6',
              borderColor: '#e74c3c',
            },
          ]}
          disabled={interestedLoading}
        >
          <Ionicons
            name={event.isInterested ? 'heart' : 'heart-outline'}
            size={20}
            color={event.isInterested ? '#e74c3c' : Colors.PRIMARY}
          />
          <Text
            style={[
              styles.interestText,
              { color: event.isInterested ? '#e74c3c' : Colors.PRIMARY },
            ]}
          >
            {event.isInterested ? 'Имам интерес' : 'Интерес'}
          </Text>
        </TouchableOpacity>
      </View>

      {(isSystemAdmin(user?.role) || user?.email === event.createdby) && (
        <View style={{ marginTop: 20 }}>
          <Text style={styles.sectionTitle}>Админ опции</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              text="Редактирай"
              outline
              onPress={() =>
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
              }
            />
          </View>
        </View>
      )}
    </ScrollView>
  )
})

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  banner: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: Colors.BLACK,
  },
  createdBy: {
    fontSize: 16,
    color: Colors.GRAY,
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  meta: {
    fontSize: 16,
    color: Colors.GRAY,
    flex: 1,
  },
  countPrimary: {
    fontSize: 16,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  countInterested: {
    fontSize: 16,
    color: '#e74c3c',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.BLACK,
  },
  details: {
    fontSize: 16,
    color: Colors.BLACK,
    lineHeight: 24,
  },
  linkText: {
    fontSize: 16,
    color: Colors.PRIMARY,
    textDecorationLine: 'underline',
  },
  actions: {
    marginTop: 20,
    gap: 10,
  },
  interestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.PRIMARY,
    backgroundColor: Colors.WHITE,
    gap: 8,
  },
  interestText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

export default EventDetailsPage
