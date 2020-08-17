import { ID } from 'models/common/Identifiers'
import { Kind } from 'store/types'

export interface DragNDropState {
  dragging: boolean
  kind: Kind
  id: ID
}
