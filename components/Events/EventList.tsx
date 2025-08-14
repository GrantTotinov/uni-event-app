import React, { memo } from 'react'
import {
  FlatList,
  RefreshControl,
  ActivityIndicator,
  View,
  Text,
} from 'react-native'
import Colors from '@/data/Colors'
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
  const renderEvent = ({ item }: { item: Event }) => (
    <EventItem item={item} onUpdate={onEventUpdate} />
  )

  const renderFooter = () => {
    if (!loadingMore) return null
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator color={Colors.PRIMARY} size="small" />
      </View>
    )
  }

  const renderEmptyComponent = () => {
    if (loading || showSkeleton) return null

    const isSearching = searchQuery.trim().length > 0

    return (
      <View style={{ padding: 30, alignItems: 'center' }}>
        <Text style={{ textAlign: 'center', color: Colors.GRAY, fontSize: 16 }}>
          {isSearching
            ? `Няма намерени събития за "${searchQuery}"`
            : selectedTab === 0
            ? 'Няма предстоящи събития.'
            : 'Нямате записани събития.'}
        </Text>
        {isSearching && (
          <Text
            style={{
              textAlign: 'center',
              color: Colors.GRAY,
              fontSize: 14,
              marginTop: 8,
            }}
          >
            Опитайте с различни ключови думи
          </Text>
        )}
      </View>
    )
  }

  const keyExtractor = (item: Event) => String(item.id)

  const onEndReached = () => {
    if (onLoadMore && hasMore && !loadingMore && !loading && !showSkeleton) {
      onLoadMore()
    }
  }

  // Add skeleton events for initial loading
  const eventsWithSkeleton = showSkeleton
    ? [
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
    : events

  // Don't show refresh control if showing skeleton
  const shouldShowRefreshControl = !showSkeleton

  return (
    <FlatList
      data={eventsWithSkeleton}
      keyExtractor={keyExtractor}
      renderItem={renderEvent}
      contentContainerStyle={{
        paddingBottom: 120,
        flexGrow: 1,
      }}
      refreshControl={
        shouldShowRefreshControl ? (
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={Colors.PRIMARY}
            colors={[Colors.PRIMARY]}
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
    />
  )
})

export default EventList
