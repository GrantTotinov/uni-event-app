// File: app/(tabs)/Home.tsx
import { View, Text, FlatList, RefreshControl } from 'react-native'
import React, { useState, useCallback } from 'react'
import Colors from '@/data/Colors'
import Header from '@/components/Home/Header'
import LatestPost from '@/components/Home/LatestPost'
import { useFocusEffect } from 'expo-router'
import { useAppTheme } from '@/context/ThemeContext'

export default function Home() {
  const { isDarkMode } = useAppTheme()
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  // Memoized refresh handler following performance guidelines
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // Force refresh by updating the key
      setRefreshKey((prevKey) => prevKey + 1)
      // Add a small delay for UX feedback
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Error refreshing home:', error)
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Refresh the page when the tab gains focus
  useFocusEffect(
    useCallback(() => {
      console.log('Home tab focused, refreshing...')
      setRefreshKey((prevKey) => prevKey + 1)
    }, [])
  )

  return (
    <FlatList
      key={refreshKey} // Use refreshKey to force re-render
      data={[]} // Replace with actual data if needed
      renderItem={null}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.PRIMARY}
          colors={[Colors.PRIMARY]}
          progressBackgroundColor={isDarkMode ? '#1a1a1a' : '#ffffff'}
          title="Обновяване..."
          titleColor={isDarkMode ? '#ffffff' : '#000000'}
        />
      }
      ListHeaderComponent={
        <View>
          <Header />
          <LatestPost search={search} key={refreshKey} />
        </View>
      }
      contentContainerStyle={{
        flexGrow: 1,
      }}
    />
  )
}
