import { Alert, Share } from 'react-native'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import * as Linking from 'expo-linking'
import { buildIcs, eventStart, formatEventDate } from './eventDate'

type ShareableEvent = {
  id: number
  name: string
  location?: string | null
  details?: string | null
  event_date: string
  event_time: string
}

export async function shareEvent(e: ShareableEvent) {
  try {
    await Share.share({
      title: e.name,
      message: [
        `🎓 ${e.name}`,
        `📅 ${formatEventDate(e.event_date, e.event_time)}`,
        e.location ? `📍 ${e.location}` : null,
        '',
        `Виж в AcademiX: ${Linking.createURL(`/event/${e.id}`)}`,
      ]
        .filter((l) => l !== null)
        .join('\n'),
    })
  } catch (error) {
    console.error('Share error:', error)
    Alert.alert('Грешка', 'Неуспешно споделяне.')
  }
}

/** Writes an .ics file and hands it to the OS share sheet (Calendar picks it up). */
export async function addEventToCalendar(e: ShareableEvent) {
  const start = eventStart(e.event_date, e.event_time)
  if (!start) {
    Alert.alert('Календар', 'Събитието няма валидна дата.')
    return
  }
  if (!FileSystem.cacheDirectory || !(await Sharing.isAvailableAsync())) {
    Alert.alert('Календар', 'Добавянето в календар не се поддържа на това устройство.')
    return
  }
  try {
    const uri = `${FileSystem.cacheDirectory}academix-event-${e.id}.ics`
    await FileSystem.writeAsStringAsync(
      uri,
      buildIcs({ id: e.id, name: e.name, location: e.location, details: e.details, start })
    )
    await Sharing.shareAsync(uri, {
      mimeType: 'text/calendar',
      UTI: 'com.apple.ical.ics',
      dialogTitle: 'Добави в календара',
    })
  } catch (error) {
    console.error('Calendar export error:', error)
    Alert.alert('Грешка', 'Неуспешно добавяне в календара.')
  }
}
