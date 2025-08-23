import { PropsWithChildren, createContext, useContext, useState } from 'react'
import { Channel as ChannelType } from 'stream-chat'
import { ThreadContextValue } from 'stream-chat-expo'

export type ChatContextType = {
  channel: ChannelType | undefined
  setChannel: React.Dispatch<React.SetStateAction<ChannelType | undefined>>
  setThread: React.Dispatch<
    React.SetStateAction<ThreadContextValue['thread'] | undefined>
  >
  thread: ThreadContextValue['thread'] | undefined
}

export const ChatContext = createContext<ChatContextType>({
  channel: undefined,
  setChannel: () => {},
  setThread: () => {},
  thread: undefined,
})

export const ChatProvider = ({ children }: PropsWithChildren) => {
  const [channel, setChannel] = useState<ChannelType | undefined>(undefined)
  const [thread, setThread] = useState<
    ThreadContextValue['thread'] | undefined
  >(undefined)

  return (
    <ChatContext.Provider value={{ channel, setChannel, thread, setThread }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChatContext = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}
