import { PlayableType, ID } from '@audius/common/models'
import {} from '@audius/common'

export type EmbedModalState = {
  isOpen: boolean
  id: ID | null
  kind: PlayableType | null
}
