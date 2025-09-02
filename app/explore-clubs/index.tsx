// app/explore-clubs/index.tsx
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native'
import {
  Surface,
  Text,
  Searchbar,
  Card,
  Button,
  useTheme,
  IconButton,
  ActivityIndicator,
  Chip,
} from 'react-native-paper'
import axios from 'axios'
import ClubCard from '@/components/Clubs/ClubCard'
import { useRouter } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'
import { useAppTheme } from '@/context/ThemeContext'
import { LinearGradient } from 'expo-linear-gradient'

export type CLUB = {
  id: number
  name: string
  club_logo: string
  about: string
  createdon: string
  isFollowed: boolean
  refreshData: () => void
}

export default function ExploreClubs() {
  const router = useRouter()
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()
  const [followedClub, setFollowedClub] = useState<any>()
  const [clubList, setClubList] = useState<CLUB[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Memoized filtered clubs for performance
  const filteredClubs = useMemo(() => {
    if (!searchQuery) return clubList
    return clubList.filter((club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [clubList, searchQuery])

  const GetAllClubs = useCallback(async () => {
    try {
      setLoading(true)
      const result = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/clubs`
      )
      setClubList(result.data)
      await GetUserFollowedClubs()
    } catch (error) {
      console.error('Error fetching clubs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const GetUserFollowedClubs = useCallback(async () => {
    if (!user?.email) return

    try {
      const result = await axios.get(
        `${
          process.env.EXPO_PUBLIC_HOST_URL
        }/clubfollower?u_email=${encodeURIComponent(user.email)}`
      )
      setFollowedClub(result?.data)
    } catch (error) {
      console.error('Error fetching followed clubs:', error)
    }
  }, [user?.email])

  const isFollowed = useCallback(
    (clubId: number) => {
      return followedClub?.some((item: any) => item.club_id === clubId) ?? false
    },
    [followedClub]
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await GetAllClubs()
    setRefreshing(false)
  }, [GetAllClubs])

  const handleCreateClub = useCallback(() => {
    router.push('/add-club')
  }, [router])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  // Memoized render function for performance
  const renderClubItem = useCallback(
    ({ item }: { item: CLUB }) => (
      <ClubCard
        {...item}
        isFollowed={isFollowed(item.id)}
        refreshData={GetAllClubs}
      />
    ),
    [isFollowed, GetAllClubs]
  )

  const keyExtractor = useCallback((item: CLUB) => `club-${item.id}`, [])

  const ListEmptyComponent = useCallback(
    () => (
      <Surface style={styles.emptyContainer}>
        <Text variant="titleLarge" style={styles.emptyTitle}>
          {searchQuery.length > 0
            ? 'Няма намерени групи'
            : 'Няма налични групи'}
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          {searchQuery.length > 0
            ? 'Опитайте с различни ключови думи'
            : 'Бъдете първи, които създават група'}
        </Text>
        {searchQuery.length > 0 && (
          <Button
            mode="outlined"
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            Изчисти търсенето
          </Button>
        )}
      </Surface>
    ),
    [searchQuery]
  )

  useEffect(() => {
    GetAllClubs()
  }, [GetAllClubs])

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            iconColor={theme.colors.onPrimary}
            onPress={handleBack}
          />
          <Text
            variant="headlineMedium"
            style={[styles.headerTitle, { color: theme.colors.onPrimary }]}
          >
            Открий групи
          </Text>
        </View>
        <Text
          variant="bodyLarge"
          style={[styles.headerSubtitle, { color: theme.colors.onPrimary }]}
        >
          Намери и се присъедини към групи по интереси
        </Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Търси групи..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          elevation={3}
        />
      </View>

      {/* Create New Club Card */}
      <Card
        style={styles.createClubCard}
        mode="elevated"
        onPress={handleCreateClub}
      >
        <Card.Content style={styles.createClubContent}>
          <View style={styles.createClubTextContainer}>
            <Text variant="titleMedium" style={styles.createClubTitle}>
              Създайте нова група
            </Text>
            <Text variant="bodyMedium" style={styles.createClubSubtitle}>
              Споделете своите интереси с други студенти
            </Text>
          </View>
          <IconButton
            icon="plus-circle"
            iconColor={theme.colors.primary}
            size={32}
          />
        </Card.Content>
      </Card>

      {/* Statistics Chips */}
      <View style={styles.statsContainer}>
        <Chip icon="account-group" style={styles.statChip}>
          {filteredClubs.length} групи
        </Chip>
        <Chip icon="magnify" style={styles.statChip}>
          {searchQuery ? 'Филтрирано' : 'Всички'}
        </Chip>
      </View>

      {/* Clubs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.loadingText}>
            Зареждане на групи...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredClubs}
          renderItem={renderClubItem}
          keyExtractor={keyExtractor}
          numColumns={1} // Changed from 2 to 1
          contentContainerStyle={styles.clubsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={ListEmptyComponent}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8} // Increased since items are smaller
          getItemLayout={(data, index) => ({
            length: 120, // Reduced height for horizontal layout
            offset: 120 * index,
            index,
          })}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerSubtitle: {
    opacity: 0.9,
    marginLeft: 60,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -25,
    marginBottom: 20,
    zIndex: 10,
  },
  searchbar: {
    elevation: 3,
  },
  createClubCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  createClubContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  createClubTextContainer: {
    flex: 1,
  },
  createClubTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  createClubSubtitle: {
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  statChip: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    opacity: 0.7,
  },
  clubsList: {
    // Merged properties - removed duplication
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    borderRadius: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  clearButton: {
    marginTop: 12,
  },
})
