import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from 'react-native'
import React from 'react'
import Colors from '@/data/Colors'

type TextInputFieldProps = {
  label: string
  onChangeText: (text: string) => void
  password?: boolean
  value?: string
  inputStyle?: TextStyle
  containerStyle?: ViewStyle
}

export default function TextInputField({
  label,
  onChangeText,
  password = false,
  value,
  inputStyle,
  containerStyle,
}: TextInputFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={label}
        style={[styles.textInput, inputStyle]}
        secureTextEntry={password}
        onChangeText={onChangeText}
        value={value}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 15,
    width: '100%',
  },
  label: {
    color: Colors.GRAY,
    marginBottom: 4,
    fontSize: 15,
    fontWeight: '500',
  },
  textInput: {
    padding: 10,
    borderWidth: 0.2,
    borderRadius: 5,
    fontSize: 16,
    backgroundColor: '#fff',
  },
})
