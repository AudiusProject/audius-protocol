import type { CommsResponse } from './serverTypes'

// MODELS

export enum ChatPermission {
  ALL = 'all',
  TIPPERS = 'tippers',
  FOLLOWEES = 'followees',
  NONE = 'none'
}

export type ChatInvite = {
  user_id: string
  invite_code: string
}

// REQUEST PARAMETERS

export type ChatGetAllRequest = {
  limit?: number
  cursor?: string
}

export type ChatGetRequest = {
  chatId: string
}

export type ChatGetMessagesRequest = {
  chatId: string
  limit?: number
  cursor?: string
}

export type ChatCreateRequest = {
  chatId: string
  userId: string
  invitedUserIds: string[]
}

export type ChatInviteRequest = {
  chatId: string
  userId: string
  invitedUserIds: string[]
}

export type ChatMessageRequest = {
  chatId: string
  message: string
}

export type ChatReactRequest = {
  chatId: string
  messageId: string
  reaction: string
}

export type ChatReadRequest = {
  chatId: string
}

export type ChatBlockRequest = {
  userId: string
}

export type ChatDeleteRequest = {
  chatId: string
}

export type ChatPermitRequest = {
  permit: ChatPermission
}

// RESPONSE MODELS

export type Chat = {
  chat_id: string
  last_message_at: string
  unread_message_count: number
  members: Array<{ user_id: string }>
  last_read_at: string
  chat_secret: string
}

export type ChatMessage = {
  message_id: string
  sender_user_id: string
  created_at: string
  message: string
  reactions: Array<{
    user_id: string
    created_at: string
    reaction: string
  }>
}

export type TypedCommsResponse<T> = Omit<CommsResponse, 'data'> & {
  data: T
}
