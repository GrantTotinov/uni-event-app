import { View, Text, FlatList } from "react-native"
import React, { useState } from "react"
import Colors from "@/data/Colors"
import Header from "@/components/Home/Header"
import Category from "@/components/Home/Category"
import LatestPost from "@/components/Home/LatestPost"

export default function Home() {
  const [search, setSearch] = useState("")
  return (
    <FlatList
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <View style={{ padding: 20, paddingTop: 40 }}>
          <Header search={search} setSearch={setSearch} />
          <LatestPost search={search} />
        </View>
      }
    />
  )
}
