import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Linking,
} from 'react-native'
import { Image } from 'expo-image'
import axios from 'axios'
import { styles } from './styles'

interface DocumentFile {
  id: number
  file_name: string
  file_type: string
  file_url: string
  created_by: string
  created_on: string
}

interface PostContentProps {
  post: any
}

export default function PostContent({ post }: PostContentProps) {
  const [documents, setDocuments] = useState<DocumentFile[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  useEffect(() => {
    let isMounted = true
    const fetchDocuments = async () => {
      setLoadingDocs(true)
      try {
        const res = await axios.get(
          `${process.env.EXPO_PUBLIC_HOST_URL}/documents?postId=${post?.post_id}`
        )
        if (isMounted && Array.isArray(res.data)) {
          setDocuments(res.data)
        }
      } catch (e) {
        // Silent fail
      }
      setLoadingDocs(false)
    }
    if (post?.post_id) fetchDocuments()
    return () => {
      isMounted = false
    }
  }, [post?.post_id])

  return (
    <View>
      <Text style={styles.contentText}>{post?.context}</Text>

      {/* Documents section */}
      {loadingDocs ? (
        <ActivityIndicator
          size="small"
          color="#005fff"
          style={{ marginVertical: 8 }}
        />
      ) : documents.length > 0 ? (
        <View style={styles.documentsContainer}>
          <Text style={styles.documentsTitle}>Прикачени файлове:</Text>
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.documentRow}
                onPress={() => Linking.openURL(item.file_url)}
              >
                <Text style={styles.documentName}>{item.file_name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : null}

      {post.imageurl && (
        <Image
          source={{ uri: post.imageurl }}
          style={styles.postImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      )}
    </View>
  )
}
