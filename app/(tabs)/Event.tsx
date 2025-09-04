import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'
import { View, StatusBar, StyleSheet } from 'react-native'
import {
  Surface,
  Text,
  useTheme,
  Searchbar,
  IconButton,
  Chip,
} from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'
import { useAppTheme } from '@/context/ThemeContext'
import EventList from '@/components/Events/EventList'
import {
  useAllEvents,
  useRegisteredEvents,
  useMyEvents,
  usePopularEvents,
} from '@/hooks/useEvents'

const Event = React.memo(function Event() {
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()
  const router = useRouter()

  const [selectedTab, setSelectedTab] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('')

  // Debounce search query following performance guidelines
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Memoized theme colors for performance
  const colors = useMemo(
    () => ({
      surface: theme.colors.surface,
      onSurface: theme.colors.onSurface,
      primary: theme.colors.primary,
      onPrimary: theme.colors.onPrimary,
      surfaceVariant: theme.colors.surfaceVariant,
      onSurfaceVariant: theme.colors.onSurfaceVariant,
      outline: theme.colors.outline,
      background: theme.colors.background,
      primaryContainer: theme.colors.primaryContainer,
      onPrimaryContainer: theme.colors.onPrimaryContainer,
    }),
    [theme.colors]
  )

  // Use hooks based on selected tab with search functionality
  const allEventsQuery = useAllEvents(user?.email, debouncedSearchQuery)
  const registeredEventsQuery = useRegisteredEvents(
    user?.email,
    debouncedSearchQuery
  )
  const myEventsQuery = useMyEvents(user?.email, debouncedSearchQuery)
  const popularEventsQuery = usePopularEvents(user?.email, debouncedSearchQuery)

  // Select appropriate query based on selected tab
  const getCurrentQuery = useCallback(() => {
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
  }, [
    selectedTab,
    allEventsQuery,
    registeredEventsQuery,
    myEventsQuery,
    popularEventsQuery,
  ])

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

  // Memoized handlers following performance guidelines
  const onRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  const handleEventUpdate = useCallback(() => {
    invalidateEvents()
    refetch()
  }, [invalidateEvents, refetch])

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchNextPage()
    }
  }, [hasMore, isLoadingMore, isLoading, fetchNextPage])

  const handleAddEvent = useCallback(() => {
    router.push('/add-event')
  }, [router])

  const handleTabSelect = useCallback((tabIndex: number) => {
    setSelectedTab(tabIndex)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  // Show skeleton on initial load when we have no data yet
  const showSkeleton = isLoading && events.length === 0

  // Memoized tab data for performance
  const tabs = useMemo(
    () => [
      { label: 'Предстоящи', icon: 'calendar' },
      { label: 'Регистрации', icon: 'account-check' },
      { label: 'Мои събития', icon: 'account-edit' },
      { label: 'Популярни', icon: 'trending-up' },
    ],
    []
  )

  return (
    <Surface style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        backgroundColor={colors.surface}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <Surface
        style={[styles.header, { backgroundColor: colors.surface }]}
        elevation={2}
      >
        <View style={styles.headerContent}>
          <Text
            variant="headlineMedium"
            style={[styles.headerTitle, { color: colors.onSurface }]}
          >
            Събития
          </Text>

          <IconButton
            icon="plus"
            size={28}
            iconColor={colors.primary}
            onPress={handleAddEvent}
            style={styles.addButton}
            accessibilityLabel="Създай ново събитие"
          />
        </View>
      </Surface>

      {/* Chips Section */}
      <Surface
        style={[styles.chipsContainer, { backgroundColor: colors.surface }]}
      >
        <View style={styles.chipsContent}>
          {tabs.map((tab, index) => (
            <Chip
              key={index}
              icon={tab.icon}
              selected={selectedTab === index}
              onPress={() => handleTabSelect(index)}
              style={[
                styles.chip,
                selectedTab === index && {
                  backgroundColor: colors.primaryContainer,
                },
              ]}
              textStyle={{
                color:
                  selectedTab === index
                    ? colors.onPrimaryContainer
                    : colors.onSurfaceVariant,
                fontWeight: selectedTab === index ? '600' : '400',
              }}
              showSelectedOverlay={false}
              mode={selectedTab === index ? 'flat' : 'outlined'}
            >
              {tab.label}
            </Chip>
          ))}
        </View>
      </Surface>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Търси събития..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchBar, { backgroundColor: colors.surfaceVariant }]}
          inputStyle={{ color: colors.onSurfaceVariant }}
          iconColor={colors.onSurfaceVariant}
          placeholderTextColor={colors.onSurfaceVariant}
          elevation={0}
          onClearIconPress={clearSearch}
        />
      </View>

      {/* Search Results Info */}
      {debouncedSearchQuery.trim() && (
        <View style={styles.searchInfo}>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            {isLoading
              ? 'Търсене...'
              : `Резултати за "${debouncedSearchQuery}" (${events.length})`}
          </Text>
        </View>
      )}

      {/* Current Date Display */}
      <View style={styles.dateContainer}>
        <Text
          variant="titleLarge"
          style={[styles.dateText, { color: colors.onSurface }]}
        >
          {new Date().toLocaleDateString('bg-BG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      {/* Events List */}
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
    </Surface>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addButton: {
    margin: 0,
  },
  chipsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  chipsContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    borderRadius: 28,
    elevation: 0,
  },
  searchInfo: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  dateContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dateText: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
})

export default Event
