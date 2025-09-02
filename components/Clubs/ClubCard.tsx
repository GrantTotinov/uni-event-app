// components/Clubs/ClubCard.tsx
import React, { useContext, useState, useEffect, useCallback } from 'react'
import { StyleSheet, Alert, View, TouchableOpacity } from 'react-native'
import { Surface, Card, Avatar, Text, useTheme, Chip } from 'react-native-paper'
import { CLUB } from '@/app/explore-clubs'
import { AuthContext } from '@/context/AuthContext'
import { useAppTheme } from '@/context/ThemeContext'
import axios from 'axios'
import ClubDetailsModal from './ClubDetailsModal'

interface ClubCardProps extends CLUB {
  isFollowed: boolean
  refreshData: () => void
}

export default React.memo(function ClubCard({
  id,
  name,
  club_logo,
  about,
  isFollowed: initialIsFollowed,
  refreshData,
}: ClubCardProps) {
  const { user } = useContext(AuthContext)
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()
  const [isFollowed, setIsFollowed] = useState(initialIsFollowed)
  const [modalVisible, setModalVisible] = useState(false)

  useEffect(() => {
    setIsFollowed(initialIsFollowed)
  }, [initialIsFollowed])

  const handleFollowToggle = useCallback(async () => {
    if (!user?.email) {
      Alert.alert('Грешка', 'Трябва да сте влезли в системата')
      throw new Error('User not logged in')
    }

    try {
      if (isFollowed) {
        await axios.delete(
          `${
            process.env.EXPO_PUBLIC_HOST_URL
          }/clubfollower?u_email=${encodeURIComponent(
            user.email
          )}&club_id=${id}`
        )
      } else {
        await axios.post(`${process.env.EXPO_PUBLIC_HOST_URL}/clubfollower`, {
          u_email: user.email,
          clubId: id,
        })
      }

      setIsFollowed(!isFollowed)
    } catch (error) {
      console.error('Error updating follow status:', error)
      Alert.alert('Грешка', 'Неуспешна операция при последване')
      throw error
    }
  }, [user?.email, isFollowed, id])

  const handleCardPress = useCallback(() => {
    setModalVisible(true)
  }, [])

  const handleModalClose = useCallback(() => {
    setModalVisible(false)
  }, [])

  return (
    <>
      <TouchableOpacity onPress={handleCardPress} activeOpacity={0.7}>
        <Surface
          style={[
            styles.cardContainer,
            {
              backgroundColor: theme.colors.surface,
              shadowColor: theme.colors.shadow,
              elevation: isDarkMode ? 3 : 2,
            },
          ]}
          elevation={isDarkMode ? 3 : 2}
        >
          <Card style={styles.card} mode="contained">
            <Card.Content style={styles.cardContent}>
              {/* Club Avatar */}
              <Avatar.Image
                size={60}
                source={{
                  uri:
                    club_logo ||
                    'https://placehold.co/100x100/cccccc/ffffff?text=Club',
                }}
                style={styles.avatar}
              />

              {/* Club Info */}
              <View style={styles.infoContainer}>
                <Text
                  variant="titleMedium"
                  style={[styles.clubName, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                >
                  {name || 'Неименована група'}
                </Text>

                {/* Status Chip */}
                <Chip
                  icon={isFollowed ? 'check-circle' : 'account-group-outline'}
                  mode="flat"
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: isFollowed
                        ? theme.colors.primaryContainer
                        : theme.colors.secondaryContainer,
                    },
                  ]}
                  textStyle={{
                    color: isFollowed
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSecondaryContainer,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                  compact
                >
                  {isFollowed ? 'Последвана' : 'Нова'}
                </Chip>
              </View>

              {/* Arrow indicator */}
              <View style={styles.arrowContainer}>
                <Text
                  style={[
                    styles.arrow,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  ›
                </Text>
              </View>
            </Card.Content>
          </Card>
        </Surface>
      </TouchableOpacity>

      {/* Details Modal */}
      <ClubDetailsModal
        visible={modalVisible}
        onClose={handleModalClose}
        clubId={id}
        clubName={name}
        clubLogo={club_logo}
        clubAbout={about}
        isFollowed={isFollowed}
        onFollowToggle={handleFollowToggle}
        refreshData={refreshData}
      />
    </>
  )
})

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    // Fixed size avatar
  },
  infoContainer: {
    flex: 1,
    gap: 6,
  },
  clubName: {
    fontWeight: '600',
    fontSize: 16,
  },
  statusChip: {
    alignSelf: 'flex-start',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  arrow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
})
