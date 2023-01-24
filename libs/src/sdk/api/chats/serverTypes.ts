// NOTE: No imports allowed - quicktype is not yet able to track imports!

export type ChatCreateRPC = {
  method: 'chat.create'
  params: {
    chat_id: string
    invites: Array<{
      user_id: string
      invite_code: string
    }>
  }
}

export type ChatDeleteRPC = {
  method: 'chat.delete'
  params: {
    chat_id: string
  }
}

export type ChatInviteRPC = {
  method: 'chat.invite'
  params: {
    chat_id: string
    invites: Array<{
      user_id: string
      invite_code: string
    }>
  }
}

export type ChatMessageRPC = {
  method: 'chat.message'
  params: {
    chat_id: string
    message_id: string
    message: string
    parent_message_id?: string
  }
}

export type ChatReactRPC = {
  method: 'chat.react'
  params: {
    chat_id: string
    message_id: string
    reaction: string | null
  }
}

export type ChatReadRPC = {
  method: 'chat.read'
  params: {
    chat_id: string
  }
}

export type ChatBlockRPC = {
  method: 'chat.block'
  params: {
    user_id: string
  }
}

export type ChatUnblockRPC = {
  method: 'chat.unblock'
  params: {
    user_id: string
  }
}

export type ChatPermitRPC = {
  method: 'chat.permit'
  params: {
    permit: ChatPermission
  }
}

export type RPCPayload =
  | ChatCreateRPC
  | ChatDeleteRPC
  | ChatInviteRPC
  | ChatMessageRPC
  | ChatReactRPC
  | ChatReadRPC
  | ChatBlockRPC
  | ChatUnblockRPC
  | ChatPermitRPC

export type RPCMethod = RPCPayload['method']

export type UserChat = {
  // User agnostic
  chat_id: string
  last_message_at: string
  chat_members: Array<{ user_id: string }>

  // User specific
  last_message: string
  invite_code: string
  unread_message_count: number
  last_read_at: string
  cleared_history_at: string
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

export type ChatInvite = {
  user_id: string
  invite_code: string
}

/**
 * Defines who the user allows to message them
 */
export enum ChatPermission {
  /**
   * Messages are allowed for everyone
   */
  ALL = 'all',
  /**
   * Messages are only allowed for users that have tipped me
   */
  TIPPERS = 'tippers',
  /**
   * Messages are only allowed for users I follow
   */
  FOLLOWEES = 'followees',
  /**
   * Messages are not allowed
   */
  NONE = 'none'
}

export type CommsResponse = {
  health: {
    is_healthy: boolean
  }
  summary?: {
    prev_cursor: string
    prev_count: number
    next_cursor: string
    next_count: number
    total_count: number
  }
  // Overridden in client types but left as any for the server.
  // quicktype/golang doesn't do well with union types
  data: any
}
