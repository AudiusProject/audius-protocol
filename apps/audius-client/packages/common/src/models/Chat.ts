import type { ChatMessage } from '@audius/sdk'

import { Status } from 'models'

export type ChatMessageWithExtras = ChatMessage & {
  status?: Status
  hasTail: boolean
}
