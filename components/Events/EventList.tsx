import React, { memo, useCallback, useMemo } from 'react'
import {
  FlatList,
  RefreshControl,
  ActivityIndicator,
  View,
  StyleSheet,
} from 'react-native'
import { Surface, Text, useTheme } from 'react-native-paper'
import { useAppTheme } from '@/context/ThemeContext'
import EventCard from './EventCard'
import EventCardSkeleton from './EventCardSkeleton'
import type { Event } from '@/hooks/useEvents'

interface EventListProps {
  events: Event[]
  loading: boolean
  loadingMore?: boolean
  hasMore?: boolean
  showSkeleton?: boolean
  onRefresh: () => void
  onLoadMore?: () => void
  onEventUpdate: () => void
  selectedTab: number
  searchQuery?: string
}

const EventItem = memo(function EventItem({
  item,
  onUpdate,
}: {
  item: Event
  onUpdate: () => void
}) {
  // Show skeleton for negative IDs (prefetched placeholders)
  if (item.id < 0) {
    return <EventCardSkeleton />
  }

  return <EventCard {...item} onUnregister={onUpdate} onDelete={onUpdate} />
})

const EventList = memo(function EventList({
  events,
  loading,
  loadingMore = false,
  hasMore = true,
  showSkeleton = false,
  onRefresh,
  onLoadMore,
  onEventUpdate,
  selectedTab,
  searchQuery = '',
}: EventListProps) {
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()

  // Memoized theme colors for performance
  const colors = useMemo(
    () => ({
      primary: theme.colors.primary,
      onSurfaceVariant: theme.colors.onSurfaceVariant,
      surface: theme.colors.surface,
      background: theme.colors.background,
    }),
    [theme.colors]
  )

  const renderEvent = useCallback(
    ({ item }: { item: Event }) => (
      <EventItem item={item} onUpdate={onEventUpdate} />
    ),
    [onEventUpdate]
  )

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null
    return (
      <Surface style={styles.footerContainer}>
        <ActivityIndicator
          color={colors.primary}
          size="small"
          animating={true}
        />
      </Surface>
    )
  }, [loadingMore, colors.primary])

  const renderEmptyComponent = useCallback(() => {
    if (loading || showSkeleton) return null

    const isSearching = searchQuery.trim().length > 0

    return (
      <Surface
        style={[styles.emptyContainer, { backgroundColor: colors.surface }]}
      >
        <Text
          variant="titleMedium"
          style={[styles.emptyTitle, { color: colors.onSurfaceVariant }]}
        >
          {isSearching
            ? `Няма намерени събития за "${searchQuery}"`
            : getEmptyMessage(selectedTab)}
        </Text>
        {isSearching && (
          <Text
            variant="bodyMedium"
            style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}
          >
            Опитайте с различни ключови думи
          </Text>
        )}
      </Surface>
    )
  }, [loading, showSkeleton, searchQuery, selectedTab, colors])

  const getEmptyMessage = useCallback((tab: number) => {
    switch (tab) {
      case 0:
        return 'Няма предстоящи събития'
      case 1:
        return 'Нямате регистрации за събития'
      case 2:
        return 'Нямате създадени събития'
      case 3:
        return 'Няма популярни събития'
      default:
        return 'Няма събития'
    }
  }, [])

  const keyExtractor = useCallback((item: Event) => String(item.id), [])

  const onEndReached = useCallback(() => {
    if (onLoadMore && hasMore && !loadingMore && !loading && !showSkeleton) {
      onLoadMore()
    }
  }, [onLoadMore, hasMore, loadingMore, loading, showSkeleton])

  // Add skeleton events for initial loading
  const eventsWithSkeleton = useMemo(() => {
    if (showSkeleton) {
      return [
        ...Array.from({ length: 3 }, (_, index) => ({
          id: -(index + 1),
          name: '',
          bannerurl: '',
          location: '',
          event_date: '',
          event_time: '',
          createdby: '',
          username: '',
          registeredCount: 0,
          interestedCount: 0,
        })),
        ...events,
      ]
    }
    return events
  }, [showSkeleton, events])

  // Don't show refresh control if showing skeleton
  const shouldShowRefreshControl = !showSkeleton

  return (
    <FlatList
      data={eventsWithSkeleton}
      keyExtractor={keyExtractor}
      renderItem={renderEvent}
      contentContainerStyle={[
        styles.contentContainer,
        { backgroundColor: colors.background },
      ]}
      refreshControl={
        shouldShowRefreshControl ? (
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyComponent}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={10}
      initialNumToRender={8}
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  )
})

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 120,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    borderRadius: 16,
    marginTop: 40,
  },
  emptyTitle: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  separator: {
    height: 12,
  },
})

export default EventList
