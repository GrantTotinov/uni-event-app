// app/add-post/index.tsx
import React, { useContext } from 'react'
import { View, StyleSheet, StatusBar } from 'react-native'
import { Surface, Text, useTheme } from 'react-native-paper'
import { AuthContext } from '@/context/AuthContext'
import WritePost from '@/components/Post/WritePost'
import { useAppTheme } from '@/context/ThemeContext'

// Single responsibility: Display AddPost screen with proper default export
const AddPost = React.memo(function AddPost() {
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()

  // Early return pattern for loading state following performance guidelines
  if (!user?.name || !user?.image) {
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
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Създай публикация
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Сподели нещо интересно с общността
        </Text>
      </Surface>

      <WritePost />
    </Surface>
  )
})

// Proper default export following React Native guidelines
export default AddPost

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
  headerTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
})
