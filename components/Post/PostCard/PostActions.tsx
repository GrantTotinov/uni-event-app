import React, { memo, useMemo } from 'react'
import {
  Text,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Surface, useTheme } from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import * as Clipboard from 'expo-clipboard'
import { useAppTheme } from '@/context/ThemeContext'

interface PostActionsProps {
  isLiked: boolean
  likeCount: number
  commentCount: number
  commentsVisible: boolean
  onToggleLike: () => void
  onToggleComments: () => void
  commentText: string
  onCommentTextChange: (text: string) => void
  onSubmitComment: () => void
  user: any
  postContent?: string
  postId?: number
  postImageUrl?: string
  totalCommentCount?: number // New prop for total comments including replies
  isTogglingLike?: boolean
}

const PostActions = memo(function PostActions({
  isLiked,
  likeCount,
  commentCount,
  commentsVisible,
  onToggleLike,
  onToggleComments,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  user,
  postContent,
  postId,
  postImageUrl,
  totalCommentCount,
  isTogglingLike = false,
}: PostActionsProps) {
  const { isDarkMode } = useAppTheme()
  const theme = useTheme()

  // Memoized theme colors for performance - following optimization guidelines
  const colors = useMemo(
    () => ({
      surface: theme.colors.surface,
      onSurface: theme.colors.onSurface,
      primary: theme.colors.primary,
      onPrimary: theme.colors.onPrimary,
      secondary: theme.colors.secondary,
      onSecondary: theme.colors.onSecondary,
      surfaceVariant: theme.colors.surfaceVariant,
      onSurfaceVariant: theme.colors.onSurfaceVariant,
      outline: theme.colors.outline,
      primaryContainer: theme.colors.primaryContainer,
      onPrimaryContainer: theme.colors.onPrimaryContainer,
      secondaryContainer: theme.colors.secondaryContainer,
      onSecondaryContainer: theme.colors.onSecondaryContainer,
      tertiaryContainer: theme.colors.tertiaryContainer,
      onTertiaryContainer: theme.colors.onTertiaryContainer,
    }),
    [theme.colors]
  )

  // Share handler - memoized with useCallback following performance guidelines
  const handleShare = React.useCallback(async () => {
    try {
      const isSharingAvailable = await Sharing.isAvailableAsync()
      const postLink = postId ? `https://academix.bg/post/${postId}` : ''
      const shareText =
        (postContent ? `Публикация:\n${postContent}\n\n` : '') + postLink

      if (postImageUrl && isSharingAvailable) {
        const downloadResult = await FileSystem.downloadAsync(
          postImageUrl,
          FileSystem.cacheDirectory + `shared-post-image.jpg`
        )
        if (Platform.OS === 'ios') {
          await Sharing.shareAsync(downloadResult.uri, {
            dialogTitle: 'Сподели публикация',
            UTI: 'public.jpeg',
            mimeType: 'image/jpeg',
          })
        } else {
          await Sharing.shareAsync(downloadResult.uri)
          if (postLink) {
            await Clipboard.setStringAsync(postLink)
            Alert.alert(
              'Линк към публикацията',
              'Линкът към публикацията е копиран в клипборда. Можете да го поставите при споделяне.'
            )
          }
        }
        return
      }

      if (isSharingAvailable) {
        const fileUri = FileSystem.cacheDirectory + 'shared-post.txt'
        await FileSystem.writeAsStringAsync(fileUri, shareText)
        await Sharing.shareAsync(fileUri)
        return
      }

      await Clipboard.setStringAsync(shareText)
      Alert.alert(
        'Споделяне',
        'Текстът и линкът към публикацията са копирани в клипборда, можете да ги поставите където желаете.'
      )
    } catch (error) {
      console.error('Share error:', error)
      Alert.alert('Грешка', 'Неуспешно споделяне.')
    }
  }, [postContent, postId, postImageUrl])

  // Use total comment count (including replies) if provided, otherwise fall back to commentCount
  const displayCommentCount = totalCommentCount ?? commentCount

  return (
    <View style={styles.container}>
      {/* Engagement Stats Bar - Only show if there are likes or comments */}
      {(likeCount > 0 || displayCommentCount > 0) && (
        <View style={styles.engagementBar}>
          <View style={styles.engagementContent}>
            {/* Like indicator */}
            {likeCount > 0 && (
              <View style={styles.engagementGroup}>
                <Surface
                  style={[
                    styles.reactionIcon,
                    { backgroundColor: colors.primary },
                  ]}
                  elevation={1}
                >
                  <Ionicons name="heart" size={12} color={colors.onPrimary} />
                </Surface>
                <Text
                  style={[
                    styles.engagementText,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {likeCount}
                </Text>
              </View>
            )}

            {/* Separator dot */}
            {likeCount > 0 && displayCommentCount > 0 && (
              <Text
                style={[
                  styles.separatorDot,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                •
              </Text>
            )}

            {/* Comment count */}
            {displayCommentCount > 0 && (
              <Text
                style={[
                  styles.engagementText,
                  { color: colors.onSurfaceVariant },
                ]}
              >
                {displayCommentCount}{' '}
                {displayCommentCount === 1 ? 'коментар' : 'коментара'}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Action Buttons - Facebook mobile style without badges */}
      <View style={styles.actionsContainer}>
        {/* Like Button */}
        <TouchableOpacity
          onPress={onToggleLike}
          style={[
            styles.actionButton,
            isLiked && { backgroundColor: colors.primaryContainer },
            isTogglingLike && styles.actionButtonDisabled, // ДОБАВЕНО: Disabled style
          ]}
          activeOpacity={0.7}
          disabled={isTogglingLike} // ДОБАВЕНО: Disable при loading
          accessibilityLabel={
            isTogglingLike
              ? 'Обработва се...'
              : isLiked
              ? 'Премахни харесване'
              : 'Харесай'
          }
          accessibilityRole="button"
        >
          {isTogglingLike ? (
            // ДОБАВЕНО: Loading indicator
            <ActivityIndicator
              size={20}
              color={isLiked ? colors.primary : colors.onSurface}
            />
          ) : (
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? colors.primary : colors.onSurface}
            />
          )}
          <Text
            style={[
              styles.actionText,
              {
                color: isLiked ? colors.primary : colors.onSurface,
                fontWeight: isLiked ? '600' : '500',
                opacity: isTogglingLike ? 0.6 : 1, // ДОБАВЕНО: Opacity при loading
              },
            ]}
          >
            {isTogglingLike ? 'Обработва...' : 'Харесай'}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          onPress={onToggleComments}
          style={styles.actionButton}
          activeOpacity={0.7}
          accessibilityLabel="Коментирай публикацията"
          accessibilityRole="button"
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={colors.onSurface}
          />
          <Text
            style={[
              styles.actionText,
              { color: colors.onSurface, fontWeight: '500' },
            ]}
          >
            Коментирай
          </Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          onPress={handleShare}
          style={styles.actionButton}
          activeOpacity={0.7}
          accessibilityLabel="Сподели публикацията"
          accessibilityRole="button"
        >
          <Ionicons name="share-outline" size={20} color={colors.onSurface} />
          <Text
            style={[
              styles.actionText,
              { color: colors.onSurface, fontWeight: '500' },
            ]}
          >
            Сподели
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
})

// Optimized styles following performance guidelines
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  engagementBar: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  engagementContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  engagementGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reactionIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  engagementText: {
    fontSize: 13,
    fontWeight: '500',
  },
  separatorDot: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.6,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionText: {
    fontSize: 14,
    textAlign: 'center',
  },
})

export default PostActions
