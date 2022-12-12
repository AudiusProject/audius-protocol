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
    reaction: string
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

export type ChatPermitRPC = {
  method: 'chat.permit'
  params: {
    permit: 'all' | 'tippers' | 'followees' | 'none'
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
  | ChatPermitRPC

export type RPCMethod = RPCPayload['method']

export type UserChat = {
  // User agnostic
  chat_id: string
  last_message_at: String
  members: Array<{ user_id: string }>

  // User specific
  invite_code: string
  unread_message_count: number
  last_read_at: string
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

export type CommsResponse = {
  health: {
    is_healthy: boolean
  }
  summary?: {
    next_cursor: string
    remaining_count: number
    total_count: number
  }
  data: any
}
