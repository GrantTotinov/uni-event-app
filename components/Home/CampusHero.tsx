import React, { useContext, useMemo } from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, Href } from 'expo-router'

import Colors from '@/data/Colors'
import { AuthContext } from '@/context/AuthContext'
import { useNextRegisteredEvent } from '@/hooks/useEvents'
import { daysUntil, eventStart, formatEventDate } from '@/utils/eventDate'

const QUICK_ACTIONS: {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  href: Href
  color: string
}[] = [
  { label: 'Публикация', icon: 'create-outline', href: '/(tabs)/AddPost', color: Colors.PRIMARY },
  { label: 'Събитие', icon: 'calendar-outline', href: '/add-event', color: Colors.ACCENT },
  { label: 'Групи', icon: 'people-outline', href: '/explore-clubs', color: Colors.SECONDARY },
  { label: 'Чат', icon: 'chatbubbles-outline', href: '/chat' as Href, color: Colors.CORAL },
]

const CampusHero = React.memo(function CampusHero() {
  const { user } = useContext(AuthContext)
  const theme = useTheme()
  const router = useRouter()
  const { data: next } = useNextRegisteredEvent(user?.email)

  const start = useMemo(
    () => (next ? eventStart(next.event_date, next.event_time) : null),
    [next]
  )
  const days = start ? daysUntil(start) : null

  const openHero = () =>
    next
      ? router.push({ pathname: '/event/[id]', params: { id: String(next.id) } })
      : router.push('/(tabs)/Event')

  return (
    <View style={styles.wrap}>
      <TouchableOpacity activeOpacity={0.9} onPress={openHero} accessibilityRole="button">
        <LinearGradient
          colors={[Colors.DARK_GRAY, Colors.PRIMARY]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          {next?.bannerurl ? (
            <Image
              source={{ uri: next.bannerurl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : null}
          {next?.bannerurl ? (
            <LinearGradient
              colors={['rgba(38,70,83,0.95)', 'rgba(42,157,143,0.75)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}

          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>
                {next ? 'СЛЕДВАЩОТО ВИ СЪБИТИЕ' : 'КАКВО ПРЕДСТОИ'}
              </Text>
              <Text style={styles.title} numberOfLines={2}>
                {next ? next.name : 'Открийте живота в кампуса'}
              </Text>
              <Text style={styles.sub} numberOfLines={2}>
                {next
                  ? `${formatEventDate(next.event_date, next.event_time)}\n📍 ${next.location}`
                  : 'Лекции, работилници и купони — запишете се с едно докосване.'}
              </Text>
            </View>

            {days !== null && days >= 0 ? (
              <View style={styles.countdown}>
                <Text style={styles.countdownBig}>{days === 0 ? '🔥' : days}</Text>
                <Text style={styles.countdownSmall}>
                  {days === 0 ? 'днес' : days === 1 ? 'ден' : 'дни'}
                </Text>
              </View>
            ) : (
              <View style={styles.countdown}>
                <Ionicons name="sparkles" size={28} color={Colors.GOLD} />
              </View>
            )}
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.actions}>
        {QUICK_ACTIONS.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={styles.action}
            onPress={() => router.push(a.href)}
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            <View style={[styles.actionIcon, { backgroundColor: a.color + '1f' }]}>
              <Ionicons name={a.icon} size={22} color={a.color} />
            </View>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {a.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
})

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 8 },
  hero: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    minHeight: 140,
    justifyContent: 'center',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kicker: {
    color: Colors.GOLD,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 26 },
  sub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6, lineHeight: 19 },
  countdown: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownBig: { color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 32 },
  countdownSmall: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  action: { alignItems: 'center', gap: 6, flex: 1 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

export default CampusHero
