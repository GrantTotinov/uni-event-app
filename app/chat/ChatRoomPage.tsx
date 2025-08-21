import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Keyboard,
  SafeAreaView,
  BackHandler,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  Thread,
} from 'stream-chat-expo'
import Colors from '@/data/Colors'

interface ChatRoomProps {
  chatClient: any
  channel: any
  onBack: () => void
}

export default function ChatRoomPage({
  chatClient,
  channel,
  onBack,
}: ChatRoomProps) {
  const [thread, setThread] = useState<any>(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const isAndroid = Platform.OS === 'android'

  // --- Keyboard listeners ---
  useEffect(() => {
    const showEvent = isAndroid ? 'keyboardDidShow' : 'keyboardWillShow'
    const hideEvent = isAndroid ? 'keyboardDidHide' : 'keyboardWillHide'

    const showListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardVisible(true)
      setKeyboardHeight(e.endCoordinates.height)
    })
    const hideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false)
      setKeyboardHeight(0)
    })

    return () => {
      showListener.remove()
      hideListener.remove()
    }
  }, [])

  // --- Android back button ---
  useEffect(() => {
    const handleBack = () => {
      if (keyboardVisible) {
        Keyboard.dismiss()
        return true
      }
      if (thread) {
        setThread(null)
        return true
      }
      return false
    }
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBack
    )
    return () => backHandler.remove()
  }, [keyboardVisible, thread])

  if (!chatClient || !channel) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={{ color: Colors.GRAY }}>
          Чат клиентът не е инициализиран.
        </Text>
      </SafeAreaView>
    )
  }

  const channelName = channel.data?.name || 'Чат'
  const dismissKeyboard = useCallback(() => Keyboard.dismiss(), [])

  return (
    <SafeAreaView style={styles.safeArea}>
      <Chat client={chatClient}>
        <Channel
          channel={channel}
          thread={thread}
          disableKeyboardCompatibleView={true} // важно за pan
          AttachmentPicker={() => null}
        >
          <ChatHeader
            channelName={channelName}
            onBack={onBack}
            dismissKeyboard={dismissKeyboard}
          />

          {/* KeyboardAvoidingView с правилно отместване */}
          <KeyboardAvoidingView
            behavior={isAndroid ? 'height' : 'padding'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={isAndroid ? -240 : 60}
          >
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={{ flex: 1 }}>
                <MessageList
                  onThreadSelect={setThread}
                  onPress={dismissKeyboard}
                  contentContainerStyle={{
                    paddingBottom: keyboardVisible ? keyboardHeight + 8 : 8, // 8px padding над Input
                  }}
                />
                <MessageInput disableAttachments dismissKeyboardOnSubmit />
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>

          {thread && (
            <Thread
              thread={thread}
              onThreadDismount={() => setThread(null)}
              MessageInput={() => (
                <MessageInput disableAttachments dismissKeyboardOnSubmit />
              )}
            />
          )}
        </Channel>
      </Chat>
    </SafeAreaView>
  )
}

function ChatHeader({ channelName, onBack, dismissKeyboard }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={Colors.PRIMARY} />
      </TouchableOpacity>
      <Text style={styles.title} numberOfLines={1}>
        {channelName}
      </Text>
      <TouchableOpacity onPress={dismissKeyboard} style={styles.headerAction}>
        <Ionicons name="chevron-down" size={24} color={Colors.PRIMARY} />
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.WHITE },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.LIGHT_GRAY,
    backgroundColor: Colors.WHITE,
    zIndex: 10,
  },
  backButton: { padding: 8 },
  headerAction: { padding: 8, width: 40, alignItems: 'center' },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.PRIMARY,
    marginLeft: 8,
    flex: 1,
  },
})
