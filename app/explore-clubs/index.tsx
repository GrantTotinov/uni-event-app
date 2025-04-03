import { View, Text, FlatList } from "react-native"
import React, { useContext, useEffect, useState } from "react"
import axios from "axios"
import ClubCard from "@/components/Clubs/ClubCard"
import Button from "@/components/Shared/Button"
import Colors from "@/data/Colors"
import { useRouter } from "expo-router"
import { AuthContext } from "@/context/AuthContext"

export type CLUB = {
  id: number
  name: string
  club_logo: string
  about: string
  createdon: string
  isFollowed: boolean
  refreshData: () => void
}

export default function ExploreClubs() {
  const router = useRouter()
  const { user } = useContext(AuthContext)
  const [followedClub, setFollowedClub] = useState<any>()
  const onAddClubBtnClick = () => {}
  const [clubList, setClubList] = useState<CLUB[] | []>([])
  useEffect(() => {
    GetAllClubs()
  }, [])
  const GetAllClubs = async () => {
    const result = await axios.get(process.env.EXPO_PUBLIC_HOST_URL + "/clubs")
    console.log(result.data)
    setClubList(result.data)
    GetUserFollowedClubs()
  }
  const GetUserFollowedClubs = async () => {
    const result = await axios.get(
      process.env.EXPO_PUBLIC_HOST_URL + "/clubfollower?u_email=" + user?.email
    )
    console.log(result?.data)
    setFollowedClub(result?.data)
  }
  /*const isFollowed = (clubId: number) => {
    const record =
      followedClub && followedClub?.find((item: any) => item.club_id == clubId)
    return record ? true : false
  }*/
  const isFollowed = (clubId: number) => {
    return followedClub?.some((item: any) => item.club_id === clubId)
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
        contentContainerStyle={{ paddingBottom: 120 }}
        numColumns={2}
        data={clubList}
        renderItem={({ item: CLUB, index }) => (
          <ClubCard
            {...CLUB}
            isFollowed={isFollowed(CLUB.id)}
            refreshData={GetAllClubs}
          />
        )}
      />
    </View>
  )
}
