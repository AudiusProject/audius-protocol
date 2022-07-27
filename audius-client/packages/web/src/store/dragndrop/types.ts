import { Kind, ID } from '@audius/common'

export interface DragNDropState {
  dragging: boolean
  kind: Kind
  id: ID
}
