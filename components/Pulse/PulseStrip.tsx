import React, { useContext } from 'react'
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'

import Colors from '@/data/Colors'
import { AuthContext } from '@/context/AuthContext'
import { useLeaderboard, usePulse } from '@/hooks/usePulse'
import { levelFor } from '@/utils/pulse'

const MEDALS = ['#e9c46a', '#adb5bd', '#cd7f32'] // gold, silver, bronze

/** Home: your academic level + the campus top 10. */
const PulseStrip = React.memo(function PulseStrip() {
  const { user } = useContext(AuthContext)
  const theme = useTheme()
  const router = useRouter()
  const { data: top = [] } = useLeaderboard(10)
  const { data: me } = usePulse(user?.email)
  const level = levelFor(me?.points ?? 0)

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Text variant="titleMedium" style={styles.title}>
          Пулс на кампуса
        </Text>
        {me && (
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Вие сте #{me.rank} от {me.total}
          </Text>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/(tabs)/Profile')}
        style={[styles.levelCard, { backgroundColor: theme.colors.surface }]}
        accessibilityRole="button"
        accessibilityLabel={`Ниво ${level.title}, ${me?.points ?? 0} точки`}
      >
        <View style={[styles.levelIcon, { backgroundColor: Colors.PRIMARY + '1f' }]}>
          <MaterialCommunityIcons name={level.icon as any} size={24} color={Colors.PRIMARY} />
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <View style={styles.levelRow}>
            <Text variant="titleSmall" style={styles.bold}>
              {level.title}
            </Text>
            <Text variant="labelMedium" style={{ color: Colors.PRIMARY, fontWeight: '700' }}>
              {me?.points ?? 0} т.
            </Text>
          </View>
          <View style={[styles.progress, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View style={[styles.progressFill, { width: `${level.progress * 100}%` }]} />
          </View>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {level.next
              ? `Още ${level.toNext} т. до „${level.next.title}“`
              : 'Достигнахте най-високото ниво 🎓'}
          </Text>
        </View>
      </TouchableOpacity>

      {top.length > 0 && (
        <FlatList
          horizontal
          data={top}
          keyExtractor={(r) => r.email}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.person}
              onPress={() =>
                router.push(`/user-page/${encodeURIComponent(item.email)}`)
              }
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}. ${item.name}, ${item.points} точки`}
            >
              <View
                style={[
                  styles.ring,
                  { borderColor: MEDALS[index] ?? theme.colors.outlineVariant },
                ]}
              >
                <Image
                  source={
                    item.image
                      ? { uri: item.image }
                      : require('@/assets/images/profile.png')
                  }
                  style={styles.avatar}
                  cachePolicy="memory-disk"
                />
                <View
                  style={[
                    styles.rank,
                    { backgroundColor: MEDALS[index] ?? theme.colors.surfaceVariant },
                  ]}
                >
                  <Text
                    style={[
                      styles.rankText,
                      !MEDALS[index] && { color: theme.colors.onSurface },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
              </View>
              <Text variant="labelMedium" numberOfLines={1} style={styles.personName}>
                {item.name.split(' ')[0]}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {item.points} т.
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 8 },
  headRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: { fontWeight: '800' },
  bold: { fontWeight: '700' },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 20,
  },
  levelIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  // plain Views: Paper's ProgressBar is height:100% on web and breaks the layout
  progress: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.PRIMARY },
  list: { gap: 14, paddingVertical: 14, paddingRight: 8 },
  person: { alignItems: 'center', width: 64 },
  ring: { borderWidth: 3, borderRadius: 32, padding: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  rank: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 11, fontWeight: '900', color: '#264653' },
  personName: { marginTop: 6, fontWeight: '600' },
})

export default PulseStrip
