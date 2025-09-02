export interface ChatRoom {
  id: string
  name?: string // optional
  participants?: string[] // optional
  lastMessageTime?: any // optional
  avatar?: string
  createdAt?: any
  createdBy?: string
  lastMessage?: string
  lastMessageUser?: string
  unreadCount?: number
}

export interface Message {
  id: string
  text: string
  user?: {
    // user може да е undefined
    _id: string
    name: string
    avatar?: string
  }
  createdAt?: any
  system?: boolean
}
