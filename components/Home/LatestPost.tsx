import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AuthContext } from '@/context/AuthContext'
import Colors from '@/data/Colors'
import PostList from '@/components/Post/PostList'
import { useAllPosts, usePopularPosts, useUhtPosts } from '@/hooks/usePosts'
import { useAppTheme } from '@/context/ThemeContext'

const { width } = Dimensions.get('window')

// Tab configuration for better maintainability
const TABS = [
  {
    id: 0,
    label: 'Последни',
    key: 'latest',
    searchText: 'публикации и коментари',
  },
  {
    id: 1,
    label: 'Популярни',
    key: 'popular',
    searchText: 'популярни публикации и коментари',
  },
  { id: 2, label: 'УХТ', key: 'uht', searchText: 'официални УХТ публикации' },
] as const

// Memoized component following performance guidelines
const LatestPost = React.memo(function LatestPost({
  search,
}: {
  search: string
}) {
  const { user } = useContext(AuthContext)
  const { isDarkMode, theme } = useAppTheme()
  const [selectedTab, setSelectedTab] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('')

  // Memoized theme colors - performance optimized
  const colors = useMemo(
    () => ({
      surface: isDarkMode ? '#1a1a1a' : '#ffffff',
      onSurface: isDarkMode ? '#ffffff' : '#000000',
      surfaceVariant: isDarkMode ? '#2a2a2a' : '#f5f5f5',
      onSurfaceVariant: isDarkMode ? '#e0e0e0' : '#666666',
      primary: Colors.PRIMARY,
      onPrimary: '#ffffff',
      outline: isDarkMode ? '#404040' : '#e0e0e0',
      shadow: isDarkMode ? '#000000' : '#000000',
      inputBackground: isDarkMode ? '#2d2d2d' : '#ffffff',
      inputBorder: isDarkMode ? '#404040' : '#e5e5e5',
      tabBackground: isDarkMode ? '#2d2d2d' : '#ffffff',
      tabBackgroundActive: Colors.PRIMARY,
      searchContainerBackground: isDarkMode ? '#1a1a1a' : '#ffffff', // Бял фон за light theme
      tabsContainerBackground: isDarkMode ? '#1a1a1a' : '#ffffff', // Бял фон за light theme
    }),
    [isDarkMode]
  )

  // Memoized styles for theme support - performance optimized
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          marginTop: 3,
          backgroundColor: colors.searchContainerBackground, // ПОПРАВЕНО: Добавен фон на контейнера
        },
        searchContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.inputBackground,
          borderRadius: 25,
          paddingHorizontal: 16,
          paddingVertical: 12,
          marginHorizontal: 20,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.inputBorder,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 4,
          elevation: 3,
          marginTop: 3,
        },
        searchIcon: {
          marginRight: 12,
        },
        searchInput: {
          flex: 1,
          fontSize: 16,
          color: colors.onSurface,
          height: 20,
          textAlignVertical: 'center',
          paddingVertical: 0,
        },
        clearButton: {
          padding: 6,
          borderRadius: 12,
          backgroundColor: colors.surfaceVariant,
          marginLeft: 8,
        },
        tabsContainer: {
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 20,
          marginBottom: 12,
          backgroundColor: colors.tabsContainerBackground, // ПОПРАВЕНО: Добавен фон на табовете
          paddingVertical: 8,
          marginBottom: 5, // ПОПРАВЕНО: Добавен padding за по-добър вид
        },
        tabButton: {
          paddingVertical: 10,
          paddingHorizontal: 18,
          borderRadius: 20,
          borderWidth: 1,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDarkMode ? 0.3 : 0.1,
          shadowRadius: 2,
          elevation: 2,
        },
        tabButtonActive: {
          backgroundColor: colors.tabBackgroundActive,
          borderColor: colors.tabBackgroundActive,
          elevation: 4,
          shadowOpacity: isDarkMode ? 0.4 : 0.15,
        },
        tabButtonInactive: {
          backgroundColor: colors.tabBackground,
          borderColor: colors.outline,
        },
        tabText: {
          fontWeight: '600',
          fontSize: 14,
          textAlign: 'center',
        },
        tabTextActive: {
          color: colors.onPrimary,
        },
        tabTextInactive: {
          color: colors.primary,
        },
        searchInfoContainer: {
          paddingHorizontal: 20,
          marginBottom: 12,
          backgroundColor: colors.surfaceVariant,
          marginHorizontal: 20,
          borderRadius: 12,
          padding: 12,
        },
        searchInfoText: {
          color: colors.onSurfaceVariant,
          fontSize: 14,
          fontWeight: '500',
        },
        searchInfoSubtext: {
          color: colors.onSurfaceVariant,
          fontSize: 12,
          marginTop: 4,
          opacity: 0.8,
        },
        uhtInfoContainer: {
          paddingHorizontal: 20,
          marginBottom: 12,
          backgroundColor: colors.searchContainerBackground, // ПОПРАВЕНО: Използва белия фон
        },
        uhtInfoText: {
          color: colors.onSurfaceVariant,
          fontSize: 12,
          fontStyle: 'italic',
          textAlign: 'center',
          backgroundColor: colors.surfaceVariant,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
        },
      }),
    [colors, isDarkMode]
  )

  // Debounce search query - performance optimized
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Memoized hooks calls - prevents unnecessary re-renders
  const latestPostsQuery = useAllPosts(user?.email, false, debouncedSearchQuery)
  const popularPostsQuery = usePopularPosts(
    user?.email,
    false,
    debouncedSearchQuery
  )
  const uhtPostsQuery = useUhtPosts(user?.email, debouncedSearchQuery)

  // Memoized query selector - performance optimized
  const getCurrentQuery = useCallback(() => {
    switch (selectedTab) {
      case 0:
        return latestPostsQuery
      case 1:
        return popularPostsQuery
      case 2:
        return uhtPostsQuery
      default:
        return latestPostsQuery
    }
  }, [selectedTab, latestPostsQuery, popularPostsQuery, uhtPostsQuery])

  const currentQuery = getCurrentQuery()
  const {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchNextPage,
    refetch,
    likeMutation,
    commentMutation,
  } = currentQuery

  // Memoized handlers following performance guidelines
  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoadingMore && !isLoading) {
      fetchNextPage()
    }
  }, [hasMore, isLoadingMore, isLoading, fetchNextPage])

  const handleToggleLike = useCallback(
    async (postId: number, isLiked: boolean) => {
      if (!user?.email) return
      try {
        await likeMutation.mutateAsync({
          postId,
          userEmail: user.email,
          isLiked,
        })
      } catch (error) {
        console.error('Error toggling like:', error)
      }
    },
    [user?.email, likeMutation]
  )

  const handleAddComment = useCallback(
    async (postId: number, comment: string): Promise<boolean> => {
      if (!user?.email || !comment.trim()) return false
      try {
        await commentMutation.mutateAsync({
          postId,
          userEmail: user.email,
          comment,
        })
        return true
      } catch (error) {
        console.error('Error adding comment:', error)
        return false
      }
    },
    [user?.email, commentMutation]
  )

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleTabPress = useCallback((tabId: number) => {
    setSelectedTab(tabId)
  }, [])

  // Memoized computed values - performance optimized
  const showSkeleton = useMemo(
    () => isLoading && posts.length === 0,
    [isLoading, posts.length]
  )

  const currentTab = useMemo(
    () => TABS.find((tab) => tab.id === selectedTab) || TABS[0],
    [selectedTab]
  )

  const searchPlaceholder = useMemo(
    () => `Търси в ${currentTab.searchText}...`,
    [currentTab.searchText]
  )

  // Memoized tab buttons - prevents unnecessary re-renders
  const tabButtons = useMemo(
    () =>
      TABS.map((tab) => (
        <Pressable
          key={tab.id}
          onPress={() => handleTabPress(tab.id)}
          style={[
            dynamicStyles.tabButton,
            selectedTab === tab.id
              ? dynamicStyles.tabButtonActive
              : dynamicStyles.tabButtonInactive,
          ]}
          accessibilityRole="tab"
          accessibilityLabel={tab.label}
          accessibilityState={{ selected: selectedTab === tab.id }}
        >
          <Text
            style={[
              dynamicStyles.tabText,
              selectedTab === tab.id
                ? dynamicStyles.tabTextActive
                : dynamicStyles.tabTextInactive,
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      )),
    [selectedTab, handleTabPress, dynamicStyles]
  )

  return (
    <View style={dynamicStyles.container}>
      {/* Enhanced Search Bar */}
      <View style={dynamicStyles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.onSurfaceVariant}
          style={dynamicStyles.searchIcon}
        />
        <TextInput
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChangeText={handleSearchChange}
          style={dynamicStyles.searchInput}
          placeholderTextColor={colors.onSurfaceVariant}
          multiline={false}
          numberOfLines={1}
          blurOnSubmit={false}
          accessibilityLabel="Search posts"
          accessibilityHint="Enter search terms to find posts"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={clearSearch}
            style={dynamicStyles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close" size={16} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
      </View>

      {/* Enhanced Tab Buttons */}
      <View style={dynamicStyles.tabsContainer}>{tabButtons}</View>

      {/* Search Results Info */}
      {debouncedSearchQuery.trim() && (
        <View style={dynamicStyles.searchInfoContainer}>
          <Text style={dynamicStyles.searchInfoText}>
            {isLoading
              ? `Търсене в ${currentTab.searchText}...`
              : `Намерени ${posts.length} публикации за "${debouncedSearchQuery}"`}
          </Text>
          <Text style={dynamicStyles.searchInfoSubtext}>
            {selectedTab === 2
              ? 'Търсенето включва УХТ публикации от вашите групи и публични УХТ публикации'
              : 'Търсенето включва съдържание на публикации и коментари'}
          </Text>
        </View>
      )}

      {/* UHT Tab Info */}
      {selectedTab === 2 && !debouncedSearchQuery.trim() && (
        <View style={dynamicStyles.uhtInfoContainer}>
          <Text style={dynamicStyles.uhtInfoText}>
            📚 Показват се УХТ публикации от вашите групи и публични УХТ
            публикации
          </Text>
        </View>
      )}

      {/* Optimized Posts List */}
      <PostList
        posts={posts}
        loading={isLoading}
        loadingMore={isLoadingMore}
        hasMore={hasMore}
        showSkeleton={showSkeleton}
        onRefresh={refetch}
        onLoadMore={handleLoadMore}
        onToggleLike={handleToggleLike}
        onAddComment={handleAddComment}
        searchQuery={debouncedSearchQuery}
      />
    </View>
  )
})

export default LatestPost
