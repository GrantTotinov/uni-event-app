import React from 'react'
import { Text, TouchableOpacity, View, Alert, Platform } from 'react-native'
import AntDesign from '@expo/vector-icons/AntDesign'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import Ionicons from '@expo/vector-icons/Ionicons'
import Colors from '@/data/Colors'
import * as Sharing from 'expo-sharing'
import * as FileSystem from 'expo-file-system'
import * as Clipboard from 'expo-clipboard'
import { styles } from './styles'

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
}

export default function PostActions({
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
}: PostActionsProps) {
  // Share handler for all post types (text, image, file, or any combination)
  const handleShare = async () => {
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
            message: shareText,
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
      Alert.alert('Грешка', 'Неуспешно споделяне.')
    }
  }

  return (
    <View>
      {/* Counter bar */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginBottom: 4,
          gap: 20,
        }}
      >
        <Text
          style={[
            styles.actionText,
            { color: Colors.PRIMARY, fontWeight: 'bold' },
          ]}
        >
          {likeCount} харесвания
        </Text>
        <Text
          style={[
            styles.actionText,
            { color: Colors.PRIMARY, fontWeight: 'bold' },
          ]}
        >
          {commentCount} коментара
        </Text>
      </View>
      {/* Actions bar */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity onPress={onToggleLike} style={styles.subContainer}>
          <AntDesign
            name="like2"
            size={24}
            color={isLiked ? Colors.PRIMARY : 'black'}
          />
          <Text
            style={[
              styles.actionText,
              {
                marginLeft: 4,
                color: isLiked ? Colors.PRIMARY : 'black',
                fontWeight: isLiked ? 'bold' : 'normal',
              },
            ]}
          >
            Харесай
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onToggleComments}
          style={styles.subContainer}
        >
          <FontAwesome name="commenting-o" size={24} color="black" />
          <Text
            style={[
              styles.actionText,
              {
                marginLeft: 4,
              },
            ]}
          >
            Коментирай
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.subContainer}>
          <Ionicons
            name="share-social-outline"
            size={24}
            color={Colors.PRIMARY}
          />
          <Text
            style={[
              styles.actionText,
              {
                marginLeft: 4,
                color: Colors.PRIMARY,
                fontWeight: 'bold',
              },
            ]}
          >
            Сподели
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
