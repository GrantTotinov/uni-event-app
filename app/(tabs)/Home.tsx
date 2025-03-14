import { View, Text, FlatList } from "react-native"
import React from "react"
import Colors from "@/data/Colors"
import Header from "@/components/Home/Header"
import Category from "@/components/Home/Category"
import LatestPost from "@/components/Home/LatestPost"

export default function Home() {
  return (
    <FlatList
      data={[]}
      renderItem={null}
      ListHeaderComponent={
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
          <LatestPost />
        </View>
      }
    />
  )
}
