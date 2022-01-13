import { ID, PlayableType } from 'common/models/Identifiers'

export type EmbedModalState = {
  isOpen: boolean
  id: ID | null
  kind: PlayableType | null
}
