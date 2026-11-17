import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'

import Colors from '@/data/Colors'
import { usePulse } from '@/hooks/usePulse'
import { BADGES, POINTS, levelFor } from '@/utils/pulse'

/** Profile: academic level, progress and earned/locked badges. */
export default function LevelCard({ email }: { email?: string }) {
  const theme = useTheme()
  const { data: me } = usePulse(email)
  if (!me) return null

  const level = levelFor(me.points)

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[Colors.DARK_GRAY, Colors.PRIMARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.row}>
          <View style={styles.icon}>
            <MaterialCommunityIcons name={level.icon as any} size={30} color={Colors.GOLD} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>НИВО {level.index + 1}</Text>
            <Text style={styles.title}>{level.title}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.points}>{me.points}</Text>
            <Text style={styles.kicker}>ТОЧКИ · #{me.rank}</Text>
          </View>
        </View>

        <View style={styles.progress}>
          <View style={[styles.progressFill, { width: `${level.progress * 100}%` }]} />
        </View>
        <Text style={styles.sub}>
          {level.next
            ? `Още ${level.toNext} т. до „${level.next.title}“`
            : 'Най-високото академично ниво 🎓'}
        </Text>

        <Text style={styles.howto}>
          +{POINTS.posts} публикация · +{POINTS.events} събитие · +{POINTS.comments} коментар ·
          +{POINTS.likes} харесване · +{POINTS.followers} последовател
        </Text>
      </LinearGradient>

      <View style={styles.badges}>
        {BADGES.map((b) => {
          const earned = b.earned(me)
          return (
            <View
              key={b.id}
              style={[
                styles.badge,
                { backgroundColor: theme.colors.surface, opacity: earned ? 1 : 0.45 },
              ]}
              accessibilityLabel={`${b.title}: ${earned ? 'спечелена' : b.hint}`}
            >
              <MaterialCommunityIcons
                name={(earned ? b.icon : 'lock-outline') as any}
                size={24}
                color={earned ? Colors.ACCENT : theme.colors.onSurfaceVariant}
              />
              <Text variant="labelSmall" style={styles.badgeTitle} numberOfLines={2}>
                {b.title}
              </Text>
              {!earned && (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, fontSize: 10 }}
                >
                  {b.hint}
                </Text>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginHorizontal: 16, marginVertical: 8 },
  card: { borderRadius: 24, padding: 18, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  icon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  points: { color: Colors.GOLD, fontSize: 26, fontWeight: '900' },
  progress: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: Colors.GOLD },
  sub: { color: '#fff', fontSize: 13, fontWeight: '600' },
  howto: { color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 16 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  badge: {
    width: '31%',
    flexGrow: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
    gap: 4,
  },
  badgeTitle: { fontWeight: '700', textAlign: 'center' },
})
