import { ID, PlayableType } from '@audius/common'

export type EmbedModalState = {
  isOpen: boolean
  id: ID | null
  kind: PlayableType | null
}
