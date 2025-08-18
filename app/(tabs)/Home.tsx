import { View, Text, FlatList } from 'react-native'
import React, { useState, useCallback } from 'react'
import Colors from '@/data/Colors'
import Header from '@/components/Home/Header'
import Category from '@/components/Home/Category'
import LatestPost from '@/components/Home/LatestPost'
import { useFocusEffect } from 'expo-router'

export default function Home() {
  const [search, setSearch] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

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
      ListHeaderComponent={
        <View style={{ padding: 20, paddingTop: 40 }}>
          <Header />
          <LatestPost search={search} />
        </View>
      }
    />
  )
}
