import { View, Text, FlatList } from "react-native"
import React, { useEffect, useState } from "react"
import axios from "axios"
import ClubCard from "@/components/Clubs/ClubCard"
import Button from "@/components/Shared/Button"
import Colors from "@/data/Colors"
import { useRouter } from "expo-router"

export type CLUB = {
  id: number
  name: string
  club_logo: string
  about: string
  createdon: string
}

export default function ExploreClubs() {
  const router = useRouter()
  const onAddClubBtnClick = () => {}
  const [clubList, setClubList] = useState<CLUB[] | []>([])
  useEffect(() => {
    GetAllClubs()
  }, [])
  const GetAllClubs = async () => {
    const result = await axios.get(process.env.EXPO_PUBLIC_HOST_URL + "/clubs")
    console.log(result.data)
    setClubList(result.data)
  }
  return (
    <View>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          padding: 10,
          margin: 5,
          alignItems: "center",
          borderWidth: 1,
          borderStyle: "dashed",
          borderRadius: 15,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            color: Colors.GRAY,
          }}
        >
          Създайте нов Клуб / Група
        </Text>
        <Button text="+ Добави" onPress={() => router.push("/add-club")} />
      </View>
      <FlatList
        numColumns={2}
        data={clubList}
        renderItem={({ item: CLUB, index }) => <ClubCard {...CLUB} />}
      />
    </View>
  )
}
