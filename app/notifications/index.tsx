import React, { useCallback, useContext, useMemo } from 'react'
import {
  View,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { Surface, Text, IconButton, useTheme, ActivityIndicator } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useFocusEffect, useRouter } from 'expo-router'
import moment from 'moment'
import 'moment/locale/bg'

import Colors from '@/data/Colors'
import { AuthContext } from '@/context/AuthContext'
import {
  AppNotification,
  NotificationType,
  useMarkNotificationsSeen,
  useNotifications,
  useNotificationsLastSeen,
} from '@/hooks/useNotifications'
import { countdown, daysUntil, eventStart } from '@/utils/eventDate'

moment.locale('bg')

const TYPE_META: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; color: string }
> = {
  comment: { icon: 'chatbubble', color: Colors.PRIMARY },
  reply: { icon: 'return-down-forward', color: Colors.SECONDARY },
  follow: { icon: 'person-add', color: Colors.ACCENT },
  club_post: { icon: 'people', color: Colors.DARK_GRAY },
  event_soon: { icon: 'alarm', color: Colors.RED },
}

function describe(n: AppNotification): { lead: string; rest: string } {
  switch (n.type) {
    case 'comment':
      return { lead: n.actor_name, rest: ' коментира ваша публикация' }
    case 'reply':
      return { lead: n.actor_name, rest: ' отговори на ваш коментар' }
    case 'follow':
      return { lead: n.actor_name, rest: ' започна да ви следва' }
    case 'club_post':
      return { lead: n.actor_name, rest: ` публикува в „${n.club_name}“` }
    case 'event_soon': {
      const when = countdown(eventStart(n.event_date, n.event_time))
      return {
        lead: n.actor_name,
        rest: ` започва ${when?.label.toLowerCase() ?? 'скоро'}`,
      }
    }
  }
}

function sectionTitle(createdAt: string): string {
  const d = daysUntil(new Date(createdAt))
  if (d >= 0) return 'Днес'
  if (d === -1) return 'Вчера'
  if (d > -7) return 'Тази седмица'
  return 'По-рано'
}

export default function NotificationsScreen() {
  const { user } = useContext(AuthContext)
  const theme = useTheme()
  const router = useRouter()

  const { data, isLoading, isRefetching, refetch } = useNotifications(user?.email)
  const { data: lastSeen = 0 } = useNotificationsLastSeen(user?.email)
  const markSeen = useMarkNotificationsSeen(user?.email)

  // Highlights stay visible while the screen is open; cleared on leave
  useFocusEffect(
    useCallback(() => {
      return () => {
        markSeen()
      }
    }, [markSeen])
  )

  const sections = useMemo(() => {
    const groups = new Map<string, AppNotification[]>()
    for (const n of data ?? []) {
      const title = sectionTitle(n.created_at)
      groups.set(title, [...(groups.get(title) ?? []), n])
    }
    return [...groups].map(([title, items]) => ({ title, data: items }))
  }, [data])

  const open = useCallback(
    (n: AppNotification) => {
      if (n.type === 'event_soon' && n.event_id) {
        router.push({ pathname: '/event/[id]', params: { id: String(n.event_id) } })
      } else {
        router.push(`/user-page/${encodeURIComponent(n.actor_email)}`)
      }
    },
    [router]
  )

  const renderItem = useCallback(
    ({ item }: { item: AppNotification }) => {
      const meta = TYPE_META[item.type]
      const { lead, rest } = describe(item)
      const unread = new Date(item.created_at).getTime() > lastSeen
      return (
        <TouchableOpacity
          onPress={() => open(item)}
          activeOpacity={0.7}
          accessibilityRole="button"
          style={[
            styles.item,
            {
              backgroundColor: unread
                ? theme.colors.primaryContainer
                : theme.colors.surface,
            },
          ]}
        >
          <View>
            <Image
              source={
                item.actor_image
                  ? { uri: item.actor_image }
                  : require('@/assets/images/profile.png')
              }
              style={[
                styles.avatar,
                item.type === 'event_soon' && styles.eventThumb,
              ]}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={[styles.typeBadge, { backgroundColor: meta.color }]}>
              <Ionicons name={meta.icon} size={11} color="#fff" />
            </View>
          </View>

          <View style={styles.body}>
            <Text style={{ color: theme.colors.onSurface }} numberOfLines={2}>
              <Text style={styles.bold}>{lead}</Text>
              {rest}
            </Text>
            {!!item.preview && (
              <Text
                numberOfLines={2}
                style={[styles.preview, { color: theme.colors.onSurfaceVariant }]}
              >
                {item.type === 'event_soon' ? `📍 ${item.preview}` : `„${item.preview}“`}
              </Text>
            )}
            <Text style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
              {moment(item.created_at).fromNow()}
            </Text>
          </View>

          {unread && <View style={[styles.dot, { backgroundColor: meta.color }]} />}
        </TouchableOpacity>
      )
    },
    [lastSeen, open, theme.colors]
  )

  return (
    <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Surface style={[styles.header, { backgroundColor: theme.colors.surface }]} elevation={2}>
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text variant="titleLarge" style={styles.headerTitle}>
          Известия
        </Text>
        <IconButton
          icon="check-all"
          onPress={markSeen}
          accessibilityLabel="Маркирай всички като прочетени"
        />
      </Surface>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 48 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(n) => n.key}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <Text
              variant="labelLarge"
              style={[styles.section, { color: theme.colors.onSurfaceVariant }]}
            >
              {section.title}
            </Text>
          )}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.PRIMARY}
              colors={[Colors.PRIMARY]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="notifications-off-outline"
                size={56}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="titleMedium" style={{ marginTop: 12 }}>
                Все още е тихо тук
              </Text>
              <Text
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}
              >
                Коментари, нови последователи и напомняния за събития ще се появяват тук.
              </Text>
            </View>
          }
        />
      )}
    </Surface>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerTitle: { flex: 1, fontWeight: '700' },
  section: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 16,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  eventThumb: { borderRadius: 12 },
  typeBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  body: { flex: 1 },
  bold: { fontWeight: '700' },
  preview: { marginTop: 2, fontSize: 13 },
  time: { marginTop: 4, fontSize: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
})
