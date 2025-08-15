import React, { useContext, useEffect, useState } from 'react'
import { View, Text, Pressable, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AuthContext } from '@/context/AuthContext'
import Colors from '@/data/Colors'
import EventList from '@/components/Events/EventList'
import {
  useAllEvents,
  useRegisteredEvents,
  useMyEvents,
  usePopularEvents,
} from '@/hooks/useEvents'

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

  // Use the hooks based on selected tab with search functionality
  const allEventsQuery = useAllEvents(user?.email, debouncedSearchQuery)
  const registeredEventsQuery = useRegisteredEvents(
    user?.email,
    debouncedSearchQuery
  )
  const myEventsQuery = useMyEvents(user?.email, debouncedSearchQuery)
  const popularEventsQuery = usePopularEvents(user?.email, debouncedSearchQuery)

  // Select the appropriate query based on selected tab
  const getCurrentQuery = () => {
    switch (selectedTab) {
      case 0:
        return allEventsQuery
      case 1:
        return registeredEventsQuery
      case 2:
        return myEventsQuery
      case 3:
        return popularEventsQuery
      default:
        return allEventsQuery
    }
  }

  const currentQuery = getCurrentQuery()
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

  // Get tab specific information
  const getTabInfo = () => {
    switch (selectedTab) {
      case 0:
        return {
          name: 'Предстоящи',
          searchText: 'предстоящи събития',
        }
      case 1:
        return {
          name: 'Ще присъствам',
          searchText: 'ваши регистрации',
        }
      case 2:
        return {
          name: 'Мои събития',
          searchText: 'ваши създадени събития',
        }
      case 3:
        return {
          name: 'Популярни',
          searchText: 'популярни събития',
        }
      default:
        return {
          name: 'Предстоящи',
          searchText: 'предстоящи събития',
        }
    }
  }

  const tabInfo = getTabInfo()

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
            placeholder={`Търси в ${tabInfo.searchText}...`}
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
          backgroundColor: Colors.WHITE,
          margin: 20,
          borderRadius: 15,
          padding: 8,
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        }}
      >
        {/* First Row - Предстоящи and Регистрации */}
        <View
          style={{
            flexDirection: 'row',
            marginBottom: 8,
          }}
        >
          <Pressable
            style={{ flex: 1, marginRight: 4 }}
            onPress={() => setSelectedTab(0)}
          >
            <Text
              style={[
                {
                  padding: 12,
                  textAlign: 'center',
                  borderRadius: 10,
                  fontWeight: 'bold',
                  fontSize: 14,
                },
                {
                  backgroundColor:
                    selectedTab === 0 ? Colors.PRIMARY : Colors.LIGHT_GRAY,
                  color: selectedTab === 0 ? Colors.WHITE : Colors.PRIMARY,
                },
              ]}
            >
              Предстоящи
            </Text>
          </Pressable>
          <Pressable
            style={{ flex: 1, marginLeft: 4 }}
            onPress={() => setSelectedTab(1)}
          >
            <Text
              style={[
                {
                  padding: 12,
                  textAlign: 'center',
                  borderRadius: 10,
                  fontWeight: 'bold',
                  fontSize: 14,
                },
                {
                  backgroundColor:
                    selectedTab === 1 ? Colors.PRIMARY : Colors.LIGHT_GRAY,
                  color: selectedTab === 1 ? Colors.WHITE : Colors.PRIMARY,
                },
              ]}
            >
              Регистрации
            </Text>
          </Pressable>
        </View>

        {/* Second Row - Мои събития and Популярни */}
        <View
          style={{
            flexDirection: 'row',
          }}
        >
          <Pressable
            style={{ flex: 1, marginRight: 4 }}
            onPress={() => setSelectedTab(2)}
          >
            <Text
              style={[
                {
                  padding: 12,
                  textAlign: 'center',
                  borderRadius: 10,
                  fontWeight: 'bold',
                  fontSize: 14,
                },
                {
                  backgroundColor:
                    selectedTab === 2 ? Colors.PRIMARY : Colors.LIGHT_GRAY,
                  color: selectedTab === 2 ? Colors.WHITE : Colors.PRIMARY,
                },
              ]}
            >
              Мои събития
            </Text>
          </Pressable>
          <Pressable
            style={{ flex: 1, marginLeft: 4 }}
            onPress={() => setSelectedTab(3)}
          >
            <Text
              style={[
                {
                  padding: 12,
                  textAlign: 'center',
                  borderRadius: 10,
                  fontWeight: 'bold',
                  fontSize: 14,
                },
                {
                  backgroundColor:
                    selectedTab === 3 ? Colors.PRIMARY : Colors.LIGHT_GRAY,
                  color: selectedTab === 3 ? Colors.WHITE : Colors.PRIMARY,
                },
              ]}
            >
              Популярни
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Search Results Info */}
      {debouncedSearchQuery.trim() && (
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ color: Colors.GRAY, fontSize: 14 }}>
            {isLoading
              ? 'Търсене...'
              : `Резултати за "${debouncedSearchQuery}" (${events.length})`}
          </Text>
          <Text style={{ color: Colors.GRAY, fontSize: 12, marginTop: 2 }}>
            {selectedTab === 3
              ? 'Търсенето включва популярни събития подредени по брой регистрирани'
              : 'Търсенето включва име, локация и детайли на събитията'}
          </Text>
        </View>
      )}

      {/* Tab specific info */}
      {selectedTab === 2 && !debouncedSearchQuery.trim() && (
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ color: Colors.GRAY, fontSize: 12 }}>
            Показват се само събития, които сте създали
          </Text>
        </View>
      )}

      {selectedTab === 3 && !debouncedSearchQuery.trim() && (
        <View style={{ paddingHorizontal: 20, marginBottom: 10 }}>
          <Text style={{ color: Colors.GRAY, fontSize: 12 }}>
            Събития подредени по брой регистрирани потребители
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
        searchQuery={debouncedSearchQuery}
      />
    </View>
  )
}
