import React, { useContext, useState, memo, useMemo } from 'react'
import {
  View,
  ScrollView,
  Alert,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native'
import {
  Surface,
  Text,
  Button,
  useTheme,
  ActivityIndicator,
  Card,
  Chip,
  IconButton,
  Divider,
  FAB,
} from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  FadeIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  useAnimatedScrollHandler,
} from 'react-native-reanimated'

import { AuthContext, isSystemAdmin } from '@/context/AuthContext'
import { useEventDetails, useEvents } from '@/hooks/useEvents'
import { useAppTheme } from '@/context/ThemeContext'

const { width: screenWidth, height: screenHeight } = Dimensions.get('window')

interface EventDetailsPageProps {
  eventId?: string
}

const EventDetailsPage = memo(function EventDetailsPage({
  eventId,
}: EventDetailsPageProps) {
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()
  const router = useRouter()

  // Animated scroll value for parallax effects
  const scrollY = useSharedValue(0)

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

  // Memoized theme colors
  const colors = useMemo(
    () => ({
      surface: theme.colors.surface,
      onSurface: theme.colors.onSurface,
      primary: theme.colors.primary,
      onPrimary: theme.colors.onPrimary,
      secondary: theme.colors.secondary,
      onSecondary: theme.colors.onSecondary,
      surfaceVariant: theme.colors.surfaceVariant,
      onSurfaceVariant: theme.colors.onSurfaceVariant,
      outline: theme.colors.outline,
      primaryContainer: theme.colors.primaryContainer,
      onPrimaryContainer: theme.colors.onPrimaryContainer,
      secondaryContainer: theme.colors.secondaryContainer,
      onSecondaryContainer: theme.colors.onSecondaryContainer,
      errorContainer: theme.colors.errorContainer,
      onErrorContainer: theme.colors.onErrorContainer,
      error: theme.colors.error,
      background: theme.colors.background,
    }),
    [theme.colors]
  )

  // Animated styles for header
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 200], [0, 1])
    return {
      opacity,
    }
  })

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
  })

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
      <Surface
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator
          size="large"
          animating={true}
          theme={{ colors: { primary: colors.primary } }}
        />
        <Text
          variant="bodyLarge"
          style={{ color: colors.onSurface, marginTop: 16 }}
        >
          Зареждане...
        </Text>
      </Surface>
    )
  }

  if (error || !event) {
    return (
      <Surface
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Card mode="outlined" style={styles.errorCard}>
          <Card.Content style={styles.errorContent}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={colors.onSurfaceVariant}
            />
            <Text
              variant="headlineSmall"
              style={{ color: colors.onSurface, textAlign: 'center' }}
            >
              {error ? 'Грешка при зареждане' : 'Събитието не е намерено'}
            </Text>
            <Button
              mode="contained"
              onPress={() => router.back()}
              style={styles.errorButton}
            >
              Назад
            </Button>
          </Card.Content>
        </Card>
      </Surface>
    )
  }

  const canManage = isSystemAdmin(user?.role) || user?.email === event.createdby

  return (
    <Surface style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor="transparent"
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent
      />

      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          { backgroundColor: colors.surface },
          headerAnimatedStyle,
        ]}
      >
        <Text
          variant="titleLarge"
          numberOfLines={1}
          style={{ color: colors.onSurface }}
        >
          {event.name}
        </Text>
      </Animated.View>

      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <Surface style={styles.backButton} elevation={2}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => router.back()}
            iconColor={colors.onSurface}
          />
        </Surface>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Section */}
        <Animated.View
          entering={FadeIn.duration(600)}
          style={styles.heroContainer}
        >
          <Image
            source={{ uri: event.bannerurl }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            placeholder={require('@/assets/images/image.png')}
            placeholderContentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.imageGradient}
          />
        </Animated.View>

        {/* Content Section */}
        <Animated.View
          entering={SlideInDown.delay(300)}
          style={styles.contentContainer}
        >
          {/* Event Title and Creator */}
          <View style={styles.titleSection}>
            <Text
              variant="headlineMedium"
              style={[styles.eventTitle, { color: colors.onSurface }]}
            >
              {event.name}
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.createdBy, { color: colors.onSurfaceVariant }]}
            >
              Създадено от {event.username}
            </Text>
          </View>

          {/* Event Info Cards */}
          <View style={styles.infoSection}>
            {/* Date & Time Card */}
            <Card
              mode="outlined"
              style={[styles.infoCard, { borderColor: colors.outline }]}
            >
              <Card.Content style={styles.infoCardContent}>
                <Ionicons
                  name="calendar-outline"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.infoTextContainer}>
                  <Text
                    variant="labelMedium"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    Дата и час
                  </Text>
                  <Text
                    variant="bodyLarge"
                    style={{ color: colors.onSurface, fontWeight: '600' }}
                  >
                    {event.event_date} в {event.event_time}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* Location Card */}
            <Card
              mode="outlined"
              style={[styles.infoCard, { borderColor: colors.outline }]}
            >
              <Card.Content style={styles.infoCardContent}>
                <Ionicons
                  name="location-outline"
                  size={24}
                  color={colors.secondary}
                />
                <View style={styles.infoTextContainer}>
                  <Text
                    variant="labelMedium"
                    style={{ color: colors.onSurfaceVariant }}
                  >
                    Локация
                  </Text>
                  <Text
                    variant="bodyLarge"
                    style={{ color: colors.onSurface, fontWeight: '600' }}
                  >
                    {event.location}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </View>

          {/* Statistics */}
          <View style={styles.statsSection}>
            <Surface
              style={[
                styles.statCard,
                { backgroundColor: colors.primaryContainer },
              ]}
              elevation={1}
            >
              <Ionicons
                name="people"
                size={20}
                color={colors.onPrimaryContainer}
              />
              <Text
                variant="bodyMedium"
                style={{ color: colors.onPrimaryContainer, fontWeight: '600' }}
              >
                {event.registeredCount ?? 0} регистрирани
              </Text>
            </Surface>

            <Surface
              style={[
                styles.statCard,
                { backgroundColor: colors.secondaryContainer },
              ]}
              elevation={1}
            >
              <Ionicons
                name="heart"
                size={20}
                color={colors.onSecondaryContainer}
              />
              <Text
                variant="bodyMedium"
                style={{
                  color: colors.onSecondaryContainer,
                  fontWeight: '600',
                }}
              >
                {event.interestedCount ?? 0} заинтересовани
              </Text>
            </Surface>
          </View>

          {/* Event Details */}
          {event.details && (
            <Card
              mode="outlined"
              style={[styles.detailsCard, { borderColor: colors.outline }]}
            >
              <Card.Content>
                <Text
                  variant="titleMedium"
                  style={[styles.sectionTitle, { color: colors.onSurface }]}
                >
                  Детайли
                </Text>
                <Divider style={{ marginVertical: 12 }} />
                <Text
                  variant="bodyLarge"
                  style={[styles.detailsText, { color: colors.onSurface }]}
                >
                  {event.details}
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* Additional Link */}
          {event.link && (
            <Card
              mode="outlined"
              style={[styles.linkCard, { borderColor: colors.outline }]}
            >
              <Card.Content>
                <Button
                  mode="text"
                  icon="open-in-new"
                  onPress={() => Alert.alert('Линк', event.link || '')}
                  contentStyle={styles.linkButtonContent}
                >
                  Виж допълнителна информация
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Admin Options */}
          {canManage && (
            <Card
              mode="outlined"
              style={[styles.adminCard, { borderColor: colors.outline }]}
            >
              <Card.Content>
                <Text
                  variant="titleMedium"
                  style={[styles.sectionTitle, { color: colors.onSurface }]}
                >
                  Админ опции
                </Text>
                <Divider style={{ marginVertical: 12 }} />
                <Button
                  mode="outlined"
                  icon="pencil"
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
                  style={styles.adminButton}
                >
                  Редактирай събитие
                </Button>
              </Card.Content>
            </Card>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </Animated.View>
      </Animated.ScrollView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        {/* Interest FAB */}
        <FAB
          icon={event.isInterested ? 'heart' : 'heart-outline'}
          mode="surface"
          size="medium"
          onPress={toggleInterest}
          loading={interestedLoading}
          style={[
            styles.interestFab,
            {
              backgroundColor: event.isInterested
                ? colors.secondaryContainer
                : colors.surface,
            },
          ]}
          theme={{
            colors: {
              primaryContainer: event.isInterested
                ? colors.secondaryContainer
                : colors.surface,
              onPrimaryContainer: event.isInterested
                ? colors.onSecondaryContainer
                : colors.onSurface,
            },
          }}
        />

        {/* Register FAB */}
        <FAB
          icon={event.isRegistered ? 'account-minus' : 'account-plus'}
          mode={event.isRegistered ? 'surface' : 'elevated'}
          size="large"
          onPress={toggleRegister}
          loading={registering}
          label={event.isRegistered ? 'Отпиши се' : 'Регистрирай се'}
          style={[
            styles.registerFab,
            {
              backgroundColor: event.isRegistered
                ? colors.errorContainer
                : colors.primary,
            },
          ]}
          theme={{
            colors: {
              primaryContainer: event.isRegistered
                ? colors.errorContainer
                : colors.primary,
              onPrimaryContainer: event.isRegistered
                ? colors.onErrorContainer
                : colors.onPrimary,
            },
          }}
        />
      </View>
    </Surface>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    maxWidth: 320,
    width: '100%',
  },
  errorContent: {
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  errorButton: {
    marginTop: 8,
  },
  animatedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    paddingTop: StatusBar.currentHeight || 24,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButtonContainer: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 24) + 16,
    left: 16,
    zIndex: 1001,
  },
  backButton: {
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    position: 'relative',
    height: screenHeight * 0.5,
    marginBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  contentContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  titleSection: {
    marginBottom: 8,
  },
  eventTitle: {
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 32,
  },
  createdBy: {
    fontStyle: 'italic',
  },
  infoSection: {
    gap: 12,
  },
  infoCard: {
    borderRadius: 16,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  infoTextContainer: {
    flex: 1,
    gap: 4,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  detailsCard: {
    borderRadius: 16,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  detailsText: {
    lineHeight: 24,
  },
  linkCard: {
    borderRadius: 16,
  },
  linkButtonContent: {
    paddingVertical: 4,
  },
  adminCard: {
    borderRadius: 16,
  },
  adminButton: {
    marginTop: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    gap: 12,
    alignItems: 'flex-end',
  },
  interestFab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  registerFab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
})

export default EventDetailsPage
