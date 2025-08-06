import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  StatusBar,
  SafeAreaView,
} from "react-native"
import React, { useContext, useEffect, useState } from "react"
import axios from "axios"
import ClubCard from "@/components/Clubs/ClubCard"
import Button from "@/components/Shared/Button"
import Colors from "@/data/Colors"
import { useRouter } from "expo-router"
import { AuthContext } from "@/context/AuthContext"
import Ionicons from "@expo/vector-icons/Ionicons"
import { LinearGradient } from "expo-linear-gradient"

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
  const [clubList, setClubList] = useState<CLUB[] | []>([])
  const [searchQuery, setSearchQuery] = useState("")

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

  const isFollowed = (clubId: number) => {
    return followedClub?.some((item: any) => item.club_id === clubId)
  }

  // Филтриране на клубовете според търсенето
  const filteredClubs = searchQuery
    ? clubList.filter((club) =>
        club.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : clubList

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Заглавие на страницата с подобрен градиент и поле */}
      <LinearGradient
        colors={[Colors.PRIMARY, Colors.SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.backButtonContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Открий Клубове</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Намери и се присъедини към групи по интереси
        </Text>
      </LinearGradient>

      {/* Търсачка с подобрен дизайн */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={22}
            color={Colors.PRIMARY}
            style={{ marginRight: 8 }}
          />
          <TextInput
            placeholder="Търси клубове..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholderTextColor={Colors.GRAY}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={22} color={Colors.PRIMARY} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Секция за създаване на нов клуб с подобрен дизайн */}
      <TouchableOpacity
        style={styles.createClubCard}
        onPress={() => router.push("/add-club")}
      >
        <View style={styles.createClubContent}>
          <View>
            <Text style={styles.createClubTitle}>
              Създайте нов Клуб / Група
            </Text>
            <Text style={styles.createClubSubtitle}>
              Споделете своите интереси с други студенти
            </Text>
          </View>
          <View style={styles.addButtonContainer}>
            <Ionicons name="add-circle" size={28} color={Colors.PRIMARY} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Списък с клубове */}
      <FlatList
        contentContainerStyle={styles.clubList}
        numColumns={2}
        data={filteredClubs}
        renderItem={({ item: CLUB, index }) => (
          <ClubCard
            {...CLUB}
            isFollowed={isFollowed(CLUB.id)}
            refreshData={GetAllClubs}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={
                searchQuery.length > 0 ? "search-outline" : "people-outline"
              }
              size={60}
              color={Colors.LIGHT_GRAY}
            />
            <Text style={styles.emptyText}>
              {searchQuery.length > 0
                ? "Няма намерени клубове, отговарящи на търсенето"
                : "Няма налични клубове"}
            </Text>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.resetButtonText}>Изчисти търсенето</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  backButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    padding: 5,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.WHITE,
    marginLeft: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.WHITE,
    opacity: 0.9,
    marginTop: 5,
    marginLeft: 34,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: -22,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.BLACK,
    paddingVertical: 5,
  },
  clearButton: {
    padding: 3,
  },
  createClubCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: "#e8f4f2", // Светъл фон
    borderWidth: 1,
    borderColor: "#d0e6e3", // По-тъмна граница
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  createClubContent: {
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  createClubTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: Colors.PRIMARY, // Основен цвят за заглавието
    marginBottom: 6,
  },
  createClubSubtitle: {
    fontSize: 14,
    color: Colors.GRAY, // Сив текст за подзаглавието
  },
  addButtonContainer: {
    backgroundColor: Colors.WHITE,
    borderRadius: 50,
    padding: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  clubList: {
    paddingHorizontal: 10,
    paddingBottom: 120,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: Colors.GRAY,
    marginTop: 15,
    textAlign: "center",
  },
  resetButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: Colors.PRIMARY + "20",
  },
  resetButtonText: {
    color: Colors.PRIMARY,
    fontWeight: "500",
  },
})
