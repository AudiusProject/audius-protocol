import { ID } from 'common/models/Identifiers'
import Kind from 'common/models/Kind'

export interface DragNDropState {
  dragging: boolean
  kind: Kind
  id: ID
}
