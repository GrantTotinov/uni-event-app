import { View, Text } from "react-native"
import React from "react"
import Colors from "@/data/Colors"
import Header from "@/components/Home/Header"
import Category from "@/components/Home/Category"

export default function Home() {
  return (
    <View
      style={{
        padding: 20,
        paddingTop: 40,
        //backgroundColor: Colors.WHITE,
      }}
    >
      {/* Header */}
      <Header />
      {/* Category */}
      <Category />
      {/* Latest Post*/}
    </View>
  )
}
