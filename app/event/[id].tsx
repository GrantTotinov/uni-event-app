import { useLocalSearchParams } from "expo-router"
import EventDetailsPage from "@/components/Events/EventDetailsPage"

export default function EventDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  // Подай id към компонента, ако той го приема като prop
  return <EventDetailsPage eventId={id} />
}
