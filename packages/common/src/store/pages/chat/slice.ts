import {
  TypedCommsResponse,
  UserChat,
  ChatMessage,
  ChatMessageReaction,
  ChatMessageNullableReaction,
  UnfurlResponse,
  ValidatedChatPermissions
} from '@audius/sdk'
import {
  Action,
  createSlice,
  PayloadAction,
  createEntityAdapter,
  EntityState
} from '@reduxjs/toolkit'
import dayjs from 'dayjs'

import { ID, Status, ChatMessageWithExtras } from 'models'
import { hasTail } from 'utils/chatUtils'
import { encodeHashId } from 'utils/hashIds'

type UserChatWithMessagesStatus = UserChat & {
  messagesStatus?: Status
  messagesSummary?: TypedCommsResponse<ChatMessage>['summary']
}

type ChatState = {
  chats: EntityState<UserChatWithMessagesStatus> & {
    status: Status
    summary?: TypedCommsResponse<UserChat>['summary']
  }
  messages: Record<
    string,
    EntityState<ChatMessageWithExtras> & {
      status?: Status
      summary?: TypedCommsResponse<ChatMessage>['summary']
    }
  >
  optimisticReactions: Record<string, ChatMessageReaction>
  optimisticChatRead: Record<string, UserChat>
  activeChatId: string | null
  blockees: ID[]
  blockers: ID[]
  permissions: Record<ID, ValidatedChatPermissions>
  reactionsPopupMessageId: string | null
}

type SetMessageReactionPayload = {
  userId: ID
  chatId: string
  messageId: string
  reaction: string | null
}

const chatSortComparator = (a: UserChat, b: UserChat) =>
  dayjs(a.last_message_at).isBefore(dayjs(b.last_message_at)) ? 1 : -1

export const chatsAdapter = createEntityAdapter<UserChatWithMessagesStatus>({
  selectId: (chat) => chat.chat_id,
  sortComparer: chatSortComparator
})

const { selectById: getChat } = chatsAdapter.getSelectors(
  (state: ChatState) => state.chats
)

const messageSortComparator = (a: ChatMessage, b: ChatMessage) =>
  dayjs(a.created_at).isBefore(dayjs(b.created_at)) ? 1 : -1

export const chatMessagesAdapter = createEntityAdapter<ChatMessageWithExtras>({
  selectId: (message) => message.message_id,
  sortComparer: messageSortComparator
})

const { selectById: getMessage } = chatMessagesAdapter.getSelectors()

const initialState: ChatState = {
  chats: {
    status: Status.IDLE,
    ...chatsAdapter.getInitialState()
  },
  messages: {},
  optimisticChatRead: {},
  optimisticReactions: {},
  activeChatId: null,
  blockees: [],
  blockers: [],
  permissions: {},
  reactionsPopupMessageId: null
}

const slice = createSlice({
  name: 'application/pages/chat',
  initialState,
  reducers: {
    createChat: (_state, _action: PayloadAction<{ userIds: ID[] }>) => {
      // triggers saga
    },
    createChatSucceeded: (state, action: PayloadAction<{ chat: UserChat }>) => {
      const { chat } = action.payload
      chatsAdapter.upsertOne(state.chats, chat)
      if (!(chat.chat_id in state.messages)) {
        state.messages[chat.chat_id] = chatMessagesAdapter.getInitialState()
      }
    },
    goToChat: (_state, _action: PayloadAction<{ chatId: string }>) => {
      // triggers saga
    },
    fetchMoreChats: (state) => {
      // triggers saga
      state.chats.status = Status.LOADING
    },
    fetchMoreChatsSucceeded: (
      state,
      action: PayloadAction<TypedCommsResponse<UserChat[]>>
    ) => {
      state.chats.status = Status.SUCCESS
      state.chats.summary = action.payload.summary
      for (const chat of action.payload.data) {
        if (!(chat.chat_id in state.messages)) {
          state.messages[chat.chat_id] = chatMessagesAdapter.getInitialState()
        }
      }
      chatsAdapter.addMany(state.chats, action.payload.data)
    },
    fetchMoreChatsFailed: (state) => {
      state.chats.status = Status.ERROR
    },
    fetchMoreMessages: (state, action: PayloadAction<{ chatId: string }>) => {
      // triggers saga
      if (!state.messages[action.payload.chatId]) {
        state.messages[action.payload.chatId] = {
          ...chatMessagesAdapter.getInitialState(),
          status: Status.LOADING
        }
      } else {
        state.messages[action.payload.chatId].status = Status.LOADING
      }
    },
    fetchMoreMessagesSucceeded: (
      state,
      action: PayloadAction<{
        response: TypedCommsResponse<ChatMessage[]>
        chatId: string
      }>
    ) => {
      const {
        chatId,
        response: { data, summary }
      } = action.payload
      chatsAdapter.updateOne(state.chats, {
        id: chatId,
        changes: {
          messagesStatus: Status.SUCCESS,
          messagesSummary: summary
        }
      })
      chatsAdapter.updateOne(state.chats, {
        id: chatId,
        changes: { messagesStatus: Status.SUCCESS, messagesSummary: summary }
      })
      const messagesWithTail = data.map((item, index) => {
        return { ...item, hasTail: hasTail(item, data[index - 1]) }
      })
      // Recalculate hasTail for latest message of new batch
      if (state.messages[chatId] && state.messages[chatId].ids.length > 0) {
        const prevEarliestMessageId =
          state.messages[chatId].ids[state.messages[chatId].ids.length - 1]
        const prevEarliestMessage = getMessage(
          state.messages[chatId],
          prevEarliestMessageId
        )
        const newLatestMessage = messagesWithTail[0]
        newLatestMessage.hasTail = hasTail(
          newLatestMessage,
          prevEarliestMessage
        )
      }
      chatMessagesAdapter.upsertMany(state.messages[chatId], messagesWithTail)
    },
    fetchMoreMessagesFailed: (
      state,
      action: PayloadAction<{ chatId: string }>
    ) => {
      const { chatId } = action.payload
      chatsAdapter.updateOne(state.chats, {
        id: chatId,
        changes: { messagesStatus: Status.ERROR }
      })
    },
    setMessageReaction: (
      state,
      action: PayloadAction<SetMessageReactionPayload>
    ) => {
      // triggers saga
      // Optimistically set reaction
      const { userId, messageId, reaction } = action.payload
      const encodedUserId = encodeHashId(userId)
      if (reaction) {
        state.optimisticReactions[messageId] = {
          user_id: encodedUserId,
          reaction,
          created_at: dayjs().toISOString()
        }
      } else {
        delete state.optimisticReactions[messageId]
      }
    },
    setMessageReactionSucceeded: (
      state,
      action: PayloadAction<{
        chatId: string
        messageId: string
        reaction: ChatMessageNullableReaction
      }>
    ) => {
      // Set the true state
      const { chatId, messageId, reaction } = action.payload
      delete state.optimisticReactions[messageId]

      // Ensure the message exists
      chatMessagesAdapter.addOne(state.messages[chatId], {
        message_id: messageId,
        reactions: [],
        message: '',
        sender_user_id: '',
        created_at: '',
        hasTail: false
      })
      const existingMessage = getMessage(state.messages[chatId], messageId)
      const existingReactions = existingMessage?.reactions ?? []
      const filteredReactions = existingReactions.filter(
        (r) => r.user_id !== reaction.user_id
      )
      if (reaction.reaction !== null) {
        filteredReactions.push(reaction)
      }
      chatMessagesAdapter.updateOne(state.messages[chatId], {
        id: messageId,
        changes: { reactions: filteredReactions }
      })
    },
    setMessageReactionFailed: (
      state,
      action: PayloadAction<SetMessageReactionPayload>
    ) => {
      // Reset our optimism :(
      const { messageId } = action.payload
      delete state.optimisticReactions[messageId]
    },
    fetchChatSucceeded: (state, action: PayloadAction<{ chat: UserChat }>) => {
      const { chat } = action.payload
      chatsAdapter.upsertOne(state.chats, chat)
    },
    markChatAsRead: (state, action: PayloadAction<{ chatId: string }>) => {
      // triggers saga
      // Optimistically mark as read
      const { chatId } = action.payload
      const existingChat = getChat(state, chatId)
      if (existingChat) {
        state.optimisticChatRead[chatId] = {
          ...existingChat,
          last_read_at: existingChat.last_message_at,
          unread_message_count: existingChat.unread_message_count
        }
      }
    },
    markChatAsReadSucceeded: (
      state,
      action: PayloadAction<{ chatId: string }>
    ) => {
      // Set the true state
      const { chatId } = action.payload
      delete state.optimisticChatRead[chatId]
      const existingChat = getChat(state, chatId)
      chatsAdapter.updateOne(state.chats, {
        id: chatId,
        changes: {
          last_read_at: existingChat?.last_message_at,
          unread_message_count: 0
        }
      })
    },
    markChatAsReadFailed: (
      state,
      action: PayloadAction<{ chatId: string }>
    ) => {
      // Reset our optimism :(
      const { chatId } = action.payload
      delete state.optimisticChatRead[chatId]
    },
    sendMessage: (
      _state,
      _action: PayloadAction<{ chatId: string; message: string }>
    ) => {
      // triggers saga which will add a message optimistically and replace it after success
    },
    addMessage: (
      state,
      action: PayloadAction<{
        chatId: string
        message: ChatMessage
        status?: Status
      }>
    ) => {
      // triggers saga to get chat if not exists
      const { chatId, message, status } = action.payload

      // Recalculate hasTail of previous message
      if (state.messages[chatId] && state.messages[chatId].ids.length > 0) {
        const prevLatestMessageId = state.messages[chatId].ids[0]
        const prevLatestMessage = getMessage(
          state.messages[chatId],
          prevLatestMessageId
        )!
        const prevMsgHasTail = hasTail(prevLatestMessage, message)
        chatMessagesAdapter.updateOne(state.messages[chatId], {
          id: prevLatestMessageId,
          changes: { hasTail: prevMsgHasTail }
        })
      }

      chatMessagesAdapter.upsertOne(state.messages[chatId], {
        ...message,
        hasTail: true,
        status: status ?? Status.IDLE
      })
      chatsAdapter.updateOne(state.chats, {
        id: chatId,
        changes: {
          last_message: message.message,
          last_message_at: message.created_at
        }
      })
    },
    incrementUnreadCount: (
      state,
      action: PayloadAction<{ chatId: string }>
    ) => {
      const { chatId } = action.payload
      // If we're actively reading, this will immediately get marked as read.
      // Ignore the unread bump to prevent flicker
      if (state.activeChatId !== chatId) {
        const existingChat = getChat(state, chatId)
        const existingUnreadCount = existingChat?.unread_message_count ?? 0
        chatsAdapter.updateOne(state.chats, {
          id: chatId,
          changes: { unread_message_count: existingUnreadCount + 1 }
        })
      }
    },
    /**
     * Marks the chat as currently being read.
     * Prevents flicker of unread status when new messages come in if actively reading.
     */
    setActiveChat: (
      state,
      action: PayloadAction<{ chatId: string | null }>
    ) => {
      const { chatId } = action.payload
      state.activeChatId = chatId
    },
    sendMessageFailed: (
      state,
      action: PayloadAction<{
        chatId: string
        messageId: string
      }>
    ) => {
      // Mark message as not sent
      const { chatId, messageId } = action.payload
      chatMessagesAdapter.updateOne(state.messages[chatId], {
        id: messageId,
        changes: { status: Status.ERROR }
      })
    },
    connect: (_state, _action: Action) => {
      // triggers middleware
    },
    disconnect: (_state, _action: Action) => {
      // triggers middleware
    },
    fetchBlockees: (_state, _action: Action) => {
      // triggers saga
    },
    fetchBlockeesSucceeded: (
      state,
      action: PayloadAction<{ blockees: ID[] }>
    ) => {
      state.blockees = action.payload.blockees
    },
    fetchBlockers: (_state, _action: Action) => {
      // triggers saga
    },
    fetchBlockersSucceeded: (
      state,
      action: PayloadAction<{ blockers: ID[] }>
    ) => {
      state.blockers = action.payload.blockers
    },
    blockUser: (_state, _action: PayloadAction<{ userId: ID }>) => {
      // triggers saga
    },
    unblockUser: (_state, _action: PayloadAction<{ userId: ID }>) => {
      // triggers saga
    },
    fetchPermissions: (_state, _action: PayloadAction<{ userIds: ID[] }>) => {
      // triggers saga
    },
    fetchPermissionsSucceeded: (
      state,
      action: PayloadAction<{
        permissions: Record<ID, ValidatedChatPermissions>
      }>
    ) => {
      state.permissions = {
        ...state.permissions,
        ...action.payload.permissions
      }
    },
    // Note: is not associated with any chatId because there will be at most
    // one popup message at a time. Used for reactions popup overlay in mobile.
    setReactionsPopupMessageId: (
      state,
      action: PayloadAction<{
        messageId: string | null
      }>
    ) => {
      state.reactionsPopupMessageId = action.payload.messageId
    },
    fetchLinkUnfurl: (
      _state,
      _action: PayloadAction<{
        chatId: string
        messageId: string
        href: string
      }>
    ) => {
      // triggers saga
    },
    fetchLinkUnfurlSucceeded: (
      state,
      action: PayloadAction<{
        messageId: string
        chatId: string
        unfurlMetadata: Partial<UnfurlResponse>
      }>
    ) => {
      const { messageId, chatId, unfurlMetadata } = action.payload
      chatMessagesAdapter.updateOne(state.messages[chatId], {
        id: messageId,
        changes: { unfurlMetadata }
      })
    }
  }
})

export const actions = slice.actions

export default slice.reducer
