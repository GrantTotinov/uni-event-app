import { StreamChat } from 'stream-chat'

// Вземи API key от Stream Dashboard (App Access Keys → API Key)
const API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY!

// Създаваме един инстанс на Stream клиента
export const chatClient = StreamChat.getInstance(API_KEY)
