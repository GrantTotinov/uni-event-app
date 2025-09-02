// components/Clubs/EmptyState.tsx
import React, { useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { Text, Button, useTheme, Surface, Icon } from 'react-native-paper'
import { useRouter } from 'expo-router'

export default React.memo(function EmptyState() {
  const router = useRouter()
  const theme = useTheme()

  const handleExploreClubs = useCallback(() => {
    router.push('/explore-clubs')
  }, [router])

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.content}>
        {/* Empty State Icon */}
        <Icon
          source="account-group-outline"
          size={120}
          color={theme.colors.outline}
        />

        {/* Empty State Text */}
        <Text
          variant="headlineSmall"
          style={[styles.title, { color: theme.colors.onSurface }]}
        >
          Все още не участвате в групи
        </Text>

        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Открийте интересни студентски групи и се присъединете към общността
        </Text>

        {/* Action Button */}
        <Button
          mode="contained"
          onPress={handleExploreClubs}
          style={styles.button}
          icon="magnify"
        >
          Открий групи
        </Button>

        {/* Secondary Action */}
        <Button
          mode="outlined"
          onPress={() => router.push('/add-club')}
          style={styles.secondaryButton}
          icon="plus"
        >
          Създай нова група
        </Button>
      </View>
    </Surface>
  )
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    margin: 20,
    borderRadius: 16,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  button: {
    marginBottom: 12,
    minWidth: 200,
  },
  secondaryButton: {
    minWidth: 200,
  },
})
