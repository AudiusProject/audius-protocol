import { ID, PlayableType } from 'models/common/Identifiers'

export type EmbedModalState = {
  isOpen: boolean
  id: ID | null
  kind: PlayableType | null
}
