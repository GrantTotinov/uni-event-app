import React from 'react'
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import PostComments from './PostComments'
import Colors from '@/data/Colors'

interface PostCommentsModalProps {
  visible: boolean
  onClose: () => void
  commentsProps: any
}

export default function PostCommentsModal({
  visible,
  onClose,
  commentsProps,
}: PostCommentsModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Затвори</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Коментари</Text>
      </View>
      <View style={{ flex: 1 }}>
        <PostComments {...commentsProps} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: Colors.LIGHT_GRAY,
    backgroundColor: Colors.WHITE,
  },
  closeButton: {
    marginRight: 16,
    padding: 8,
  },
  closeText: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
  },
})
