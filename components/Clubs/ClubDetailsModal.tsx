// components/Clubs/ClubDetailsModal.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { View, StyleSheet, Modal, ScrollView } from 'react-native'
import {
  Surface,
  Text,
  Button,
  Avatar,
  useTheme,
  IconButton,
  Card,
  Chip,
  ActivityIndicator,
  Divider,
  Snackbar,
} from 'react-native-paper'
import { useAppTheme } from '@/context/ThemeContext'
import axios from 'axios'

interface ClubDetailsModalProps {
  visible: boolean
  onClose: () => void
  clubId: number
  clubName: string
  clubLogo: string
  clubAbout: string
  isFollowed: boolean
  onFollowToggle: () => Promise<void>
  refreshData: () => void
}

export default function ClubDetailsModal({
  visible,
  onClose,
  clubId,
  clubName,
  clubLogo,
  clubAbout,
  isFollowed,
  onFollowToggle,
  refreshData,
}: ClubDetailsModalProps) {
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [clubStats, setClubStats] = useState({
    membersCount: 0,
    postsCount: 0,
  })
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch club statistics with proper error handling following performance guidelines
  const fetchClubStats = useCallback(async () => {
    if (!visible || !clubId) return

    setStatsLoading(true)
    setError(null)

    try {
      console.log('Fetching club stats for clubId:', clubId)

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_HOST_URL}/club-stats`,
        {
          params: { clubId },
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      console.log('Club stats response:', response.data)

      if (response.data && typeof response.data === 'object') {
        setClubStats({
          membersCount: response.data.membersCount || 0,
          postsCount: response.data.postsCount || 0,
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching club stats:', error)

      // Set default values on error
      setClubStats({
        membersCount: 0,
        postsCount: 0,
      })

      // ПОПРАВЕНО: Enhanced TypeScript error handling
      if (axios.isAxiosError(error)) {
        console.log('Full axios error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          code: error.code,
          message: error.message,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            params: error.config?.params,
          },
        })

        if (error.code === 'ECONNABORTED') {
          setError('Времето за заявката изтече')
        } else if (error.response?.status === 404) {
          setError('Групата не е намерена')
        } else if (error.response?.status === 400) {
          setError('Невалидни данни за групата')
        } else if (error.response && error.response.status >= 500) {
          // ПОПРАВЕНО: Type safety
          setError(`Проблем със сървъра (${error.response.status})`)
        } else if (error.message === 'Network Error') {
          setError('Проблем с мрежовата връзка')
        } else {
          setError(`Грешка при зареждане: ${error.message}`)
        }
      } else {
        setError('Неочаквана грешка')
      }
    } finally {
      setStatsLoading(false)
    }
  }, [visible, clubId])

  useEffect(() => {
    if (visible && clubId) {
      const timer = setTimeout(() => {
        fetchClubStats()
      }, 200)

      return () => clearTimeout(timer)
    }
  }, [visible, clubId, fetchClubStats])

  const handleFollowToggle = useCallback(async () => {
    setLoading(true)
    try {
      await onFollowToggle()
      refreshData()
      // Refresh stats after follow/unfollow
      await fetchClubStats()
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setLoading(false)
    }
  }, [onFollowToggle, refreshData, fetchClubStats])

  const handleShare = useCallback(() => {
    console.log('Share club:', clubName)
  }, [clubName])

  const handleRetryStats = useCallback(() => {
    fetchClubStats()
  }, [fetchClubStats])

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
        transparent
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.overlay,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(0,0,0,0.7)'
                  : 'rgba(0,0,0,0.5)',
              },
            ]}
          />

          {/* ПОПРАВЕНО: Changed elevation from 8 to 5 (valid value) */}
          <Surface
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.surface },
            ]}
            elevation={5}
          >
            {/* Handle bar */}
            <View style={styles.handleBar}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: theme.colors.outline },
                ]}
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Детайли за групата
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
            >
              {/* Club Avatar */}
              <View style={styles.avatarContainer}>
                <Avatar.Image
                  size={120}
                  source={{
                    uri:
                      clubLogo ||
                      'https://placehold.co/120x120/cccccc/ffffff?text=Club',
                  }}
                />
              </View>

              {/* Club Name */}
              <Text
                variant="headlineMedium"
                style={[styles.clubName, { color: theme.colors.onSurface }]}
              >
                {clubName || 'Неименована група'}
              </Text>

              {/* Status Chip */}
              <View style={styles.statusContainer}>
                <Chip
                  icon={isFollowed ? 'check-circle' : 'account-group-outline'}
                  mode={isFollowed ? 'flat' : 'outlined'}
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: isFollowed
                        ? theme.colors.primaryContainer
                        : 'transparent',
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  textStyle={{
                    color: isFollowed
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.primary,
                    fontWeight: '600',
                  }}
                >
                  {isFollowed ? 'Последвана' : 'Нова'}
                </Chip>
              </View>

              {/* Statistics */}
              <Card style={styles.statsCard} mode="elevated">
                <Card.Content style={styles.statsContent}>
                  {statsLoading ? (
                    <View style={styles.statsLoadingContainer}>
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.primary}
                      />
                      <Text variant="bodyMedium" style={styles.loadingText}>
                        Зареждане на статистики...
                      </Text>
                    </View>
                  ) : error ? (
                    <View style={styles.errorContainer}>
                      <Text variant="bodyMedium" style={styles.errorText}>
                        {error}
                      </Text>
                      <Button
                        mode="outlined"
                        onPress={handleRetryStats}
                        style={styles.retryButton}
                        icon="refresh"
                      >
                        Опитай отново
                      </Button>
                    </View>
                  ) : (
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text variant="headlineSmall" style={styles.statNumber}>
                          {clubStats.membersCount}
                        </Text>
                        <Text variant="bodyMedium" style={styles.statLabel}>
                          {clubStats.membersCount === 1 ? 'член' : 'членове'}
                        </Text>
                      </View>

                      <Divider style={styles.statDivider} />

                      <View style={styles.statItem}>
                        <Text variant="headlineSmall" style={styles.statNumber}>
                          {clubStats.postsCount}
                        </Text>
                        <Text variant="bodyMedium" style={styles.statLabel}>
                          {clubStats.postsCount === 1
                            ? 'публикация'
                            : 'публикации'}
                        </Text>
                      </View>
                    </View>
                  )}
                </Card.Content>
              </Card>

              {/* Description */}
              <Card style={styles.descriptionCard} mode="outlined">
                <Card.Title
                  title="Описание"
                  titleVariant="titleLarge"
                  left={(props) => (
                    <Avatar.Icon
                      {...props}
                      icon="information-outline"
                      size={40}
                    />
                  )}
                />
                <Card.Content>
                  <Text
                    variant="bodyLarge"
                    style={[
                      styles.description,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {clubAbout || 'Няма налично описание за тази група.'}
                  </Text>
                </Card.Content>
              </Card>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <Button
                  mode={isFollowed ? 'outlined' : 'contained'}
                  onPress={handleFollowToggle}
                  loading={loading}
                  disabled={loading}
                  style={styles.followButton}
                  icon={isFollowed ? 'account-minus' : 'account-plus'}
                >
                  {loading
                    ? 'Зареждане...'
                    : isFollowed
                    ? 'Отпоследвай'
                    : 'Последвай'}
                </Button>

                <Button
                  mode="outlined"
                  onPress={handleShare}
                  style={styles.shareButton}
                  icon="share-variant"
                >
                  Сподели
                </Button>
              </View>
            </ScrollView>
          </Surface>
        </View>
      </Modal>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error && !statsLoading}
        onDismiss={() => setError(null)}
        duration={4000}
        action={{
          label: 'Опитай отново',
          onPress: handleRetryStats,
        }}
      >
        {error}
      </Snackbar>
    </>
  )
}

// Optimized styles following performance guidelines
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '60%',
    maxHeight: '90%',
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  clubName: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusChip: {
    borderWidth: 1,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsContent: {
    paddingVertical: 16,
  },
  statsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  errorText: {
    textAlign: 'center',
    opacity: 0.7,
  },
  retryButton: {
    marginTop: 8,
  },
  loadingText: {
    opacity: 0.7,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    opacity: 0.7,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  descriptionCard: {
    marginBottom: 20,
  },
  description: {
    lineHeight: 24,
  },
  actionsContainer: {
    gap: 12,
    paddingBottom: 20,
  },
  followButton: {
    paddingVertical: 8,
  },
  shareButton: {
    paddingVertical: 8,
  },
})
