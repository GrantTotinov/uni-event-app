import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import React from 'react'
import Colors from '@/data/Colors'

type ButtonProps = {
  text: string
  onPress: () => void
  loading?: boolean
  outline?: boolean
  fullWidth?: boolean
  disabled?: boolean
}

export default function Button({
  text,
  onPress,
  loading = false,
  outline = false,
  fullWidth = false,
  disabled = false,
}: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={{
        padding: 15,
        backgroundColor: outline ? Colors.WHITE : Colors.PRIMARY,
        borderWidth: outline ? 1 : 0,
        borderColor: Colors.PRIMARY,
        marginTop: 15,
        borderRadius: 10,
        flex: fullWidth ? 1 : 0,
        opacity: disabled || loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={Colors.WHITE} />
      ) : (
        <Text
          style={{
            fontSize: 18,
            textAlign: 'center',
            color: outline ? Colors.PRIMARY : Colors.WHITE,
          }}
        >
          {text}
        </Text>
      )}
    </TouchableOpacity>
  )
}
