import { ID } from '@audius/common'

import Kind from 'common/models/Kind'

export interface DragNDropState {
  dragging: boolean
  kind: Kind
  id: ID
}
