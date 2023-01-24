import type { CommsResponse, ChatPermission } from './serverTypes'

// REQUEST PARAMETERS

export type ChatGetAllRequest = {
  limit?: number
  before?: string
  after?: string
}

export type ChatGetRequest = {
  chatId: string
}

export type ChatGetMessagesRequest = {
  chatId: string
  limit?: number
  before?: string
  after?: string
}

export type ChatCreateRequest = {
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

export type TypedCommsResponse<T> = Omit<CommsResponse, 'data'> & {
  data: T
}
