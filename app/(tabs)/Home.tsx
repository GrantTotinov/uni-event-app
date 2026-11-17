// File: app/(tabs)/Home.tsx
import { FlatList, RefreshControl, View } from 'react-native'
import React, { useState, useCallback, useRef } from 'react'
import { useTheme } from 'react-native-paper'
import { useQueryClient } from '@tanstack/react-query'
import Colors from '@/data/Colors'
import Header from '@/components/Home/Header'
import CampusHero from '@/components/Home/CampusHero'
import PulseStrip from '@/components/Pulse/PulseStrip'
import LatestPost, { LatestPostRef } from '@/components/Home/LatestPost'

export default function Home() {
  const theme = useTheme()
  const queryClient = useQueryClient()
  const feedRef = useRef<LatestPostRef>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Pull-to-refresh refetches data in place instead of remounting the screen
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      feedRef.current?.refresh()
      await Promise.all(
        ['next-event', 'pulse', 'pulse-top', 'notifications'].map((key) =>
          queryClient.invalidateQueries({ queryKey: [key] })
        )
      )
    } finally {
      setRefreshing(false)
    }
  }, [queryClient])

  return (
    <FlatList
      data={[]}
      renderItem={null}
      style={{ backgroundColor: theme.colors.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.PRIMARY}
          colors={[Colors.PRIMARY]}
          progressBackgroundColor={theme.colors.surface}
          title="Обновяване..."
          titleColor={theme.colors.onSurface}
        />
      }
      ListHeaderComponent={
        <View>
          <Header />
          <CampusHero />
          <PulseStrip />
          <LatestPost ref={feedRef} search="" />
        </View>
      }
      contentContainerStyle={{ flexGrow: 1 }}
    />
  )
}
