// File: app/add-club/index.tsx
import React, { useContext } from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { Surface, Text, useTheme, IconButton } from 'react-native-paper'
import { useRouter } from 'expo-router'
import { AuthContext } from '@/context/AuthContext'
import ClubInfo from '@/components/Clubs/ClubInfo'
import { useAppTheme } from '@/context/ThemeContext'

// Single responsibility: Display AddClub screen with proper default export
const AddClub = React.memo(function AddClub() {
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()
  const router = useRouter()

  // Memoized navigation handler following performance guidelines
  const handleBack = React.useCallback(() => {
    router.back()
  }, [router])

  // Early return pattern for loading state following performance guidelines
  if (!user?.email) {
    return (
      <Surface
        style={[
          styles.loadingContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text variant="bodyLarge">Зареждане...</Text>
      </Surface>
    )
  }

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        backgroundColor={theme.colors.surface}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Header */}
      <Surface
        style={[styles.header, { backgroundColor: theme.colors.surface }]}
        elevation={2}
      >
        <View style={styles.headerContent}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleBack}
            iconColor={theme.colors.onSurface}
            accessibilityLabel="Върни назад"
          />
          <View style={styles.headerTextContainer}>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              Създай нова група
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              Споделете своите интереси с общността
            </Text>
          </View>
        </View>
      </Surface>

      <ClubInfo />
    </Surface>
  )
})

// Proper default export following React Native guidelines
export default AddClub

// Optimized styles following performance guidelines
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    opacity: 0.7,
  },
})
