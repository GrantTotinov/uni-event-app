import React, { useContext, useState, useEffect } from 'react'
import { View, Text, Pressable, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AuthContext } from '@/context/AuthContext'
import Colors from '@/data/Colors'
import EventList from '@/components/Events/EventList'
import { useAllEvents, useRegisteredEvents } from '@/hooks/useEvents'

export default function Event() {
  const { user } = useContext(AuthContext)
  const [selectedTab, setSelectedTab] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('')

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Use the new hooks based on selected tab with search functionality
  const allEventsQuery = useAllEvents(user?.email, debouncedSearchQuery)
  const registeredEventsQuery = useRegisteredEvents(
    user?.email,
    debouncedSearchQuery
  )

  // Select the appropriate query based on selected tab
  const currentQuery =
    selectedTab === 0 ? allEventsQuery : registeredEventsQuery
  const {
    events,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchNextPage,
    refetch,
    invalidateEvents,
  } = currentQuery

  const onRefresh = () => {
    refetch()
  }

  const handleEventUpdate = () => {
    // Invalidate cache to ensure fresh data after changes
    invalidateEvents()
    // Also refresh the current query
    refetch()
  }

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchNextPage()
    }
  }

  // Show skeleton on initial load when we have no data yet
  const showSkeleton = isLoading && events.length === 0

  const clearSearch = () => {
    setSearchQuery('')
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.LIGHT_GRAY }}>
      {/* Header */}
      <View
        style={{
          padding: 20,
          paddingTop: 50,
          backgroundColor: Colors.PRIMARY,
          borderBottomLeftRadius: 25,
          borderBottomRightRadius: 25,
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: 'bold',
            textAlign: 'center',
            color: Colors.WHITE,
            marginBottom: 15,
          }}
        >
          Събития
        </Text>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: Colors.WHITE,
            borderRadius: 25,
            paddingHorizontal: 15,
            paddingVertical: 10,
            marginBottom: 10,
          }}
        >
          <Ionicons
            name="search"
            size={20}
            color={Colors.GRAY}
            style={{ marginRight: 10 }}
          />
          <TextInput
            placeholder="Търси събития..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              fontSize: 16,
              color: Colors.BLACK,
            }}
            placeholderTextColor={Colors.GRAY}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch} style={{ padding: 5 }}>
              <Ionicons name="close-circle" size={20} color={Colors.GRAY} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Tab Navigation */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          backgroundColor: Colors.WHITE,
          margin: 20,
          borderRadius: 10,
          padding: 5,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={() => setSelectedTab(0)}>
          <Text
            style={[
              {
                padding: 10,
                textAlign: 'center',
                borderRadius: 10,
                fontWeight: 'bold',
                fontSize: 16,
              },
              {
                backgroundColor:
                  selectedTab === 0 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab === 0 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Предстоящи
          </Text>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => setSelectedTab(1)}>
          <Text
            style={[
              {
                padding: 10,
                textAlign: 'center',
                borderRadius: 10,
                fontWeight: 'bold',
                fontSize: 16,
              },
              {
                backgroundColor:
                  selectedTab === 1 ? Colors.PRIMARY : Colors.WHITE,
                color: selectedTab === 1 ? Colors.WHITE : Colors.PRIMARY,
              },
            ]}
          >
            Записани
          </Text>
        </Pressable>
      </View>

      {/* Search Results Info */}
      {debouncedSearchQuery.trim() && (
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ color: Colors.GRAY, fontSize: 14 }}>
            {isLoading
              ? 'Търсене...'
              : `Резултати за "${debouncedSearchQuery}" (${events.length})`}
          </Text>
        </View>
      )}

      {/* Events List with Skeleton Loading */}
      <EventList
        events={events}
        loading={isLoading}
        loadingMore={isLoadingMore}
        hasMore={hasMore}
        showSkeleton={showSkeleton}
        onRefresh={onRefresh}
        onLoadMore={handleLoadMore}
        onEventUpdate={handleEventUpdate}
        selectedTab={selectedTab}
      />
    </View>
  )
}
