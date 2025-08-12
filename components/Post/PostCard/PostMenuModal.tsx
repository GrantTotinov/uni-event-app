import React from "react"
import { Modal, View, TouchableOpacity, Text } from "react-native"
import Colors from "@/data/Colors"

interface PostMenuModalProps {
  visible: boolean
  onHide: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function PostMenuModal({
  visible,
  onHide,
  onEdit,
  onDelete,
}: PostMenuModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onHide}
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "transparent",
            zIndex: 1,
          }}
          activeOpacity={1}
          onPress={onHide}
        />
        <View
          style={{
            backgroundColor: Colors.WHITE,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: 20,
            minWidth: "100%",
            elevation: 10,
            zIndex: 2,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: Colors.GRAY,
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 16,
            }}
          />
          <TouchableOpacity onPress={onEdit} style={{ paddingVertical: 16 }}>
            <Text
              style={{
                color: Colors.PRIMARY,
                fontWeight: "bold",
                fontSize: 18,
                textAlign: "center",
              }}
            >
              Редактирай
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} style={{ paddingVertical: 16 }}>
            <Text
              style={{
                color: "red",
                fontWeight: "bold",
                fontSize: 18,
                textAlign: "center",
              }}
            >
              Изтрий
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}
