import { PlayableType, ID } from '@audius/common/models'

export type EmbedModalState = {
  isOpen: boolean
  id: ID | null
  kind: PlayableType | null
}
