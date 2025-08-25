import React from 'react'
import { Modal, View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
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
      statusBarTranslucent={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.BLACK} />
          </TouchableOpacity>
          <Text style={styles.title}>Коментари</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Comments */}
        <View style={styles.commentsContainer}>
          <PostComments {...commentsProps} />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.LIGHT_GRAY,
    backgroundColor: Colors.WHITE,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F0F2F5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.BLACK,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40, // Same width as close button to center the title
  },
  commentsContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
})
